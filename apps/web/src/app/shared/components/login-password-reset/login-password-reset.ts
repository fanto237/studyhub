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

import { resolveApiErrorMessage } from '../../../core/api/api-error.util';
import { AuthApi } from '../../../core/auth/auth-api';
import { passwordMatchValidator } from '../../../core/validators/password-match.validator';
import { Icon } from '../icon/icon';
import { type LoginBackToLoginPayload } from '../login-flow.models';

type PasswordResetRequestFormControls = {
  privateEmail: FormControl<string>;
};

type PasswordResetFormControls = {
  code: FormControl<string>;
  password: FormControl<string>;
  confirmPassword: FormControl<string>;
};

type PasswordResetControlName = keyof PasswordResetFormControls;
type PasswordResetStep = 'request' | 'reset' | 'success';

const RESEND_COOLDOWN_SECONDS = 5 * 60;

@Component({
  selector: 'app-login-password-reset',
  imports: [Icon, ReactiveFormsModule],
  templateUrl: './login-password-reset.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPasswordReset implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly authApi = inject(AuthApi);

  private passwordResetCooldownTimer: ReturnType<typeof setInterval> | null =
    null;

  readonly initialPrivateEmail = input<string | null>(null);
  readonly backToLogin = output<LoginBackToLoginPayload>();

  readonly passwordResetStep = signal<PasswordResetStep>('request');
  readonly isRequestingPasswordReset = signal(false);
  readonly isResettingPassword = signal(false);
  readonly passwordResetErrorMessage = signal<string | null>(null);
  readonly passwordResetInfoMessage = signal<string | null>(null);
  readonly passwordResetEmail = signal<string | null>(null);
  readonly passwordResetCooldownSeconds = signal(0);

  readonly passwordResetCooldownText = computed(() =>
    this.formatRemainingTime(this.passwordResetCooldownSeconds()),
  );

  readonly canRequestPasswordResetCode = computed(
    () =>
      this.passwordResetCooldownSeconds() <= 0 &&
      !this.isRequestingPasswordReset() &&
      this.passwordResetStep() !== 'success',
  );

  readonly passwordResetRequestForm: FormGroup<PasswordResetRequestFormControls> =
    this.fb.nonNullable.group({
      privateEmail: [
        '',
        [Validators.required, Validators.email, Validators.maxLength(320)],
      ],
    });

  readonly passwordResetForm: FormGroup<PasswordResetFormControls> =
    this.fb.nonNullable.group(
      {
        code: [
          '',
          [
            Validators.required,
            Validators.minLength(6),
            Validators.maxLength(6),
            Validators.pattern(/^\d{6}$/),
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
      },
      { validators: passwordMatchValidator },
    );

  constructor() {
    effect(() => {
      const initialPrivateEmail = this.initialPrivateEmail();

      if (initialPrivateEmail && this.passwordResetStep() === 'request') {
        this.passwordResetRequestForm.controls.privateEmail.setValue(
          initialPrivateEmail,
        );
      }
    });
  }

  ngOnDestroy(): void {
    this.clearPasswordResetCooldownTimer();
  }

  isPasswordResetEmailInvalid(): boolean {
    const control = this.passwordResetRequestForm.controls.privateEmail;

    return control.invalid && (control.dirty || control.touched);
  }

  isPasswordResetCodeInvalid(): boolean {
    const control = this.passwordResetForm.controls.code;

    return control.invalid && (control.dirty || control.touched);
  }

  isPasswordResetFieldInvalid(controlName: PasswordResetControlName): boolean {
    const control = this.passwordResetForm.controls[controlName];

    return control.invalid && (control.dirty || control.touched);
  }

  passwordResetEmailError(): string | null {
    const control = this.passwordResetRequestForm.controls.privateEmail;

    if (!this.isPasswordResetEmailInvalid()) {
      return null;
    }

    if (control.hasError('required')) {
      return 'Enter your private email.';
    }

    if (control.hasError('email')) {
      return 'Enter a valid private email address.';
    }

    if (control.hasError('maxlength')) {
      return 'Private email cannot exceed 320 characters.';
    }

    return 'Please check the private email.';
  }

  passwordResetCodeError(): string | null {
    const control = this.passwordResetForm.controls.code;

    if (!this.isPasswordResetCodeInvalid()) {
      return null;
    }

    if (control.hasError('required')) {
      return 'Enter the password reset code.';
    }

    if (
      control.hasError('minlength') ||
      control.hasError('maxlength') ||
      control.hasError('pattern')
    ) {
      return 'Enter exactly 6 numeric digits.';
    }

    return 'Please check the reset code.';
  }

  passwordResetFieldError(
    controlName: Exclude<PasswordResetControlName, 'code'>,
  ): string | null {
    const control = this.passwordResetForm.controls[controlName];

    if (controlName === 'confirmPassword') {
      if (control.hasError('required') && (control.dirty || control.touched)) {
        return 'Confirm your new password.';
      }

      if (
        this.passwordResetForm.hasError('passwordMismatch') &&
        (control.dirty || control.touched)
      ) {
        return 'Passwords do not match.';
      }

      return null;
    }

    if (!this.isPasswordResetFieldInvalid(controlName)) {
      return null;
    }

    if (control.hasError('required')) {
      return 'Enter a new password.';
    }

    if (control.hasError('minlength')) {
      return 'Use at least 8 characters.';
    }

    if (control.hasError('maxlength')) {
      return 'Password cannot exceed 256 characters.';
    }

    return 'Please check this field.';
  }

  onRequestPasswordReset(): void {
    this.passwordResetErrorMessage.set(null);
    this.passwordResetInfoMessage.set(null);

    if (this.passwordResetRequestForm.invalid) {
      this.passwordResetRequestForm.markAllAsTouched();
      return;
    }

    if (!this.canRequestPasswordResetCode()) {
      return;
    }

    const privateEmail =
      this.passwordResetRequestForm.controls.privateEmail.value.trim();
    this.sendPasswordResetCode(privateEmail);
  }

  onResendPasswordResetCode(): void {
    this.passwordResetErrorMessage.set(null);
    this.passwordResetInfoMessage.set(null);

    const privateEmail = this.passwordResetEmail();
    if (!privateEmail) {
      this.passwordResetStep.set('request');
      this.passwordResetErrorMessage.set(
        'Enter your private email before requesting a new reset code.',
      );
      return;
    }

    if (!this.canRequestPasswordResetCode()) {
      return;
    }

    this.sendPasswordResetCode(privateEmail);
  }

  onResetPassword(): void {
    this.passwordResetErrorMessage.set(null);
    this.passwordResetInfoMessage.set(null);

    const privateEmail = this.passwordResetEmail();
    if (!privateEmail) {
      this.passwordResetStep.set('request');
      this.passwordResetErrorMessage.set(
        'Enter your private email before setting a new password.',
      );
      return;
    }

    if (this.passwordResetForm.invalid) {
      this.passwordResetForm.markAllAsTouched();
      return;
    }

    const formValue = this.passwordResetForm.getRawValue();
    this.isResettingPassword.set(true);

    this.authApi
      .resetPassword({
        privateEmail,
        code: formValue.code.trim(),
        newPassword: formValue.password,
      })
      .subscribe({
        next: (response) => {
          this.passwordResetStep.set('success');
          this.passwordResetInfoMessage.set(response.message);
          this.passwordResetForm.reset();
          this.clearPasswordResetCooldownTimer();
          this.passwordResetCooldownSeconds.set(0);
        },
        error: (error: unknown) => {
          this.passwordResetErrorMessage.set(
            this.resolvePasswordResetErrorMessage(
              error,
              'We could not reset your password. Check the code and try again.',
            ),
          );
          this.isResettingPassword.set(false);
        },
        complete: () => {
          this.isResettingPassword.set(false);
        },
      });
  }

  normalizePasswordResetCode(): void {
    const control = this.passwordResetForm.controls.code;
    const normalized = control.value.replace(/\D/g, '').slice(0, 6);

    if (normalized !== control.value) {
      control.setValue(normalized, { emitEvent: false });
    }
  }

  onBackToLogin(): void {
    const privateEmail =
      this.passwordResetEmail() ??
      this.passwordResetRequestForm.controls.privateEmail.value.trim();

    this.backToLogin.emit({ privateEmail });
  }

  private sendPasswordResetCode(privateEmail: string): void {
    this.isRequestingPasswordReset.set(true);

    this.authApi.requestPasswordReset({ privateEmail }).subscribe({
      next: (response) => {
        this.passwordResetEmail.set(privateEmail);
        this.passwordResetRequestForm.controls.privateEmail.setValue(
          privateEmail,
        );
        this.passwordResetStep.set('reset');
        this.passwordResetInfoMessage.set(response.message);
        this.passwordResetForm.reset();
        this.startPasswordResetCooldown();
      },
      error: (error: unknown) => {
        this.passwordResetErrorMessage.set(
          this.resolvePasswordResetErrorMessage(
            error,
            'We could not send a password reset code. Please try again later.',
          ),
        );

        if (error instanceof HttpErrorResponse && error.status === 429) {
          this.startPasswordResetCooldown();
        }

        this.isRequestingPasswordReset.set(false);
      },
      complete: () => {
        this.isRequestingPasswordReset.set(false);
      },
    });
  }

  private startPasswordResetCooldown(seconds = RESEND_COOLDOWN_SECONDS): void {
    this.clearPasswordResetCooldownTimer();
    this.passwordResetCooldownSeconds.set(seconds);
    this.passwordResetCooldownTimer = setInterval(() => {
      const remainingSeconds = this.passwordResetCooldownSeconds() - 1;
      this.passwordResetCooldownSeconds.set(Math.max(remainingSeconds, 0));

      if (remainingSeconds <= 0) {
        this.clearPasswordResetCooldownTimer();
      }
    }, 1000);
  }

  private clearPasswordResetCooldownTimer(): void {
    if (this.passwordResetCooldownTimer) {
      clearInterval(this.passwordResetCooldownTimer);
      this.passwordResetCooldownTimer = null;
    }
  }

  private formatRemainingTime(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  private resolvePasswordResetErrorMessage(
    error: unknown,
    fallbackMessage: string,
  ): string {
    return resolveApiErrorMessage(error, {
      fallbackMessage,
      statusMessages: {
        400: 'The reset code is invalid or expired. Request a new code and try again.',
        429: 'A reset code was sent recently. Please wait before requesting another one.',
        503: 'StudyHub could not send email right now. Please try again later.',
      },
    });
  }
}
