namespace Application.Auth.RequestPasswordReset;

public enum RequestPasswordResetOutcome
{
  Success = 0,
  InvalidRequest = 1,
  CodeAlreadySent = 2,
  EmailDeliveryFailed = 3,
}
