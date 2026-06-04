namespace Application.Auth.Totp.Enable;

public record EnableTotpCommand(
    Guid UserId,
    string Code,
    string? CurrentRefreshToken = null);
