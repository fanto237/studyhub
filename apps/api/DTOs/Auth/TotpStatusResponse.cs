namespace Api.DTOs.Auth;

public record TotpStatusResponse(
    bool IsTotpEnabled,
    DateTimeOffset? TotpEnabledAt,
    string Message);
