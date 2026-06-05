export interface RegisterRequest {
  privateEmail: string;
  username: string;
  fullName: string;
  universityName: string;
  password: string;
  schoolEmail: string;
}

export interface LoginRequest {
  usernameOrPrivateEmail: string;
  password: string;
}

export interface UnverifiedAccountLoginResponse {
  message?: string;
  schoolEmail?: string;
  username?: string | null;
  Message?: string;
  SchoolEmail?: string;
  Username?: string | null;
}

export interface VerifyAccountRequest {
  schoolEmail: string;
  code: string;
}

export interface SendAuthCodeRequest {
  schoolEmail: string;
}

export interface RequestPasswordResetRequest {
  privateEmail: string;
}

export interface ResetPasswordRequest {
  privateEmail: string;
  code: string;
  newPassword: string;
}

export interface RegisterAccountResponse {
  userId: string;
  privateEmail: string;
  username: string;
  fullName: string;
  schoolEmail: string;
  universityName: string;
  isVerified: boolean;
  message: string;
}

export interface AuthSessionResponse {
  userId: string;
  username: string;
  privateEmail: string;
  fullName: string;
  role: number | string;
  isVerified: boolean;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
  message: string;
}

export interface TwoFactorRequiredLoginResponse {
  requiresTwoFactor: true;
  challengeId: string;
  expiresAt: string;
  username: string;
  message: string;
}

export type LoginResponse =
  | AuthSessionResponse
  | TwoFactorRequiredLoginResponse;

export interface CompleteTotpLoginRequest {
  challengeId: string;
  code: string;
}

export interface TotpSetupResponse {
  manualEntryKey: string;
  otpAuthUri: string;
  expiresAt: string;
  message: string;
}

export interface EnableTotpRequest {
  code: string;
}

export interface DisableTotpRequest {
  password: string;
  code: string;
}

export interface TotpStatusResponse {
  isTotpEnabled: boolean;
  totpEnabledAt: string | null;
  message: string;
}

export function isTwoFactorRequiredLoginResponse(
  response: LoginResponse,
): response is TwoFactorRequiredLoginResponse {
  return 'requiresTwoFactor' in response && response.requiresTwoFactor === true;
}

export interface VerifyAccountResponse {
  userId: string;
  schoolEmail: string;
  isVerified: boolean;
  lastVerifiedAt: string | null;
  message: string;
}

export interface RequestPasswordResetResponse {
  message: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface LogoutResponse {
  message: string;
}
