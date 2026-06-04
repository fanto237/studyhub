namespace Application.Auth.Totp.StartSetup;

public record StartTotpSetupResult(
    StartTotpSetupOutcome Outcome,
    string Message,
    string? ManualEntryKey = null,
    string? OtpAuthUri = null,
    DateTimeOffset? ExpiresAt = null);
