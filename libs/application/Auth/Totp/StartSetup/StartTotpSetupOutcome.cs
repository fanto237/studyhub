namespace Application.Auth.Totp.StartSetup;

public enum StartTotpSetupOutcome
{
    Success,
    InvalidRequest,
    NotFound,
    AlreadyEnabled,
}
