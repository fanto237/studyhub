namespace Application.Auth.Totp.Disable;

public enum DisableTotpOutcome
{
    Success,
    InvalidRequest,
    NotFound,
    NotEnabled,
    InvalidPassword,
    InvalidCode,
    ReplayedCode,
}
