import { HttpErrorResponse } from '@angular/common/http';
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
import { ActivatedRoute, RouterLink } from '@angular/router';

import { type ApiEnvelope } from '../../../core/api/api-envelope.model';
import { resolveApiErrorMessage } from '../../../core/api/api-error.util';
import { AuthApi } from '../../../core/auth/auth-api';
import {
  type AuthSessionResponse,
  type LoginRequest,
  type UnverifiedAccountLoginResponse,
  type VerifyAccountResponse,
} from '../../../core/auth/auth.models';
import { Icon } from '../../../shared/components/icon/icon';
import { SiteHeader } from '../../../shared/components/site-header/site-header';

type LoginFormControls = {
  usernameOrPrivateEmail: FormControl<string>;
  password: FormControl<string>;
};

type VerificationFormControls = {
  schoolEmail: FormControl<string>;
  code: FormControl<string>;
};

type LoginControlName = keyof LoginFormControls;

type UnverifiedAccount = {
  schoolEmail: string | null;
  username: string | null;
  message: string;
};

const RESEND_COOLDOWN_SECONDS = 5 * 60;

@Component({
  selector: 'app-login',
  imports: [Icon, RouterLink, ReactiveFormsModule, SiteHeader],
  templateUrl: './login.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly authApi = inject(AuthApi);
  private readonly route = inject(ActivatedRoute);

  private resendCooldownTimer: ReturnType<typeof setInterval> | null = null;

  readonly isSubmitting = signal(false);
  readonly isVerifying = signal(false);
  readonly isResendingCode = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly verificationErrorMessage = signal<string | null>(null);
  readonly verificationInfoMessage = signal<string | null>(null);
  readonly authenticatedSession = signal<AuthSessionResponse | null>(null);
  readonly unverifiedAccount = signal<UnverifiedAccount | null>(null);
  readonly verifiedAccount = signal<VerifyAccountResponse | null>(null);
  readonly resendCooldownSeconds = signal(0);

  readonly resendCooldownText = computed(() =>
    this.formatRemainingTime(this.resendCooldownSeconds()),
  );

  readonly canResendCode = computed(
    () =>
      this.resendCooldownSeconds() <= 0 &&
      !this.isResendingCode() &&
      this.verifiedAccount() === null,
  );

  readonly loginForm: FormGroup<LoginFormControls> = this.fb.nonNullable.group({
    usernameOrPrivateEmail: [
      '',
      [Validators.required, Validators.maxLength(320)],
    ],
    password: ['', [Validators.required, Validators.maxLength(256)]],
  });

  readonly verificationForm: FormGroup<VerificationFormControls> =
    this.fb.nonNullable.group({
      schoolEmail: [
        '',
        [Validators.required, Validators.email, Validators.maxLength(320)],
      ],
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

  constructor() {
    const username = this.route.snapshot.queryParamMap.get('username')?.trim();

    if (username) {
      this.loginForm.controls.usernameOrPrivateEmail.setValue(username);
    }
  }

  ngOnDestroy(): void {
    this.clearResendCooldownTimer();
  }

  isInvalid(controlName: LoginControlName): boolean {
    const control = this.loginForm.controls[controlName];

    return control.invalid && (control.dirty || control.touched);
  }

  isVerificationCodeInvalid(): boolean {
    const control = this.verificationForm.controls.code;

    return control.invalid && (control.dirty || control.touched);
  }

  isSchoolEmailInvalid(): boolean {
    const control = this.verificationForm.controls.schoolEmail;

    return control.invalid && (control.dirty || control.touched);
  }

  fieldError(controlName: LoginControlName): string | null {
    const control = this.loginForm.controls[controlName];

    if (!this.isInvalid(controlName)) {
      return null;
    }

    if (control.hasError('required')) {
      return controlName === 'password'
        ? 'Enter your password.'
        : 'Enter your username or private email.';
    }

    if (control.hasError('maxlength')) {
      return controlName === 'password'
        ? 'Password cannot exceed 256 characters.'
        : 'Username or email cannot exceed 320 characters.';
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

  schoolEmailError(): string | null {
    const control = this.verificationForm.controls.schoolEmail;

    if (!this.isSchoolEmailInvalid()) {
      return null;
    }

    if (control.hasError('required')) {
      return 'Enter your school email.';
    }

    if (control.hasError('email')) {
      return 'Enter a valid school email address.';
    }

    if (control.hasError('maxlength')) {
      return 'School email cannot exceed 320 characters.';
    }

    return 'Please check the school email.';
  }

  onSubmit(): void {
    this.errorMessage.set(null);
    this.clearVerificationState();

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const formValue = this.loginForm.getRawValue();
    const request: LoginRequest = {
      usernameOrPrivateEmail: formValue.usernameOrPrivateEmail.trim(),
      password: formValue.password,
    };

    this.isSubmitting.set(true);

    this.authApi.login(request).subscribe({
      next: (response) => {
        this.authenticatedSession.set(response);
        this.loginForm.reset();
      },
      error: (error: unknown) => {
        const unverifiedAccount = this.resolveUnverifiedAccount(error);

        if (unverifiedAccount) {
          this.showVerificationPanel(unverifiedAccount);
        } else {
          this.errorMessage.set(this.resolveErrorMessage(error));
        }

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

    const account = this.unverifiedAccount();
    if (!account) {
      this.verificationErrorMessage.set(
        'Log in first so we can find the account to verify.',
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
        schoolEmail: this.resolveVerificationSchoolEmail(),
        code: this.verificationForm.controls.code.value.trim(),
      })
      .subscribe({
        next: (response) => {
          this.verifiedAccount.set(response);
          this.verificationInfoMessage.set(response.message);
          this.verificationForm.reset();
          this.clearResendCooldownTimer();
          this.resendCooldownSeconds.set(0);
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

    const account = this.unverifiedAccount();
    if (!account) {
      this.verificationErrorMessage.set(
        'Log in first so we can find the account to verify.',
      );
      return;
    }

    if (this.verificationForm.controls.schoolEmail.invalid) {
      this.verificationForm.controls.schoolEmail.markAsTouched();
      return;
    }

    if (!this.canResendCode()) {
      return;
    }

    this.isResendingCode.set(true);

    this.authApi
      .sendCode({ schoolEmail: this.resolveVerificationSchoolEmail() })
      .subscribe({
        next: (message) => {
          this.verificationInfoMessage.set(message);
          this.verificationForm.controls.code.reset('');
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

          if (error instanceof HttpErrorResponse && error.status === 429) {
            this.startResendCooldown();
          }

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

  returnToLogin(): void {
    const account = this.unverifiedAccount();

    if (account?.username) {
      this.loginForm.controls.usernameOrPrivateEmail.setValue(account.username);
    }

    this.loginForm.controls.password.reset('');
    this.clearVerificationState();
  }

  useDifferentAccount(): void {
    this.loginForm.reset();
    this.clearVerificationState();
  }

  private showVerificationPanel(account: UnverifiedAccount): void {
    this.unverifiedAccount.set(account);
    this.verifiedAccount.set(null);
    this.verificationErrorMessage.set(null);
    this.verificationInfoMessage.set(account.message);
    this.verificationForm.reset({
      schoolEmail: account.schoolEmail ?? '',
      code: '',
    });
    this.loginForm.controls.usernameOrPrivateEmail.setValue(
      account.username ?? this.loginForm.controls.usernameOrPrivateEmail.value,
    );
    this.loginForm.controls.password.reset('');
  }

  private clearVerificationState(): void {
    this.clearResendCooldownTimer();
    this.resendCooldownSeconds.set(0);
    this.unverifiedAccount.set(null);
    this.verifiedAccount.set(null);
    this.verificationErrorMessage.set(null);
    this.verificationInfoMessage.set(null);
    this.verificationForm.reset();
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

  private clearResendCooldownTimer(): void {
    if (this.resendCooldownTimer) {
      clearInterval(this.resendCooldownTimer);
      this.resendCooldownTimer = null;
    }
  }

  private resolveVerificationSchoolEmail(): string {
    return (
      this.unverifiedAccount()?.schoolEmail ??
      this.verificationForm.controls.schoolEmail.value
    ).trim();
  }

  private formatRemainingTime(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  private resolveUnverifiedAccount(error: unknown): UnverifiedAccount | null {
    if (!(error instanceof HttpErrorResponse) || error.status !== 403) {
      return null;
    }

    const payload = error.error as
      | ApiEnvelope<UnverifiedAccountLoginResponse>
      | string
      | null;

    if (typeof payload === 'string') {
      return {
        schoolEmail: null,
        username: null,
        message: payload || 'Verify your school email before logging in.',
      };
    }

    const data = payload?.data;
    const schoolEmail = data?.schoolEmail ?? data?.SchoolEmail ?? null;
    const username = data?.username ?? data?.Username ?? null;
    const message =
      data?.message ??
      data?.Message ??
      payload?.message ??
      'Verify your school email before logging in.';

    return {
      schoolEmail,
      username,
      message,
    };
  }

  private resolveErrorMessage(
    error: unknown,
    fallbackMessage = 'Something went wrong while logging in. Please try again.',
    statusMessages: Partial<Record<number, string>> = {},
  ): string {
    return resolveApiErrorMessage(error, {
      fallbackMessage,
      statusMessages: {
        403: 'Your account must be verified before you can log in.',
        404: 'No account matches those credentials.',
        ...statusMessages,
      },
    });
  }
}
