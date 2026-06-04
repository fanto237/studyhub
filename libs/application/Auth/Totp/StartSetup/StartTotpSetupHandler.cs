using Application.Auth.Abstractions;
using Application.Options;
using FluentValidation;
using Microsoft.Extensions.Options;

namespace Application.Auth.Totp.StartSetup;

public class StartTotpSetupHandler
{
    public static async Task<StartTotpSetupResult> Handle(
        StartTotpSetupCommand command,
        IValidator<StartTotpSetupCommand> validator,
        IAuthRepository authRepository,
        ITotpService totpService,
        IOptions<TotpSetting> totpSettingOptions,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        var validationResult = await validator.ValidateAsync(command, cancellationToken);
        if (!validationResult.IsValid)
        {
            return new StartTotpSetupResult(
                StartTotpSetupOutcome.InvalidRequest,
                string.Join(" ", validationResult.Errors.Select(error => error.ErrorMessage).Distinct()));
        }

        var user = await authRepository.GetUserForTotpSetupAsync(command.UserId, cancellationToken);
        if (user is null || user.DeletedAt is not null)
        {
            return new StartTotpSetupResult(
                StartTotpSetupOutcome.NotFound,
                "The requested user was not found.");
        }

        if (user.IsTotpEnabled)
        {
            return new StartTotpSetupResult(
                StartTotpSetupOutcome.AlreadyEnabled,
                "Two-factor authentication is already enabled for this account.");
        }

        var now = timeProvider.GetUtcNow();
        var setup = totpService.CreateSetup(user.PrivateEmail);
        var expiresAt = now.AddMinutes(totpSettingOptions.Value.SetupLifetimeMinutes);

        user.TotpPendingSecret = setup.ProtectedSecret;
        user.TotpPendingSecretCreatedAt = now;

        await authRepository.SaveChangesAsync(cancellationToken);

        return new StartTotpSetupResult(
            StartTotpSetupOutcome.Success,
            "Scan the QR code or enter the setup key in your authenticator app, then confirm the 6-digit code.",
            setup.ManualEntryKey,
            setup.OtpAuthUri,
            expiresAt);
    }
}
