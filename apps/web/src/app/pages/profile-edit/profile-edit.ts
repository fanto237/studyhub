import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  type AbstractControl,
  type FormControl,
  type FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  type ValidationErrors,
  type ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthApi } from '../../core/services/auth-api';
import { AuthSessionStore } from '../../core/services/auth-session-store';
import { UsersApi } from '../../core/services/users-api';
import { TranslationService } from '../../core/services/translation';
import { resolveApiErrorMessage } from '../../core/types/api-error.util';
import { type TotpSetupResponse } from '../../core/types/auth.models';
import {
  type CurrentUserResponse,
  type UpdateCurrentUserRequest,
} from '../../core/types/users.models';
import { Icon } from '../../shared/components/icon/icon';
import { MobileDock } from '../../shared/components/mobile-dock/mobile-dock';
import { ThemeToggle } from '../../shared/components/theme-toggle/theme-toggle';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { LanguageSelector } from '../../shared/components/language-selector/language-selector';

const USERNAME_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9._-]{1,28}[A-Za-z0-9])?$/;

type ProfileEditFormControls = {
  fullName: FormControl<string>;
  username: FormControl<string>;
  privateEmail: FormControl<string>;
};

type ProfileEditControlName = keyof ProfileEditFormControls;

type EnableTotpFormControls = {
  code: FormControl<string>;
};

type DisableTotpFormControls = {
  password: FormControl<string>;
  code: FormControl<string>;
};

type TotpSetupView = TotpSetupResponse & {
  qrCodeDataUrl: string | null;
};

type QrCodeApi = typeof import('qrcode');
type QrCodeModule = QrCodeApi & { default?: QrCodeApi };

type InitialsSource = Pick<CurrentUserResponse, 'fullName' | 'username'>;

