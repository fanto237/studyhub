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

import { resolveApiErrorMessage } from '../../../core/api/api-error.util';
import { AuthApi } from '../../../core/auth/auth-api';
import {
  type AuthSessionResponse,
  type LoginRequest,
} from '../../../core/auth/auth.models';
import { Icon } from '../../../shared/components/icon/icon';
import { SiteHeader } from '../../../shared/components/site-header/site-header';

type LoginFormControls = {
  usernameOrPrivateEmail: FormControl<string>;
  password: FormControl<string>;
};

type LoginControlName = keyof LoginFormControls;

@Component({
  selector: 'app-login',
  imports: [Icon, RouterLink, ReactiveFormsModule, SiteHeader],
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
        this.errorMessage.set(this.resolveErrorMessage(error));
        this.isSubmitting.set(false);
      },
      complete: () => {
        this.isSubmitting.set(false);
      },
    });
  }

  private resolveErrorMessage(error: unknown): string {
    return resolveApiErrorMessage(error, {
      fallbackMessage:
        'Something went wrong while logging in. Please try again.',
      statusMessages: {
        403: 'Your account must be verified before you can log in.',
        404: 'No account matches those credentials.',
      },
    });
  }
}
