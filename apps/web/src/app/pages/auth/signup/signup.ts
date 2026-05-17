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

import { resolveApiErrorMessage } from '../../../core/api/api-error.util';
import { AuthApi } from '../../../core/auth/auth-api';
import {
  type RegisterRequest,
  type VerifyAccountResponse,
} from '../../../core/auth/auth.models';
import { passwordMatchValidator } from '../../../core/validators/password-match.validator';
import { Icon } from '../../../shared/components/icon/icon';
import { SiteHeader } from '../../../shared/components/site-header/site-header';

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
  imports: [Icon, ReactiveFormsModule, RouterLink, SiteHeader],
  templateUrl: './signup.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Signup implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly authApi = inject(AuthApi);
  private readonly router = inject(Router);

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
        return 'Confirm your password.';
      }

      if (
        this.signupForm.hasError('passwordMismatch') &&
        (control.dirty || control.touched)
      ) {
        return 'Passwords do not match.';
      }

      return null;
    }

    if (!this.isInvalid(controlName)) {
      return null;
    }

    if (control.hasError('required')) {
      return 'This field is required.';
    }

    if (control.hasError('requiredTrue')) {
      return 'Please accept the terms to continue.';
    }

    if (control.hasError('email')) {
      return 'Enter a valid email address.';
    }

    if (control.hasError('minlength')) {
      return controlName === 'password'
        ? 'Use at least 8 characters.'
        : 'This value is too short.';
    }

    if (control.hasError('maxlength')) {
      return 'This value is too long.';
    }

    if (control.hasError('pattern')) {
      return 'Use 3–30 characters: letters, numbers, dots, underscores, or hyphens. Start and end with a letter or number.';
    }

    return 'Please check this field.';
  }

  verificationCodeError(): string | null {
    const control = this.verificationForm.controls.code;

    if (!this.isVerificationCodeInvalid()) {
      return null;
    }

    if (control.hasError('required')) {
      return 'Enter the verification code.';
    }

    if (
      control.hasError('minlength') ||
      control.hasError('maxlength') ||
      control.hasError('pattern')
    ) {
      return 'Enter exactly 6 numeric digits.';
    }

    return 'Please check the verification code.';
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
              'We could not verify your account. Check the code and try again.',
              {
                409: 'This account is already verified. You can log in now.',
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
        'Create an account before requesting a new code.',
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
            'We could not send a new verification code. Please try again later.',
            {
              404: 'We could not find an account for that school email.',
              409: 'This account is already verified. You can log in now.',
              429: 'A verification code was sent recently. Please wait before requesting another one.',
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
    fallbackMessage = 'Something went wrong while creating your account. Please try again.',
    statusMessages: Partial<Record<number, string>> = {},
  ): string {
    return resolveApiErrorMessage(error, {
      fallbackMessage,
      statusMessages: {
        409: 'An account already exists with one of those emails or username.',
        ...statusMessages,
      },
    });
  }
}
