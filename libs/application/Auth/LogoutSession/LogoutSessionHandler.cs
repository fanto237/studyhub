using Application.Auth.Abstractions;
using FluentValidation;

namespace Application.Auth.LogoutSession;

public class LogoutSessionHandler
{
    public static async Task<LogoutSessionResult> Handle(
        LogoutSessionCommand command,
        IValidator<LogoutSessionCommand> validator,
        IAuthRepository authRepository,
        IAuthTokenService authTokenService,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        var validationResult = await validator.ValidateAsync(command, cancellationToken);
        if (!validationResult.IsValid)
        {
            return new LogoutSessionResult(
                LogoutSessionOutcome.InvalidRequest,
                string.Join(" ", validationResult.Errors.Select(error => error.ErrorMessage).Distinct()));
        }

        if (string.IsNullOrWhiteSpace(command.RefreshToken))
        {
            return new LogoutSessionResult(LogoutSessionOutcome.Success, "Logged out successfully.");
        }

        var refreshTokenHash = authTokenService.ComputeRefreshTokenHash(command.RefreshToken);
        var storedRefreshToken = await authRepository.GetRefreshTokenWithUserByHashAsync(refreshTokenHash, cancellationToken);
        if (storedRefreshToken is null || storedRefreshToken.RevokedAt is not null)
        {
            return new LogoutSessionResult(LogoutSessionOutcome.Success, "Logged out successfully.");
        }

        storedRefreshToken.RevokedAt = timeProvider.GetUtcNow();
        storedRefreshToken.LastUsedAt = storedRefreshToken.RevokedAt;
        await authRepository.SaveChangesAsync(cancellationToken);

        return new LogoutSessionResult(LogoutSessionOutcome.Success, "Logged out successfully.");
    }
}
