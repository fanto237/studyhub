using Application.Auth.Abstractions;
using Domain.Enums;
using FluentValidation;

namespace Application.Auth.VerifyAccount;

public class VerifyAccountHandler
{
    public async Task<VerifyAccountResult> Handle(
        VerifyAccountCommand command,
        IValidator<VerifyAccountCommand> validator,
        IAuthRepository authRepository,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        var validationResult = await validator.ValidateAsync(command, cancellationToken);
        if (!validationResult.IsValid)
        {
            return new VerifyAccountResult(
                VerifyAccountOutcome.InvalidRequest,
                string.Join(" ", validationResult.Errors.Select(error => error.ErrorMessage).Distinct()));
        }

        var schoolEmail = AuthValueNormalizer.NormalizeEmail(command.SchoolEmail);
        var code = AuthValueNormalizer.NormalizeCode(command.Code);

        var user = await authRepository.GetUserWithAuthCodesBySchoolEmailAsync(schoolEmail, cancellationToken);
        if (user is null)
        {
            return new VerifyAccountResult(
                VerifyAccountOutcome.InvalidCode,
                "The verification code is invalid or has expired.");
        }

        if (user.IsVerified)
        {
            return new VerifyAccountResult(
                VerifyAccountOutcome.AlreadyVerified,
                "This account is already verified.",
                user.Id,
                user.SchoolEmail,
                user.IsVerified,
                user.LastVerifiedAt);
        }

        var now = timeProvider.GetUtcNow();
        var verificationCode = user.AuthCodes
            .Where(authCode => authCode.Purpose == AuthCodePurpose.SchoolEmailVerification)
            .Where(authCode => authCode.DeliveryAddress == schoolEmail)
            .Where(authCode => authCode.ConsumedAt is null)
            .OrderByDescending(authCode => authCode.CreatedAt)
            .FirstOrDefault(authCode => authCode.Code == code);

        if (verificationCode is null)
        {
            return new VerifyAccountResult(
                VerifyAccountOutcome.InvalidCode,
                "The verification code is invalid or has expired.");
        }

        if (verificationCode.ExpiresAt <= now)
        {
            return new VerifyAccountResult(
                VerifyAccountOutcome.ExpiredCode,
                "The verification code has expired. Request a new code and try again.");
        }

        user.IsVerified = true;
        user.LastVerifiedAt = now;

        foreach (var authCode in user.AuthCodes.Where(authCode => authCode.Purpose == AuthCodePurpose.SchoolEmailVerification && authCode.ConsumedAt is null))
        {
            authCode.ConsumedAt = now;
        }

        await authRepository.SaveChangesAsync(cancellationToken);

        return new VerifyAccountResult(
            VerifyAccountOutcome.Success,
            "Your school email has been verified successfully.",
            user.Id,
            user.SchoolEmail,
            user.IsVerified,
            user.LastVerifiedAt);
    }
}
