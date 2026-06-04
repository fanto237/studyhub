namespace Application.Auth.Totp.Enable;

public enum EnableTotpOutcome
{
    Success,
    InvalidRequest,
    NotFound,
    AlreadyEnabled,
    SetupNotStarted,
    SetupExpired,
    InvalidCode,
    ReplayedCode,
}
