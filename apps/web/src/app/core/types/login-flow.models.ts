export type UnverifiedAccount = {
  schoolEmail: string | null;
  username: string | null;
  message: string;
};

export type LoginBackToLoginPayload = {
  username?: string | null;
  privateEmail?: string | null;
};
