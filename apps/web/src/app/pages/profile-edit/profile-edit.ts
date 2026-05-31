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

import { AuthSessionStore } from '../../core/services/auth-session-store';
import { UsersApi } from '../../core/services/users-api';
import { resolveApiErrorMessage } from '../../core/types/api-error.util';
import {
  type CurrentUserResponse,
  type UpdateCurrentUserRequest,
} from '../../core/types/users.models';
import { Icon } from '../../shared/components/icon/icon';
import { MobileDock } from '../../shared/components/mobile-dock/mobile-dock';
import { ThemeToggle } from '../../shared/components/theme-toggle/theme-toggle';

const USERNAME_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9._-]{1,28}[A-Za-z0-9])?$/;

type ProfileEditFormControls = {
  fullName: FormControl<string>;
  username: FormControl<string>;
  privateEmail: FormControl<string>;
};

type ProfileEditControlName = keyof ProfileEditFormControls;

type InitialsSource = Pick<CurrentUserResponse, 'fullName' | 'username'>;

@Component({
  selector: 'app-profile-edit',
  imports: [
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
  private readonly authSession = inject(AuthSessionStore);
  private readonly usersApi = inject(UsersApi);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);

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

  private readonly savedProfileValue = signal<UpdateCurrentUserRequest | null>(
    null,
  );

  readonly currentUser = signal<CurrentUserResponse | null>(null);
  readonly formValue = signal<UpdateCurrentUserRequest>(this.readFormValue());
  readonly isFormInvalid = signal(this.profileForm.invalid);

  readonly isLoadingUser = signal(true);
  readonly isSaving = signal(false);
  readonly loadErrorMessage = signal<string | null>(null);
  readonly saveErrorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

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
          this.successMessage.set('Your profile settings were updated.');
        },
        error: (error: unknown) => {
          if (this.redirectToLoginIfUnauthorized(error)) {
            return;
          }

          this.saveErrorMessage.set(
            resolveApiErrorMessage(error, {
              fallbackMessage:
                'Your profile changes could not be saved. Please try again.',
              statusMessages: {
                409: 'That username or private email is already in use.',
              },
            }),
          );
        },
      });
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
      return 'This field is required.';
    }

    if (control.hasError('email')) {
      return 'Enter a valid email address.';
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
      return 'Use 3–30 characters: letters, numbers, dots, underscores, or hyphens. Start and end with a letter or number.';
    }

    return 'Please check this field.';
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
      return 'Admin';
    }

    if (role === 2) {
      return 'Moderator';
    }

    return 'Student';
  }

  private loadCurrentUser(): void {
    this.loadErrorMessage.set(null);
    this.saveErrorMessage.set(null);
    this.successMessage.set(null);
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
              fallbackMessage:
                'Your profile settings could not be loaded. Please try again.',
            }),
          );
        },
      });
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
