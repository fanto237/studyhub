using Application.Auth.Abstractions;
using Domain.Entities;
using FluentValidation;

namespace Application.Auth.RefreshSession;

public class RefreshSessionHandler
{
    public static async Task<RefreshSessionResult> Handle(
        RefreshSessionCommand command,
        IValidator<RefreshSessionCommand> validator,
        IAuthRepository authRepository,
        IAuthTokenService authTokenService,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        var validationResult = await validator.ValidateAsync(command, cancellationToken);
        if (!validationResult.IsValid)
        {
            return new RefreshSessionResult(
                RefreshSessionOutcome.InvalidRequest,
                string.Join(" ", validationResult.Errors.Select(error => error.ErrorMessage).Distinct()));
        }

        var refreshTokenValue = command.RefreshToken.Trim();
        var refreshTokenHash = authTokenService.ComputeRefreshTokenHash(refreshTokenValue);
        var storedRefreshToken = await authRepository.GetRefreshTokenWithUserByHashAsync(refreshTokenHash, cancellationToken);
        if (storedRefreshToken is null)
        {
            return new RefreshSessionResult(
                RefreshSessionOutcome.InvalidRefreshToken,
                "The refresh token is invalid or has expired.");
        }

        var now = timeProvider.GetUtcNow();
        if (storedRefreshToken.RevokedAt is not null || storedRefreshToken.ExpiresAt <= now)
        {
            return new RefreshSessionResult(
                RefreshSessionOutcome.InvalidRefreshToken,
                "The refresh token is invalid or has expired.");
        }

        var user = storedRefreshToken.User;
        if (user.DeletedAt is not null || !user.IsVerified)
        {
            return new RefreshSessionResult(
                RefreshSessionOutcome.InvalidRefreshToken,
                "The refresh token is invalid or has expired.");
        }

        var accessToken = authTokenService.CreateAccessToken(user, now);
        var newRefreshToken = authTokenService.CreateRefreshToken(now);
        var rotatedRefreshToken = new UserRefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = newRefreshToken.TokenHash,
            ExpiresAt = newRefreshToken.ExpiresAt,
            CreatedAt = now,
        };

        await authRepository.ExecuteInTransactionAsync(async ct =>
        {
            storedRefreshToken.RevokedAt = now;
            storedRefreshToken.ReplacedByTokenId = rotatedRefreshToken.Id;
            storedRefreshToken.LastUsedAt = now;

            authRepository.AddRefreshToken(rotatedRefreshToken);
            await authRepository.SaveChangesAsync(ct);
        }, cancellationToken);

        return new RefreshSessionResult(
            RefreshSessionOutcome.Success,
            "Session refreshed successfully.",
            accessToken.Token,
            accessToken.ExpiresAt,
            newRefreshToken.Token,
            newRefreshToken.ExpiresAt,
            user.Id,
            user.Username,
            user.PrivateEmail,
            user.FullName,
            user.Role,
            user.IsVerified);
    }
}
