namespace Application.Auth.Abstractions;

public record IssuedRefreshToken(string Token, string TokenHash, DateTimeOffset ExpiresAt);
