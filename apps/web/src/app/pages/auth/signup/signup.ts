import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { TranslationService } from '../../../core/services/translation';
import { resolveApiErrorMessage } from '../../../core/types/api-error.util';
import { AuthApi } from '../../../core/services/auth-api';
import {
  type RegisterRequest,
  type VerifyAccountResponse,
} from '../../../core/types/auth.models';
import { passwordMatchValidator } from '../../../core/validators/password-match.validator';
import { Icon } from '../../../shared/components/icon/icon';
import { SiteHeader } from '../../../shared/components/site-header/site-header';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

type SignupFormControls = {
  fullName: FormControl<string>;
  username: FormControl<string>;
  privateEmail: FormControl<string>;
  schoolEmail: FormControl<string>;
  universityName: FormControl<string>;
  password: FormControl<string>;
  confirmPassword: FormControl<string>;
  termsAccepted: FormControl<boolean>;
};

type VerificationFormControls = {
  code: FormControl<string>;
};

type SignupControlName = keyof SignupFormControls;

type RegisteredAccount = {
  schoolEmail: string;
  username: string;
};

const RESEND_COOLDOWN_SECONDS = 5 * 60;
const LOGIN_REDIRECT_SECONDS = 5;

@Component({
  selector: 'app-signup',
  imports: [
    TranslatePipe,
    Icon, ReactiveFormsModule, RouterLink, SiteHeader],
  templateUrl: './signup.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Signup implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly authApi = inject(AuthApi);
  private readonly router = inject(Router);
  private readonly i18n = inject(TranslationService);

  private resendCooldownTimer: ReturnType<typeof setInterval> | null = null;
  private redirectTimer: ReturnType<typeof setInterval> | null = null;

  readonly isSubmitting = signal(false);
  readonly isVerifying = signal(false);
  readonly isResendingCode = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly verificationErrorMessage = signal<string | null>(null);
  readonly verificationInfoMessage = signal<string | null>(null);
  readonly registeredAccount = signal<RegisteredAccount | null>(null);
  readonly verifiedAccount = signal<VerifyAccountResponse | null>(null);
  readonly resendCooldownSeconds = signal(0);
  readonly redirectCountdownSeconds = signal(0);

  readonly resendCooldownText = computed(() =>
    this.formatRemainingTime(this.resendCooldownSeconds()),
  );

  readonly canResendCode = computed(
    () =>
      this.resendCooldownSeconds() <= 0 &&
      !this.isResendingCode() &&
      this.verifiedAccount() === null,
  );

  readonly signupForm: FormGroup<SignupFormControls> =
    this.fb.nonNullable.group(
      {
        fullName: [
          '',
          [
            Validators.required,
            Validators.minLength(2),
            Validators.maxLength(120),
          ],
        ],
        username: [
          '',
          [
            Validators.required,
            Validators.minLength(3),
            Validators.maxLength(30),
            Validators.pattern(
              /^[A-Za-z0-9](?:[A-Za-z0-9._-]{1,28}[A-Za-z0-9])?$/,
            ),
          ],
        ],
        privateEmail: [
          '',
          [Validators.required, Validators.email, Validators.maxLength(320)],
        ],
        schoolEmail: [
          '',
          [Validators.required, Validators.email, Validators.maxLength(320)],
        ],
        universityName: [
          '',
          [
            Validators.required,
            Validators.minLength(2),
            Validators.maxLength(200),
          ],
        ],
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.maxLength(256),
          ],
        ],
        confirmPassword: ['', [Validators.required]],
        termsAccepted: [false, [Validators.requiredTrue]],
      },
      { validators: passwordMatchValidator },
    );

  readonly verificationForm: FormGroup<VerificationFormControls> =
    this.fb.nonNullable.group({
      code: [
        '',
        [
          Validators.required,
          Validators.minLength(6),
          Validators.maxLength(6),
          Validators.pattern(/^\d{6}$/),
        ],
      ],
    });

  ngOnDestroy(): void {
    this.clearResendCooldownTimer();
    this.clearRedirectTimer();
  }

  isInvalid(controlName: SignupControlName): boolean {
    const control = this.signupForm.controls[controlName];

    return control.invalid && (control.dirty || control.touched);
  }

  isVerificationCodeInvalid(): boolean {
    const control = this.verificationForm.controls.code;

    return control.invalid && (control.dirty || control.touched);
  }

  fieldError(controlName: SignupControlName): string | null {
    const control = this.signupForm.controls[controlName];

    if (controlName === 'confirmPassword') {
      if (control.hasError('required') && (control.dirty || control.touched)) {
        return this.i18n.translate('validation.confirmPassword');
      }

      if (
        this.signupForm.hasError('passwordMismatch') &&
        (control.dirty || control.touched)
      ) {
        return this.i18n.translate('validation.passwordsDoNotMatch');
      }

      return null;
    }

    if (!this.isInvalid(controlName)) {
      return null;
    }

    if (control.hasError('required')) {
      return this.i18n.translate('validation.required');
    }

    if (control.hasError('requiredTrue')) {
      return this.i18n.translate('validation.acceptTerms');
    }

    if (control.hasError('email')) {
      return this.i18n.translate('validation.email');
    }

    if (control.hasError('minlength')) {
      return this.i18n.translate(
        controlName === 'password'
          ? 'validation.passwordMin'
          : 'validation.tooShort',
      );
    }

    if (control.hasError('maxlength')) {
      return this.i18n.translate('validation.tooLong');
    }

    if (control.hasError('pattern')) {
      return this.i18n.translate('validation.usernamePattern');
    }

    return this.i18n.translate('validation.checkField');
  }

  verificationCodeError(): string | null {
    const control = this.verificationForm.controls.code;

    if (!this.isVerificationCodeInvalid()) {
      return null;
    }

    if (control.hasError('required')) {
      return this.i18n.translate('validation.enterVerificationCode');
    }

    if (
      control.hasError('minlength') ||
      control.hasError('maxlength') ||
      control.hasError('pattern')
    ) {
      return this.i18n.translate('validation.exactlySixNumericDigits');
    }

    return this.i18n.translate('validation.checkVerificationCode');
  }

  onSubmit(): void {
    this.errorMessage.set(null);

    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    const formValue = this.signupForm.getRawValue();
    const request: RegisterRequest = {
      privateEmail: formValue.privateEmail.trim(),
      username: formValue.username.trim(),
      fullName: formValue.fullName.trim(),
      universityName: formValue.universityName.trim(),
      password: formValue.password,
      schoolEmail: formValue.schoolEmail.trim(),
    };

    this.isSubmitting.set(true);

    this.authApi.register(request).subscribe({
      next: (response) => {
        this.registeredAccount.set({
          schoolEmail: response.schoolEmail,
          username: response.username,
        });
        this.verifiedAccount.set(null);
        this.verificationErrorMessage.set(null);
        this.verificationInfoMessage.set(response.message);
        this.verificationForm.reset();
        this.signupForm.reset();
        this.startResendCooldown();
      },
      error: (error: unknown) => {
        this.errorMessage.set(this.resolveErrorMessage(error));
        this.isSubmitting.set(false);
      },
      complete: () => {
        this.isSubmitting.set(false);
      },
    });
  }

  onVerifyAccount(): void {
    this.verificationErrorMessage.set(null);
    this.verificationInfoMessage.set(null);

    const account = this.registeredAccount();
    if (!account) {
      this.verificationErrorMessage.set(
        'Create an account before entering a verification code.',
      );
      return;
    }

    if (this.verificationForm.invalid) {
      this.verificationForm.markAllAsTouched();
      return;
    }

    this.isVerifying.set(true);

    this.authApi
      .verifyAccount({
        schoolEmail: account.schoolEmail,
        code: this.verificationForm.controls.code.value.trim(),
      })
      .subscribe({
        next: (response) => {
          this.verifiedAccount.set(response);
          this.verificationInfoMessage.set(response.message);
          this.clearResendCooldownTimer();
          this.resendCooldownSeconds.set(0);
          this.startRedirectCountdown();
        },
        error: (error: unknown) => {
          this.verificationErrorMessage.set(
            this.resolveErrorMessage(
              error,
              'routes.signup.errors.verificationFailed',
              {
                409: 'routes.signup.errors.verificationAlreadyVerified',
              },
            ),
          );
          this.isVerifying.set(false);
        },
        complete: () => {
          this.isVerifying.set(false);
        },
      });
  }

  onResendCode(): void {
    this.verificationErrorMessage.set(null);
    this.verificationInfoMessage.set(null);

    const account = this.registeredAccount();
    if (!account) {
      this.verificationErrorMessage.set(
        this.i18n.translate('routes.signup.errors.verificationRequired'),
      );
      return;
    }

    if (!this.canResendCode()) {
      return;
    }

    this.isResendingCode.set(true);

    this.authApi.sendCode({ schoolEmail: account.schoolEmail }).subscribe({
      next: (message) => {
        this.verificationInfoMessage.set(message);
        this.verificationForm.reset();
        this.startResendCooldown();
      },
      error: (error: unknown) => {
        this.verificationErrorMessage.set(
          this.resolveErrorMessage(
            error,
            'routes.signup.errors.verificationCodeSendFailed',
            {
              404: 'routes.signup.errors.verificationAccountNotFound',
              409: 'routes.signup.errors.verificationAlreadyVerified',
              429: 'routes.signup.errors.verificationCodeRateLimited',
            },
          ),
        );
        this.isResendingCode.set(false);
      },
      complete: () => {
        this.isResendingCode.set(false);
      },
    });
  }

  normalizeVerificationCode(): void {
    const control = this.verificationForm.controls.code;
    const normalized = control.value.replace(/\D/g, '').slice(0, 6);

    if (normalized !== control.value) {
      control.setValue(normalized, { emitEvent: false });
    }
  }

  onRegisterAnotherAccount(): void {
    this.clearResendCooldownTimer();
    this.clearRedirectTimer();
    this.resendCooldownSeconds.set(0);
    this.redirectCountdownSeconds.set(0);
    this.errorMessage.set(null);
    this.verificationErrorMessage.set(null);
    this.verificationInfoMessage.set(null);
    this.registeredAccount.set(null);
    this.verifiedAccount.set(null);
    this.verificationForm.reset();
    this.signupForm.reset();
  }

  goToLoginNow(): void {
    this.clearRedirectTimer();
    this.redirectCountdownSeconds.set(0);
    this.navigateToLogin();
  }

  private startResendCooldown(seconds = RESEND_COOLDOWN_SECONDS): void {
    this.clearResendCooldownTimer();
    this.resendCooldownSeconds.set(seconds);
    this.resendCooldownTimer = setInterval(() => {
      const remainingSeconds = this.resendCooldownSeconds() - 1;
      this.resendCooldownSeconds.set(Math.max(remainingSeconds, 0));

      if (remainingSeconds <= 0) {
        this.clearResendCooldownTimer();
      }
    }, 1000);
  }

  private startRedirectCountdown(): void {
    this.clearRedirectTimer();
    this.redirectCountdownSeconds.set(LOGIN_REDIRECT_SECONDS);
    this.redirectTimer = setInterval(() => {
      const remainingSeconds = this.redirectCountdownSeconds() - 1;
      this.redirectCountdownSeconds.set(Math.max(remainingSeconds, 0));

      if (remainingSeconds <= 0) {
        this.clearRedirectTimer();
        this.navigateToLogin();
      }
    }, 1000);
  }

  private navigateToLogin(): void {
    const username = this.registeredAccount()?.username;
    void this.router.navigate(['/login'], {
      queryParams: username ? { username } : undefined,
    });
  }

  private clearResendCooldownTimer(): void {
    if (this.resendCooldownTimer) {
      clearInterval(this.resendCooldownTimer);
      this.resendCooldownTimer = null;
    }
  }

  private clearRedirectTimer(): void {
    if (this.redirectTimer) {
      clearInterval(this.redirectTimer);
      this.redirectTimer = null;
    }
  }

  private formatRemainingTime(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  private resolveErrorMessage(
    error: unknown,
    fallbackMessage = 'routes.signup.errors.createFailed',
    statusMessages: Partial<Record<number, string>> = {},
  ): string {
    const translatedStatusMessages = Object.fromEntries(
      Object.entries(statusMessages).map(([status, message]) => [
        Number(status),
        this.i18n.translate(message ?? ''),
      ]),
    );

    return resolveApiErrorMessage(error, {
      fallbackMessage: this.i18n.translate(fallbackMessage),
      statusMessages: {
        409: this.i18n.translate('routes.signup.anAccountAlreadyExistsWithOneOfThoseEmailsOrUsername'),
        ...translatedStatusMessages,
      },
    });
  }
}
