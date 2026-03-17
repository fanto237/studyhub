namespace Application.Auth.Abstractions;

public record IssuedAccessToken(string Token, DateTimeOffset ExpiresAt);
