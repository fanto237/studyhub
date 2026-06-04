namespace Application.Auth.Totp.CompleteLogin;

public enum CompleteTotpLoginOutcome
{
    Success,
    InvalidRequest,
    InvalidChallenge,
    ExpiredChallenge,
    TooManyAttempts,
    TotpNotEnabled,
    InvalidCode,
    ReplayedCode,
}
