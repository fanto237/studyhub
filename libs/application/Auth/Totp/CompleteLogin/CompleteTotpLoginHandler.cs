using Application.Auth.Abstractions;
using Application.Options;
using Domain.Entities;
using FluentValidation;
using Microsoft.Extensions.Options;

namespace Application.Auth.Totp.CompleteLogin;

public class CompleteTotpLoginHandler
{
    public static async Task<CompleteTotpLoginResult> Handle(
        CompleteTotpLoginCommand command,
        IValidator<CompleteTotpLoginCommand> validator,
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
            return new CompleteTotpLoginResult(
                CompleteTotpLoginOutcome.InvalidRequest,
                string.Join(" ", validationResult.Errors.Select(error => error.ErrorMessage).Distinct()));
        }

        var challenge = await authRepository.GetTotpLoginChallengeWithUserAsync(command.ChallengeId, cancellationToken);
        if (challenge is null)
        {
            return new CompleteTotpLoginResult(
                CompleteTotpLoginOutcome.InvalidChallenge,
                "The two-factor login challenge is invalid or has expired.");
        }

        var now = timeProvider.GetUtcNow();
        if (challenge.ConsumedAt is not null)
        {
            return new CompleteTotpLoginResult(
                CompleteTotpLoginOutcome.InvalidChallenge,
                "The two-factor login challenge has already been used.");
        }

        if (challenge.ExpiresAt <= now)
        {
            return new CompleteTotpLoginResult(
                CompleteTotpLoginOutcome.ExpiredChallenge,
                "The two-factor login challenge has expired. Log in again.");
        }

        if (challenge.FailedAttempts >= totpSettingOptions.Value.MaxLoginAttempts)
        {
            return new CompleteTotpLoginResult(
                CompleteTotpLoginOutcome.TooManyAttempts,
                "Too many invalid authenticator codes were submitted. Log in again.");
        }

        var user = challenge.User;
        if (user.DeletedAt is not null || !user.IsVerified)
        {
            return new CompleteTotpLoginResult(
                CompleteTotpLoginOutcome.InvalidChallenge,
                "The two-factor login challenge is invalid or has expired.");
        }

        if (!user.IsTotpEnabled || string.IsNullOrWhiteSpace(user.TotpSecret))
        {
            return new CompleteTotpLoginResult(
                CompleteTotpLoginOutcome.TotpNotEnabled,
                "Two-factor authentication is not enabled for this account.");
        }

        var verification = totpService.VerifyCode(user.TotpSecret, AuthValueNormalizer.NormalizeCode(command.Code));
        if (!verification.IsValid || verification.TimeStepMatched is null)
        {
            challenge.FailedAttempts += 1;
            await authRepository.SaveChangesAsync(cancellationToken);

            return challenge.FailedAttempts >= totpSettingOptions.Value.MaxLoginAttempts
                ? new CompleteTotpLoginResult(
                    CompleteTotpLoginOutcome.TooManyAttempts,
                    "Too many invalid authenticator codes were submitted. Log in again.")
                : new CompleteTotpLoginResult(
                    CompleteTotpLoginOutcome.InvalidCode,
                    "The authenticator code is invalid or has expired.");
        }

        if (user.TotpLastUsedTimeStep is not null && verification.TimeStepMatched <= user.TotpLastUsedTimeStep)
        {
            return new CompleteTotpLoginResult(
                CompleteTotpLoginOutcome.ReplayedCode,
                "This authenticator code has already been used. Wait for a new code and try again.");
        }

        var accessToken = authTokenService.CreateAccessToken(user, now);
        var refreshToken = authTokenService.CreateRefreshToken(now);
        var userRefreshToken = new UserRefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = refreshToken.TokenHash,
            ExpiresAt = refreshToken.ExpiresAt,
            CreatedAt = now,
        };

        await authRepository.ExecuteInTransactionAsync(async ct =>
        {
            challenge.ConsumedAt = now;
            user.TotpLastUsedTimeStep = verification.TimeStepMatched.Value;

            authRepository.AddRefreshToken(userRefreshToken);
            await authRepository.SaveChangesAsync(ct);
        }, cancellationToken);

        return new CompleteTotpLoginResult(
            CompleteTotpLoginOutcome.Success,
            "Login successful.",
            accessToken.Token,
            accessToken.ExpiresAt,
            refreshToken.Token,
            refreshToken.ExpiresAt,
            user.Id,
            user.Username,
            user.PrivateEmail,
            user.FullName,
            user.Role,
            user.IsVerified);
    }
}
