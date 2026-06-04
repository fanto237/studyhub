namespace Application.Auth.Totp.Enable;

public record EnableTotpResult(
    EnableTotpOutcome Outcome,
    string Message,
    bool IsTotpEnabled = false,
    DateTimeOffset? TotpEnabledAt = null);
