namespace Application.Auth.Totp.Disable;

public record DisableTotpResult(
    DisableTotpOutcome Outcome,
    string Message,
    bool IsTotpEnabled = true,
    DateTimeOffset? TotpEnabledAt = null);
