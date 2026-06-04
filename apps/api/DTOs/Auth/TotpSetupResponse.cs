namespace Api.DTOs.Auth;

public record TotpSetupResponse(
    string ManualEntryKey,
    string OtpAuthUri,
    DateTimeOffset ExpiresAt,
    string Message);
