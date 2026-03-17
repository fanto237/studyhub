namespace Application.Auth.SendAuthCode;

public enum SendAuthCodeOutcome
{
  Success = 0,
  SchoolEmailNotRegistered = 1,
  InvalidRequest = 2,
  UserAlreadyVerified = 3,
  CodeAlreadySent = 4
}
