using Domain.Enums;

namespace Application.Auth.RefreshSession;

public record RefreshSessionResult(
    RefreshSessionOutcome Outcome,
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
