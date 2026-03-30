using Domain.Enums;

namespace Api.DTOs.Auth;

public record AuthSessionResponse(
    Guid UserId,
    string Username,
    string PrivateEmail,
    string FullName,
    UserRole Role,
    bool IsVerified,
    DateTimeOffset AccessTokenExpiresAt,
    DateTimeOffset RefreshTokenExpiresAt,
    string Message);
