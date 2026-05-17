import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';

import { type ApiEnvelope } from '../types/api-envelope.model';
import {
  type AuthSessionResponse,
  type LoginRequest,
  type RegisterAccountResponse,
  type RegisterRequest,
  type RequestPasswordResetRequest,
  type RequestPasswordResetResponse,
  type ResetPasswordRequest,
  type ResetPasswordResponse,
  type SendAuthCodeRequest,
  type VerifyAccountRequest,
  type VerifyAccountResponse,
} from '../types/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly http = inject(HttpClient);

  register(request: RegisterRequest) {
    return this.http
      .post<ApiEnvelope<RegisterAccountResponse>>('/api/auth/register', request)
      .pipe(
        map((response) => {
          if (response.status === 'success' && response.data) {
            return response.data;
          }

          throw new Error(
            response.message ?? 'Registration was not completed.',
          );
        }),
      );
  }

  login(request: LoginRequest) {
    const responseObservable = this.http
      .post<ApiEnvelope<AuthSessionResponse>>('/api/auth/login', request, {
        withCredentials: true,
      })
      .pipe(
        map((response) => {
          if (response.status === 'success' && response.data) {
            return response.data;
          }

          throw new Error(response.message ?? 'Login was not completed.');
        }),
      );

    return responseObservable;
  }

  verifyAccount(request: VerifyAccountRequest) {
    return this.http
      .post<
        ApiEnvelope<VerifyAccountResponse>
      >('/api/auth/verify-account', request)
      .pipe(
        map((response) => {
          if (response.status === 'success' && response.data) {
            return response.data;
          }

          throw new Error(
            response.message ?? 'Account verification was not completed.',
          );
        }),
      );
  }

  sendCode(request: SendAuthCodeRequest) {
    return this.http
      .post<ApiEnvelope<string>>('/api/auth/send-code', request)
      .pipe(
        map((response) => {
          if (response.status === 'success') {
            return (
              response.data ?? response.message ?? 'Verification code sent.'
            );
          }

          throw new Error(
            response.message ?? 'Verification code could not be sent.',
          );
        }),
      );
  }

  requestPasswordReset(request: RequestPasswordResetRequest) {
    return this.http
      .post<
        ApiEnvelope<RequestPasswordResetResponse>
      >('/api/auth/request-password-reset', request)
      .pipe(
        map((response) => {
          if (response.status === 'success' && response.data) {
            return response.data;
          }

          throw new Error(
            response.message ?? 'Password reset code could not be sent.',
          );
        }),
      );
  }

  resetPassword(request: ResetPasswordRequest) {
    return this.http
      .post<
        ApiEnvelope<ResetPasswordResponse>
      >('/api/auth/reset-password', request, { withCredentials: true })
      .pipe(
        map((response) => {
          if (response.status === 'success' && response.data) {
            return response.data;
          }

          throw new Error(
            response.message ?? 'Password reset was not completed.',
          );
        }),
      );
  }
}
