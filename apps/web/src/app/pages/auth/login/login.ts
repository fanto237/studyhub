import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
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
} from '../../../core/auth/auth.models';
import { Icon } from '../../../shared/components/icon/icon';
import {
  type LoginBackToLoginPayload,
  type UnverifiedAccount,
} from '../../../shared/components/login-flow.models';
import { LoginPasswordReset } from '../../../shared/components/login-password-reset/login-password-reset';
import { LoginVerification } from '../../../shared/components/login-verification/login-verification';
import { SiteHeader } from '../../../shared/components/site-header/site-header';

type LoginFormControls = {
  usernameOrPrivateEmail: FormControl<string>;
  password: FormControl<string>;
};

type LoginControlName = keyof LoginFormControls;

@Component({
  selector: 'app-login',
  imports: [
    Icon,
    LoginPasswordReset,
    LoginVerification,
    RouterLink,
    ReactiveFormsModule,
    SiteHeader,
  ],
  templateUrl: './login.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly authApi = inject(AuthApi);
  private readonly route = inject(ActivatedRoute);

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly authenticatedSession = signal<AuthSessionResponse | null>(null);
  readonly unverifiedAccount = signal<UnverifiedAccount | null>(null);
  readonly isPasswordResetMode = signal(false);
  readonly passwordResetInitialPrivateEmail = signal<string | null>(null);

  readonly loginForm: FormGroup<LoginFormControls> = this.fb.nonNullable.group({
    usernameOrPrivateEmail: [
      '',
      [Validators.required, Validators.maxLength(320)],
    ],
    password: ['', [Validators.required, Validators.maxLength(256)]],
  });

  constructor() {
    const username = this.route.snapshot.queryParamMap.get('username')?.trim();

    if (username) {
      this.loginForm.controls.usernameOrPrivateEmail.setValue(username);
    }
  }

  isInvalid(controlName: LoginControlName): boolean {
    const control = this.loginForm.controls[controlName];

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

  showPasswordReset(): void {
    this.errorMessage.set(null);
    this.clearVerificationState();
    this.isPasswordResetMode.set(true);

    const loginIdentifier =
      this.loginForm.controls.usernameOrPrivateEmail.value.trim();
    this.passwordResetInitialPrivateEmail.set(
      this.looksLikeEmail(loginIdentifier) ? loginIdentifier : null,
    );
  }

  returnToLogin(payload: LoginBackToLoginPayload = {}): void {
    const username = payload.username ?? this.unverifiedAccount()?.username;

    if (username) {
      this.loginForm.controls.usernameOrPrivateEmail.setValue(username);
    }

    this.loginForm.controls.password.reset('');
    this.clearVerificationState();
  }

  useDifferentAccount(): void {
    this.loginForm.reset();
    this.clearVerificationState();
    this.clearPasswordResetState();
  }

  returnToLoginFromPasswordReset(payload: LoginBackToLoginPayload = {}): void {
    if (payload.privateEmail) {
      this.loginForm.controls.usernameOrPrivateEmail.setValue(
        payload.privateEmail,
      );
    }

    this.loginForm.controls.password.reset('');
    this.clearPasswordResetState();
  }

  private showVerificationPanel(account: UnverifiedAccount): void {
    this.clearPasswordResetState();
    this.unverifiedAccount.set(account);
    this.loginForm.controls.usernameOrPrivateEmail.setValue(
      account.username ?? this.loginForm.controls.usernameOrPrivateEmail.value,
    );
    this.loginForm.controls.password.reset('');
  }

  private clearVerificationState(): void {
    this.unverifiedAccount.set(null);
  }

  private clearPasswordResetState(): void {
    this.isPasswordResetMode.set(false);
    this.passwordResetInitialPrivateEmail.set(null);
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

  private looksLikeEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }
}
