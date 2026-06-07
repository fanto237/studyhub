import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthSessionStore } from '../../../core/services/auth-session-store';
import { type ApiEnvelope } from '../../../core/types/api-envelope.model';
import { TranslationService } from '../../../core/services/translation';
import { resolveApiErrorMessage } from '../../../core/types/api-error.util';
import {
  isTwoFactorRequiredLoginResponse,
  LoginResponse,
  type LoginRequest,
  type TwoFactorRequiredLoginResponse,
  type UnverifiedAccountLoginResponse,
} from '../../../core/types/auth.models';
import {
  type LoginBackToLoginPayload,
  type UnverifiedAccount,
} from '../../../core/types/login-flow.models';
import { Icon } from '../../../shared/components/icon/icon';
import { SiteHeader } from '../../../shared/components/site-header/site-header';
import { LoginPasswordReset } from './views/login-password-reset/login-password-reset';
import { LoginVerification } from './views/login-verification/login-verification';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

type LoginFormControls = {
  usernameOrPrivateEmail: FormControl<string>;
  password: FormControl<string>;
};

type LoginControlName = keyof LoginFormControls;

type TotpFormControls = {
  code: FormControl<string>;
};

@Component({
  selector: 'app-login',
  imports: [
    TranslatePipe,
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
export class Login implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authSession = inject(AuthSessionStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly i18n = inject(TranslationService);

  readonly isSubmitting = signal(false);
  readonly isCheckingExistingSession = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly isAuthenticated = this.authSession.isAuthenticated;
  readonly sessionUser = this.authSession.displayUser;
  readonly unverifiedAccount = signal<UnverifiedAccount | null>(null);

  readonly twoFactorChallenge = signal<TwoFactorRequiredLoginResponse | null>(
    null,
  );
  readonly isPasswordResetMode = signal(false);
  readonly passwordResetInitialPrivateEmail = signal<string | null>(null);
  readonly isSubmittingTotp = signal(false);
  readonly totpErrorMessage = signal<string | null>(null);

  readonly loginForm: FormGroup<LoginFormControls> = this.fb.nonNullable.group({
    usernameOrPrivateEmail: [
      '',
      [Validators.required, Validators.maxLength(320)],
    ],
    password: ['', [Validators.required, Validators.maxLength(256)]],
  });

  readonly totpForm: FormGroup<TotpFormControls> = this.fb.nonNullable.group({
    code: [
      '',
      [
        Validators.required,
        Validators.pattern(/^\d{6}$/),
        Validators.maxLength(6),
      ],
    ],
  });

  constructor() {
    const username = this.route.snapshot.queryParamMap.get('username')?.trim();

    if (username) {
      this.loginForm.controls.usernameOrPrivateEmail.setValue(username);
    }
  }

  ngOnInit(): void {
    if (
      this.authSession.hasCheckedSession() &&
      !this.authSession.isAuthenticated()
    ) {
      this.isCheckingExistingSession.set(false);
      return;
    }

    this.authSession.checkSession().subscribe({
      next: () => {
        if (this.authSession.isAuthenticated()) {
          void this.navigateAfterAuthentication();
        }
      },
      complete: () => {
        this.isCheckingExistingSession.set(false);
      },
    });
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
      return this.i18n.translate(
        controlName === 'password'
          ? 'validation.enterPassword'
          : 'validation.enterLoginIdentifier',
      );
    }

    if (control.hasError('maxlength')) {
      return this.i18n.translate(
        controlName === 'password'
          ? 'validation.passwordMax'
          : 'validation.loginIdentifierMax',
      );
    }

    return this.i18n.translate('validation.checkField');
  }

  onSubmit(): void {
    this.errorMessage.set(null);
    this.clearVerificationState();
    this.clearTwoFactorState();

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

    this.authSession.login(request).subscribe({
      next: (response: LoginResponse) => {
        if (isTwoFactorRequiredLoginResponse(response)) {
          this.showTwoFactorPanel(response);
          return;
        }

        this.loginForm.reset();
        void this.navigateAfterAuthentication();
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

  onSubmitTotp(): void {
    this.totpErrorMessage.set(null);

    const challenge = this.twoFactorChallenge();
    if (!challenge) {
      this.clearTwoFactorState();
      return;
    }

    if (this.totpForm.invalid) {
      this.totpForm.markAllAsTouched();
      return;
    }

    this.isSubmittingTotp.set(true);

    this.authSession
      .completeTotpLogin({
        challengeId: challenge.challengeId,
        code: this.totpForm.controls.code.value.trim(),
      })
      .subscribe({
        next: () => {
          this.loginForm.reset();
          this.clearTwoFactorState();
          void this.navigateAfterAuthentication();
        },
        error: (error: unknown) => {
          this.totpErrorMessage.set(
            this.resolveErrorMessage(
              error,
              'routes.login.errors.totpVerificationFailed',
              {
                401: 'routes.login.errors.totpInvalidOrExpired',
                409: 'routes.login.errors.totpAlreadyUsed',
                429: 'routes.login.errors.totpTooManyInvalid',
              },
            ),
          );
          this.isSubmittingTotp.set(false);
        },
        complete: () => {
          this.isSubmittingTotp.set(false);
        },
      });
  }

  isTotpInvalid(): boolean {
    const control = this.totpForm.controls.code;

    return control.invalid && (control.dirty || control.touched);
  }

  totpFieldError(): string | null {
    const control = this.totpForm.controls.code;

    if (!this.isTotpInvalid()) {
      return null;
    }

    if (control.hasError('required')) {
      return this.i18n.translate('validation.enterAuthenticatorCode');
    }

    return this.i18n.translate('validation.exactlySixDigits');
  }

  showPasswordReset(): void {
    this.errorMessage.set(null);
    this.clearVerificationState();
    this.clearTwoFactorState();
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
    this.clearTwoFactorState();
  }

  useDifferentAccount(): void {
    this.loginForm.reset();
    this.clearVerificationState();
    this.clearPasswordResetState();
    this.clearTwoFactorState();
  }

  returnToLoginFromPasswordReset(payload: LoginBackToLoginPayload = {}): void {
    if (payload.privateEmail) {
      this.loginForm.controls.usernameOrPrivateEmail.setValue(
        payload.privateEmail,
      );
    }

    this.loginForm.controls.password.reset('');
    this.clearPasswordResetState();
    this.clearTwoFactorState();
  }

  private navigateAfterAuthentication(): Promise<boolean> {
    return this.router.navigateByUrl(this.resolveSafeReturnUrl() ?? '/home');
  }

  private resolveSafeReturnUrl(): string | null {
    const returnUrl = this.route.snapshot.queryParamMap
      .get('returnUrl')
      ?.trim();

    if (
      !returnUrl ||
      !returnUrl.startsWith('/') ||
      returnUrl.startsWith('//')
    ) {
      return null;
    }

    const pathWithoutQuery = returnUrl.split('?', 1)[0].replace(/\/$/, '');

    if (pathWithoutQuery === '/login' || pathWithoutQuery === '/signup') {
      return null;
    }

    return returnUrl;
  }

  private showVerificationPanel(account: UnverifiedAccount): void {
    this.clearPasswordResetState();
    this.clearTwoFactorState();
    this.unverifiedAccount.set(account);
    this.loginForm.controls.usernameOrPrivateEmail.setValue(
      account.username ?? this.loginForm.controls.usernameOrPrivateEmail.value,
    );
    this.loginForm.controls.password.reset('');
  }

  private showTwoFactorPanel(challenge: TwoFactorRequiredLoginResponse): void {
    this.clearPasswordResetState();
    this.clearVerificationState();
    this.errorMessage.set(null);
    this.twoFactorChallenge.set(challenge);
    this.totpForm.reset({ code: '' });
    this.loginForm.controls.password.reset('');
  }

  private clearVerificationState(): void {
    this.unverifiedAccount.set(null);
  }

  private clearTwoFactorState(): void {
    this.twoFactorChallenge.set(null);
    this.totpErrorMessage.set(null);
    this.totpForm.reset({ code: '' });
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
        message:
          payload ||
          this.i18n.translate('routes.login.errors.verifySchoolEmailBeforeLogin'),
      };
    }

    const data = payload?.data;
    const schoolEmail = data?.schoolEmail ?? data?.SchoolEmail ?? null;
    const username = data?.username ?? data?.Username ?? null;
    const message =
      data?.message ??
      data?.Message ??
      payload?.message ??
      this.i18n.translate('routes.login.errors.verifySchoolEmailBeforeLogin');

    return {
      schoolEmail,
      username,
      message,
    };
  }

  private resolveErrorMessage(
    error: unknown,
    fallbackMessage = 'routes.login.errors.loginFailed',
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
        403: this.i18n.translate('common.auth.accountMustBeVerified'),
        404: this.i18n.translate('common.auth.noAccountMatchesCredentials'),
        ...translatedStatusMessages,
      },
    });
  }

  private looksLikeEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }
}
