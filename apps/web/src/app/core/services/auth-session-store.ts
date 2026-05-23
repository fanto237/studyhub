import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Injectable,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  type Observable,
  catchError,
  finalize,
  map,
  of,
  shareReplay,
  tap,
  throwError,
} from 'rxjs';

import {
  type AuthSessionResponse,
  type LoginRequest,
  type LogoutResponse,
} from '../types/auth.models';
import { type CurrentUserResponse } from '../types/users.models';
import { AuthApi } from './auth-api';
import { UsersApi } from './users-api';

export type AuthSessionDisplayUser = Pick<
  CurrentUserResponse,
  'id' | 'username' | 'fullName' | 'privateEmail' | 'role' | 'isVerified'
>;

@Injectable({ providedIn: 'root' })
export class AuthSessionStore {
  private readonly authApi = inject(AuthApi);
  private readonly usersApi = inject(UsersApi);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private sessionCheckRequest$: Observable<CurrentUserResponse | null> | null =
    null;

  private readonly authenticatedSessionSignal =
    signal<AuthSessionResponse | null>(null);
  private readonly currentUserSignal = signal<CurrentUserResponse | null>(null);
  private readonly isLoadingSignal = signal(false);
  private readonly hasCheckedSessionSignal = signal(false);

  readonly authenticatedSession = this.authenticatedSessionSignal.asReadonly();
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly hasCheckedSession = this.hasCheckedSessionSignal.asReadonly();

  readonly isAuthenticated = computed(
    () =>
      this.currentUserSignal() !== null ||
      this.authenticatedSessionSignal() !== null,
  );

  readonly displayUser = computed<AuthSessionDisplayUser | null>(() => {
    const currentUser = this.currentUserSignal();

    if (currentUser) {
      return currentUser;
    }

    const session = this.authenticatedSessionSignal();

    if (!session) {
      return null;
    }

    return {
      id: session.userId,
      username: session.username,
      fullName: session.fullName,
      privateEmail: session.privateEmail,
      role: session.role,
      isVerified: session.isVerified,
    };
  });

  checkSession(options: { force?: boolean } = {}) {
    if (!this.isBrowser) {
      this.hasCheckedSessionSignal.set(true);
      this.isLoadingSignal.set(false);
      return of(null);
    }

    const currentUser = this.currentUserSignal();
    if (!options.force && currentUser) {
      this.hasCheckedSessionSignal.set(true);
      return of(currentUser);
    }

    if (this.sessionCheckRequest$) {
      return this.sessionCheckRequest$;
    }

    this.isLoadingSignal.set(true);

    this.sessionCheckRequest$ = this.usersApi.getCurrentUser().pipe(
      tap((user) => {
        this.currentUserSignal.set(user);
      }),
      map((user) => user),
      catchError((error: unknown) => {
        if (this.isAuthenticationFailure(error)) {
          this.clearLocalSession();
        }

        return of(null);
      }),
      finalize(() => {
        this.hasCheckedSessionSignal.set(true);
        this.isLoadingSignal.set(false);
        this.sessionCheckRequest$ = null;
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    return this.sessionCheckRequest$;
  }

  login(request: LoginRequest) {
    return this.authApi.login(request).pipe(
      tap((session) => {
        this.authenticatedSessionSignal.set(session);
        this.currentUserSignal.set(null);
        this.hasCheckedSessionSignal.set(true);
      }),
    );
  }

  logout(): Observable<LogoutResponse> {
    return this.authApi.logout().pipe(
      tap(() => {
        this.clearLocalSession();
      }),
      catchError((error: unknown) => {
        if (this.isAuthenticationFailure(error)) {
          this.clearLocalSession();
          return of({ message: 'You have been signed out.' });
        }

        return throwError(() => error);
      }),
    );
  }

  clearLocalSession(): void {
    this.authenticatedSessionSignal.set(null);
    this.currentUserSignal.set(null);
    this.hasCheckedSessionSignal.set(true);
  }

  private isAuthenticationFailure(error: unknown): boolean {
    return (
      error instanceof HttpErrorResponse &&
      (error.status === 401 || error.status === 403)
    );
  }
}
