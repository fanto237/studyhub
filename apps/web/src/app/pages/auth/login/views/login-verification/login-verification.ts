import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { AuthApi } from '../../../../../core/services/auth-api';
import { resolveApiErrorMessage } from '../../../../../core/types/api-error.util';
import { type VerifyAccountResponse } from '../../../../../core/types/auth.models';
import {
  type LoginBackToLoginPayload,
  type UnverifiedAccount,
} from '../../../../../core/types/login-flow.models';
import { Icon } from '../../../../../shared/components/icon/icon';

type VerificationFormControls = {
  schoolEmail: FormControl<string>;
  code: FormControl<string>;
};

const RESEND_COOLDOWN_SECONDS = 5 * 60;

@Component({
  selector: 'app-login-verification',
  imports: [Icon, ReactiveFormsModule],
  templateUrl: './login-verification.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginVerification implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly authApi = inject(AuthApi);

  private resendCooldownTimer: ReturnType<typeof setInterval> | null = null;

  readonly account = input.required<UnverifiedAccount>();
  readonly backToLogin = output<LoginBackToLoginPayload>();
  readonly useDifferentAccount = output<void>();

  readonly isVerifying = signal(false);
  readonly isResendingCode = signal(false);
  readonly verificationErrorMessage = signal<string | null>(null);
  readonly verificationInfoMessage = signal<string | null>(null);
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
    effect(() => {
      const account = this.account();

      this.verificationInfoMessage.set(account.message);
      this.verificationErrorMessage.set(null);
      this.verifiedAccount.set(null);
      this.clearResendCooldownTimer();
      this.resendCooldownSeconds.set(0);
      this.verificationForm.reset({
        schoolEmail: account.schoolEmail ?? '',
        code: '',
      });
    });
  }

  ngOnDestroy(): void {
    this.clearResendCooldownTimer();
  }

  isVerificationCodeInvalid(): boolean {
    const control = this.verificationForm.controls.code;

    return control.invalid && (control.dirty || control.touched);
  }

  isSchoolEmailInvalid(): boolean {
    const control = this.verificationForm.controls.schoolEmail;

    return control.invalid && (control.dirty || control.touched);
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

  onVerifyAccount(): void {
    this.verificationErrorMessage.set(null);
    this.verificationInfoMessage.set(null);

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

  onBackToLogin(): void {
    this.backToLogin.emit({ username: this.account().username });
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
      this.account().schoolEmail ??
      this.verificationForm.controls.schoolEmail.value
    ).trim();
  }

  private formatRemainingTime(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  private resolveErrorMessage(
    error: unknown,
    fallbackMessage: string,
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