@Component({
  selector: 'app-profile-edit',
  imports: [
    LanguageSelector,
    TranslatePipe,
    DatePipe,
    Icon,
    MobileDock,
    ReactiveFormsModule,
    RouterLink,
    ThemeToggle,
  ],
  templateUrl: './profile-edit.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileEdit implements OnInit {
  private readonly authApi = inject(AuthApi);
  private readonly authSession = inject(AuthSessionStore);
  private readonly usersApi = inject(UsersApi);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);
  readonly i18n = inject(TranslationService);

  readonly profileForm: FormGroup<ProfileEditFormControls> = this.fb.group({
    fullName: [
      '',
      [
        trimmedRequiredValidator(),
        trimmedMinLengthValidator(2),
        Validators.maxLength(120),
      ],
    ],
    username: [
      '',
      [
        trimmedRequiredValidator(),
        Validators.minLength(3),
        Validators.maxLength(30),
        Validators.pattern(USERNAME_PATTERN),
      ],
    ],
    privateEmail: [
      '',
      [trimmedRequiredValidator(), Validators.email, Validators.maxLength(320)],
    ],
  });

  readonly enableTotpForm: FormGroup<EnableTotpFormControls> = this.fb.group({
    code: [
      '',
      [
        Validators.required,
        Validators.pattern(/^\d{6}$/),
        Validators.maxLength(6),
      ],
    ],
  });

  readonly disableTotpForm: FormGroup<DisableTotpFormControls> = this.fb.group({
    password: ['', [Validators.required, Validators.maxLength(256)]],
    code: [
      '',
      [
        Validators.required,
        Validators.pattern(/^\d{6}$/),
        Validators.maxLength(6),
      ],
    ],
  });

  private readonly savedProfileValue = signal<UpdateCurrentUserRequest | null>(
    null,
  );

  readonly currentUser = signal<CurrentUserResponse | null>(null);
  readonly formValue = signal<UpdateCurrentUserRequest>(this.readFormValue());
  readonly isFormInvalid = signal(this.profileForm.invalid);

  readonly isLoadingUser = signal(true);
  readonly isSaving = signal(false);
  readonly isStartingTotpSetup = signal(false);
  readonly isGeneratingTotpQr = signal(false);
  readonly isEnablingTotp = signal(false);
  readonly isDisablingTotp = signal(false);
  readonly loadErrorMessage = signal<string | null>(null);
  readonly saveErrorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly totpSetup = signal<TotpSetupView | null>(null);
  readonly totpErrorMessage = signal<string | null>(null);
  readonly totpSuccessMessage = signal<string | null>(null);

  readonly hasChanges = computed(() => {
    const savedProfileValue = this.savedProfileValue();

    return savedProfileValue
      ? !haveSameProfileValues(this.formValue(), savedProfileValue)
      : false;
  });

  readonly canSave = computed(
    () =>
      !this.isLoadingUser() &&
      !this.isSaving() &&
      !this.isFormInvalid() &&
      this.hasChanges(),
  );

  constructor() {
    this.profileForm.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.formValue.set(this.readFormValue());
      this.isFormInvalid.set(this.profileForm.invalid);

      if (this.successMessage()) {
        this.successMessage.set(null);
      }
    });

    this.profileForm.statusChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.isFormInvalid.set(this.profileForm.invalid);
    });
  }

  ngOnInit(): void {
    this.loadCurrentUser();
  }

  retryProfile(): void {
    this.loadCurrentUser();
  }

  onSubmit(): void {
    this.saveErrorMessage.set(null);
    this.successMessage.set(null);

    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      this.isFormInvalid.set(true);
      return;
    }

    if (!this.hasChanges()) {
      return;
    }

    this.isSaving.set(true);

    this.usersApi
      .updateCurrentUser(this.buildUpdateRequest())
      .pipe(
        finalize(() => {
          this.isSaving.set(false);
        }),
      )
      .subscribe({
        next: (user) => {
          this.currentUser.set(user);
          this.authSession.updateCurrentUser(user);
          this.resetFormFromUser(user);
          this.successMessage.set(this.i18n.translate('routes.profileEdit.yourProfileSettingsWereUpdated'));
        },
        error: (error: unknown) => {
          if (this.redirectToLoginIfUnauthorized(error)) {
            return;
          }

          this.saveErrorMessage.set(
            resolveApiErrorMessage(error, {
              fallbackMessage:
                this.i18n.translate('routes.profileEdit.yourProfileChangesCouldNotBeSavedPleaseTryAgain'),
              statusMessages: {
                409: this.i18n.translate('routes.profileEdit.thatUsernameOrPrivateEmailIsAlreadyInUse'),
              },
            }),
          );
        },
      });
  }

  startTotpSetup(): void {
    this.totpErrorMessage.set(null);
    this.totpSuccessMessage.set(null);
    this.isStartingTotpSetup.set(true);

    this.authApi
      .startTotpSetup()
      .pipe(
        finalize(() => {
          this.isStartingTotpSetup.set(false);
        }),
      )
      .subscribe({
        next: (setup) => {
          const setupView: TotpSetupView = {
            ...setup,
            qrCodeDataUrl: null,
          };

          this.totpSetup.set(setupView);
          this.enableTotpForm.reset({ code: '' });
          this.totpSuccessMessage.set(
            this.i18n.translate('routes.profileEdit.scanTheQrCodeOrEnterTheSetupKeyInYourAuthenticatorAppThenConfirmThe6DigitCode'),
          );
          void this.generateTotpQrCode(setupView);
        },
        error: (error: unknown) => {
          if (this.redirectToLoginIfUnauthorized(error)) {
            return;
          }

          this.totpErrorMessage.set(
            resolveApiErrorMessage(error, {
              fallbackMessage:
                this.i18n.translate('routes.profileEdit.authenticatorSetupCouldNotBeStartedPleaseTryAgain'),
              statusMessages: {
                409: this.i18n.translate('routes.profileEdit.twoFactorAuthenticationIsAlreadyEnabled'),
              },
            }),
          );
        },
      });
  }

  enableTotp(): void {
    this.totpErrorMessage.set(null);
    this.totpSuccessMessage.set(null);

    if (this.enableTotpForm.invalid) {
      this.enableTotpForm.markAllAsTouched();
      return;
    }

    this.isEnablingTotp.set(true);

    this.authApi
      .enableTotp({ code: this.enableTotpForm.controls.code.value.trim() })
      .pipe(
        finalize(() => {
          this.isEnablingTotp.set(false);
        }),
      )
      .subscribe({
        next: (status) => {
          this.applyTotpStatus(status.isTotpEnabled, status.totpEnabledAt);
          this.totpSetup.set(null);
          this.enableTotpForm.reset({ code: '' });
          this.disableTotpForm.reset({ password: '', code: '' });
          this.totpSuccessMessage.set(
            this.i18n.translate('routes.profileEdit.twoFactorAuthenticationIsNowEnabled'),
          );
        },
        error: (error: unknown) => {
          if (this.redirectToLoginIfUnauthorized(error)) {
            return;
          }

          this.totpErrorMessage.set(
            resolveApiErrorMessage(error, {
              fallbackMessage:
                this.i18n.translate('routes.profileEdit.theAuthenticatorCodeCouldNotBeVerifiedPleaseTryAgain'),
              statusMessages: {
                400: this.i18n.translate('validation.enterCurrentAuthenticatorCode'),
                409: this.i18n.translate('routes.profileEdit.thatAuthenticatorCodeWasAlreadyUsedOrSetupIsNotReady'),
                410: this.i18n.translate('routes.profileEdit.theSetupExpiredStartAgainAndScanTheNewQrCode'),
              },
            }),
          );
        },
      });
  }

  disableTotp(): void {
    this.totpErrorMessage.set(null);
    this.totpSuccessMessage.set(null);

    if (this.disableTotpForm.invalid) {
      this.disableTotpForm.markAllAsTouched();
      return;
    }

    this.isDisablingTotp.set(true);

    this.authApi
      .disableTotp({
        password: this.disableTotpForm.controls.password.value,
        code: this.disableTotpForm.controls.code.value.trim(),
      })
      .pipe(
        finalize(() => {
          this.isDisablingTotp.set(false);
        }),
      )
      .subscribe({
        next: (status) => {
          this.applyTotpStatus(status.isTotpEnabled, status.totpEnabledAt);
          this.disableTotpForm.reset({ password: '', code: '' });
          this.totpSuccessMessage.set(
            this.i18n.translate('routes.profileEdit.twoFactorAuthenticationIsNowDisabled'),
          );
        },
        error: (error: unknown) => {
          if (this.redirectToLoginIfUnauthorized(error)) {
            return;
          }

          this.totpErrorMessage.set(
            resolveApiErrorMessage(error, {
              fallbackMessage:
                this.i18n.translate('routes.profileEdit.twoFactorAuthenticationCouldNotBeDisabledPleaseTryAgain'),
              statusMessages: {
                400: this.i18n.translate('routes.profileEdit.checkYourPasswordAndTheCurrentAuthenticatorCode'),
                409: this.i18n.translate('routes.profileEdit.thatAuthenticatorCodeWasAlreadyUsedOr2faIsAlreadyDisabled'),
              },
            }),
          );
        },
      });
  }

  cancelTotpSetup(): void {
    this.totpSetup.set(null);
    this.totpErrorMessage.set(null);
    this.totpSuccessMessage.set(null);
    this.enableTotpForm.reset({ code: '' });
  }

  isEnableTotpCodeInvalid(): boolean {
    const control = this.enableTotpForm.controls.code;

    return control.invalid && (control.dirty || control.touched);
  }

  isDisableTotpCodeInvalid(): boolean {
    const control = this.disableTotpForm.controls.code;

    return control.invalid && (control.dirty || control.touched);
  }

  isDisableTotpPasswordInvalid(): boolean {
    const control = this.disableTotpForm.controls.password;

    return control.invalid && (control.dirty || control.touched);
  }

  totpCodeError(isInvalid: boolean): string | null {
    return isInvalid ? 'Enter exactly 6 digits.' : null;
  }

  disableTotpPasswordError(): string | null {
    const control = this.disableTotpForm.controls.password;

    if (!this.isDisableTotpPasswordInvalid()) {
      return null;
    }

    if (control.hasError('required')) {
      return this.i18n.translate('validation.enterCurrentPassword');
    }

    return this.i18n.translate('validation.passwordMax');
  }

  isInvalid(controlName: ProfileEditControlName): boolean {
    const control = this.profileForm.controls[controlName];

    return control.invalid && (control.dirty || control.touched);
  }

  fieldError(controlName: ProfileEditControlName): string | null {
    const control = this.profileForm.controls[controlName];

    if (!this.isInvalid(controlName)) {
      return null;
    }

    if (control.hasError('required')) {
      return this.i18n.translate('validation.required');
    }

    if (control.hasError('email')) {
      return this.i18n.translate('validation.email');
    }

    if (control.hasError('minlength')) {
      return controlName === 'username'
        ? 'Use at least 3 characters.'
        : 'Use at least 2 characters.';
    }

    if (control.hasError('maxlength')) {
      return controlName === 'privateEmail'
        ? 'Use 320 characters or fewer.'
        : controlName === 'username'
          ? 'Use 30 characters or fewer.'
          : 'Use 120 characters or fewer.';
    }

    if (control.hasError('pattern')) {
      return this.i18n.translate('validation.usernamePattern');
    }

    return this.i18n.translate('validation.checkField');
  }

  initials(source: InitialsSource): string {
    const fallback = source.username || 'SH';
    const parts = (source.fullName || fallback)
      .split(/\s+/)
      .filter((part) => part.length > 0);

    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }

    return fallback.slice(0, 2).toUpperCase();
  }

  formatRole(role: number | string): string {
    if (typeof role === 'string') {
      return role;
    }

    if (role === 1) {
      return this.i18n.translate('common.roles.admin');
    }

    if (role === 2) {
      return this.i18n.translate('common.roles.moderator');
    }

    return this.i18n.translate('common.roles.student');
  }

  private loadCurrentUser(): void {
    this.loadErrorMessage.set(null);
    this.saveErrorMessage.set(null);
    this.successMessage.set(null);
    this.totpErrorMessage.set(null);
    this.totpSuccessMessage.set(null);
    this.totpSetup.set(null);
    this.isLoadingUser.set(true);

    this.usersApi
      .getCurrentUser()
      .pipe(
        finalize(() => {
          this.isLoadingUser.set(false);
        }),
      )
      .subscribe({
        next: (user) => {
          this.currentUser.set(user);
          this.authSession.updateCurrentUser(user);
          this.resetFormFromUser(user);
        },
        error: (error: unknown) => {
          if (this.redirectToLoginIfUnauthorized(error)) {
            return;
          }

          this.loadErrorMessage.set(
            resolveApiErrorMessage(error, {
              fallbackMessage: this.i18n.translate(
                'routes.profileEdit.yourProfileSettingsCouldNotBeLoadedPleaseTryAgain',
              ),
            }),
          );
        },
      });
  }

  private async generateTotpQrCode(setup: TotpSetupView): Promise<void> {
    this.isGeneratingTotpQr.set(true);

    try {
      const qrcodeModule = (await import('qrcode')) as QrCodeModule;
      const qrcode = qrcodeModule.default ?? qrcodeModule;
      const qrCodeDataUrl = await qrcode.toDataURL(setup.otpAuthUri, {
        errorCorrectionLevel: 'M',
        margin: 1,
        scale: 6,
      });

      this.totpSetup.update((currentSetup) =>
        currentSetup?.otpAuthUri === setup.otpAuthUri
          ? { ...currentSetup, qrCodeDataUrl }
          : currentSetup,
      );
    } catch {
      this.totpSetup.update((currentSetup) =>
        currentSetup?.otpAuthUri === setup.otpAuthUri
          ? { ...currentSetup, qrCodeDataUrl: null }
          : currentSetup,
      );
    } finally {
      this.isGeneratingTotpQr.set(false);
    }
  }

  private applyTotpStatus(
    isTotpEnabled: boolean,
    totpEnabledAt: string | null,
  ): void {
    const user = this.currentUser();
    if (!user) {
      return;
    }

    const updatedUser: CurrentUserResponse = {
      ...user,
      isTotpEnabled,
      totpEnabledAt,
    };

    this.currentUser.set(updatedUser);
    this.authSession.updateCurrentUser(updatedUser);
  }

  private resetFormFromUser(user: CurrentUserResponse): void {
    const formValue = {
      fullName: user.fullName,
      username: user.username,
      privateEmail: user.privateEmail,
    } satisfies UpdateCurrentUserRequest;

    this.profileForm.reset(formValue, { emitEvent: false });
    this.profileForm.markAsPristine();
    this.profileForm.markAsUntouched();
    this.savedProfileValue.set(normalizeProfileValues(formValue));
    this.formValue.set(this.readFormValue());
    this.isFormInvalid.set(this.profileForm.invalid);
  }

  private buildUpdateRequest(): UpdateCurrentUserRequest {
    return normalizeProfileValues(this.readFormValue());
  }

  private readFormValue(): UpdateCurrentUserRequest {
    const controls = this.profileForm.controls;

    return {
      fullName: controls.fullName.value,
      username: controls.username.value,
      privateEmail: controls.privateEmail.value,
    };
  }

  private redirectToLoginIfUnauthorized(error: unknown): boolean {
    if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
      return false;
    }

    this.authSession.clearLocalSession();
    void this.router.navigate(['/login'], {
      queryParams: { returnUrl: '/profile/edit' },
    });
    return true;
  }
}

function trimmedRequiredValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = typeof control.value === 'string' ? control.value : '';

    return value.trim().length > 0 ? null : { required: true };
  };
}

function trimmedMinLengthValidator(minLength: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = typeof control.value === 'string' ? control.value.trim() : '';

    if (value.length === 0) {
      return null;
    }

    return value.length >= minLength
      ? null
      : {
          minlength: {
            requiredLength: minLength,
            actualLength: value.length,
          },
        };
  };
}

function haveSameProfileValues(
  first: UpdateCurrentUserRequest,
  second: UpdateCurrentUserRequest,
): boolean {
  const normalizedFirst = normalizeProfileValues(first);
  const normalizedSecond = normalizeProfileValues(second);

  return (
    normalizedFirst.fullName === normalizedSecond.fullName &&
    normalizedFirst.username === normalizedSecond.username &&
    normalizedFirst.privateEmail === normalizedSecond.privateEmail
  );
}

function normalizeProfileValues(
  value: UpdateCurrentUserRequest,
): UpdateCurrentUserRequest {
  return {
    fullName: value.fullName.trim(),
    username: value.username.trim().toLowerCase(),
    privateEmail: value.privateEmail.trim().toLowerCase(),
  };
}
