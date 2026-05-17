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

export interface VerifyAccountResponse {
  userId: string;
  schoolEmail: string;
  isVerified: boolean;
  lastVerifiedAt: string | null;
  message: string;
}
