namespace Application.Auth.ResetPassword;

public enum ResetPasswordOutcome
{
  Success = 0,
  InvalidRequest = 1,
  InvalidCode = 2,
  ExpiredCode = 3,
}
