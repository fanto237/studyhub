namespace Api.DTOs.Auth;

public record TwoFactorRequiredLoginResponse(
    bool RequiresTwoFactor,
    Guid ChallengeId,
    DateTimeOffset ExpiresAt,
    string Username,
    string Message);
