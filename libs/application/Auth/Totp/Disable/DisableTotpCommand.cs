namespace Application.Auth.Totp.Disable;

public record DisableTotpCommand(
    Guid UserId,
    string Password,
    string Code,
    string? CurrentRefreshToken = null);
