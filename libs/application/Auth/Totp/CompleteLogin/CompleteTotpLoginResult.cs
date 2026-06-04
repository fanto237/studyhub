using Domain.Enums;

namespace Application.Auth.Totp.CompleteLogin;

public record CompleteTotpLoginResult(
    CompleteTotpLoginOutcome Outcome,
    string Message,
    string? AccessToken = null,
    DateTimeOffset? AccessTokenExpiresAt = null,
    string? RefreshToken = null,
    DateTimeOffset? RefreshTokenExpiresAt = null,
    Guid? UserId = null,
    string? Username = null,
    string? PrivateEmail = null,
    string? FullName = null,
    UserRole? Role = null,
    bool IsVerified = false);
