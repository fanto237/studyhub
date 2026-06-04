using Application.Auth.Abstractions;
using Application.Options;
using Application.Auth.Totp;
using FluentValidation;
using Microsoft.Extensions.Options;

namespace Application.Auth.Totp.Enable;

public class EnableTotpHandler
{
    public static async Task<EnableTotpResult> Handle(
        EnableTotpCommand command,
        IValidator<EnableTotpCommand> validator,
        IAuthRepository authRepository,
        IAuthTokenService authTokenService,
        ITotpService totpService,
        IOptions<TotpSetting> totpSettingOptions,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        var validationResult = await validator.ValidateAsync(command, cancellationToken);
        if (!validationResult.IsValid)
        {
            return new EnableTotpResult(
                EnableTotpOutcome.InvalidRequest,
                string.Join(" ", validationResult.Errors.Select(error => error.ErrorMessage).Distinct()));
        }

        var user = await authRepository.GetUserForTotpEnableAsync(command.UserId, cancellationToken);
        if (user is null || user.DeletedAt is not null)
        {
            return new EnableTotpResult(
                EnableTotpOutcome.NotFound,
                "The requested user was not found.");
        }

        if (user.IsTotpEnabled)
        {
            return new EnableTotpResult(
                EnableTotpOutcome.AlreadyEnabled,
                "Two-factor authentication is already enabled for this account.",
                true,
                user.TotpEnabledAt);
        }

        if (string.IsNullOrWhiteSpace(user.TotpPendingSecret) || user.TotpPendingSecretCreatedAt is null)
        {
            return new EnableTotpResult(
                EnableTotpOutcome.SetupNotStarted,
                "Start authenticator setup before confirming a code.");
        }

        var now = timeProvider.GetUtcNow();
        if (user.TotpPendingSecretCreatedAt.Value.AddMinutes(totpSettingOptions.Value.SetupLifetimeMinutes) <= now)
        {
            user.TotpPendingSecret = null;
            user.TotpPendingSecretCreatedAt = null;
            await authRepository.SaveChangesAsync(cancellationToken);

            return new EnableTotpResult(
                EnableTotpOutcome.SetupExpired,
                "The authenticator setup expired. Start setup again and scan the new QR code.");
        }

        var verification = totpService.VerifyCode(user.TotpPendingSecret, AuthValueNormalizer.NormalizeCode(command.Code));
        if (!verification.IsValid || verification.TimeStepMatched is null)
        {
            return new EnableTotpResult(
                EnableTotpOutcome.InvalidCode,
                "The authenticator code is invalid or has expired.");
        }

        if (user.TotpLastUsedTimeStep is not null && verification.TimeStepMatched <= user.TotpLastUsedTimeStep)
        {
            return new EnableTotpResult(
                EnableTotpOutcome.ReplayedCode,
                "This authenticator code has already been used. Wait for a new code and try again.");
        }

        await authRepository.ExecuteInTransactionAsync(async ct =>
        {
            user.IsTotpEnabled = true;
            user.TotpSecret = user.TotpPendingSecret;
            user.TotpEnabledAt = now;
            user.TotpLastUsedTimeStep = verification.TimeStepMatched.Value;
            user.TotpPendingSecret = null;
            user.TotpPendingSecretCreatedAt = null;

            TotpRefreshTokenRevoker.RevokeOtherActiveRefreshTokens(
                user,
                command.CurrentRefreshToken,
                authTokenService,
                now);

            await authRepository.SaveChangesAsync(ct);
        }, cancellationToken);

        return new EnableTotpResult(
            EnableTotpOutcome.Success,
            "Two-factor authentication is now enabled.",
            true,
            now);
    }
}
