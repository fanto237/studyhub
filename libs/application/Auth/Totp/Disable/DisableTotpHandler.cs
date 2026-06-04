using Application.Auth.Abstractions;
using Application.Auth.Totp;
using Domain.Entities;
using FluentValidation;
using Microsoft.AspNetCore.Identity;

namespace Application.Auth.Totp.Disable;

public class DisableTotpHandler
{
    public static async Task<DisableTotpResult> Handle(
        DisableTotpCommand command,
        IValidator<DisableTotpCommand> validator,
        IAuthRepository authRepository,
        IAuthTokenService authTokenService,
        ITotpService totpService,
        IPasswordHasher<User> passwordHasher,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        var validationResult = await validator.ValidateAsync(command, cancellationToken);
        if (!validationResult.IsValid)
        {
            return new DisableTotpResult(
                DisableTotpOutcome.InvalidRequest,
                string.Join(" ", validationResult.Errors.Select(error => error.ErrorMessage).Distinct()));
        }

        var user = await authRepository.GetUserForTotpDisableAsync(command.UserId, cancellationToken);
        if (user is null || user.DeletedAt is not null)
        {
            return new DisableTotpResult(
                DisableTotpOutcome.NotFound,
                "The requested user was not found.",
                false);
        }

        if (!user.IsTotpEnabled || string.IsNullOrWhiteSpace(user.TotpSecret))
        {
            return new DisableTotpResult(
                DisableTotpOutcome.NotEnabled,
                "Two-factor authentication is not enabled for this account.",
                false);
        }

        var passwordVerificationResult = passwordHasher.VerifyHashedPassword(user, user.PasswordHash, command.Password);
        if (passwordVerificationResult == PasswordVerificationResult.Failed)
        {
            return new DisableTotpResult(
                DisableTotpOutcome.InvalidPassword,
                "The password is incorrect.",
                true,
                user.TotpEnabledAt);
        }

        var verification = totpService.VerifyCode(user.TotpSecret, AuthValueNormalizer.NormalizeCode(command.Code));
        if (!verification.IsValid || verification.TimeStepMatched is null)
        {
            return new DisableTotpResult(
                DisableTotpOutcome.InvalidCode,
                "The authenticator code is invalid or has expired.",
                true,
                user.TotpEnabledAt);
        }

        if (user.TotpLastUsedTimeStep is not null && verification.TimeStepMatched <= user.TotpLastUsedTimeStep)
        {
            return new DisableTotpResult(
                DisableTotpOutcome.ReplayedCode,
                "This authenticator code has already been used. Wait for a new code and try again.",
                true,
                user.TotpEnabledAt);
        }

        var now = timeProvider.GetUtcNow();
        await authRepository.ExecuteInTransactionAsync(async ct =>
        {
            if (passwordVerificationResult == PasswordVerificationResult.SuccessRehashNeeded)
            {
                user.PasswordHash = passwordHasher.HashPassword(user, command.Password);
            }

            user.IsTotpEnabled = false;
            user.TotpSecret = null;
            user.TotpEnabledAt = null;
            user.TotpLastUsedTimeStep = null;
            user.TotpPendingSecret = null;
            user.TotpPendingSecretCreatedAt = null;

            TotpRefreshTokenRevoker.RevokeOtherActiveRefreshTokens(
                user,
                command.CurrentRefreshToken,
                authTokenService,
                now);

            await authRepository.SaveChangesAsync(ct);
        }, cancellationToken);

        return new DisableTotpResult(
            DisableTotpOutcome.Success,
            "Two-factor authentication is now disabled.",
            false);
    }
}
