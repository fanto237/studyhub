using System.Globalization;
using System.Security.Cryptography;
using Application.Abstractions.Email;
using Application.Auth.Abstractions;
using Domain.Entities;
using Domain.Enums;
using FluentValidation;
using Microsoft.Extensions.Logging;

namespace Application.Auth.SendAuthCode;

public class SendAuthCodeHandler
{

  public static async Task<SendAuthCodeResult> Handle(SendAuthCodeCommand command, CancellationToken cancellationToken, IAuthEmailService emailService, IValidator<SendAuthCodeCommand> validator, ILogger<SendAuthCodeHandler> logger, IAuthRepository authRepository, TimeProvider timeProvider, IAuthEmailService authEmailService)
  {
    var validationResult = await validator.ValidateAsync(command, cancellationToken);
    if (!validationResult.IsValid)
      return new SendAuthCodeResult(
          SendAuthCodeOutcome.InvalidRequest,
          string.Join(" ", validationResult.Errors.Select(error => error.ErrorMessage).Distinct()));

    var userExists = await authRepository.SchoolEmailExistsAsync(command.SchoolEmail, cancellationToken);

    if (!userExists)
      return new SendAuthCodeResult(
        SendAuthCodeOutcome.SchoolEmailNotRegistered,
        $"There is no user with the SchoolEmail {command.SchoolEmail}");

    var user = await authRepository.GetUserWithAuthCodesBySchoolEmailAsync(command.SchoolEmail, cancellationToken);

    if (user!.IsVerified)
      return new SendAuthCodeResult(SendAuthCodeOutcome.UserAlreadyVerified, $"The user with the email with the school addreess ${command.SchoolEmail} is already verified");

    var now = timeProvider.GetUtcNow();

    var existingCodes = user.AuthCodes
    .Where(authCode => authCode.Purpose == AuthCodePurpose.SchoolEmailVerification)
    .Where(authCode => authCode.DeliveryAddress == command.SchoolEmail)
    .Where(authCode => authCode.ConsumedAt is null)
    .Where(authcode => now < authcode.ExpiresAt);

    if (!existingCodes.Any())
      return new SendAuthCodeResult(SendAuthCodeOutcome.CodeAlreadySent, "The user has already received and code");

    var expiresAt = now.AddMinutes(10);
    var verificationCode = GenerateVerificationCode();

    var authCode = new UserAuthCode
    {
      Id = Guid.NewGuid(),
      UserId = user!.Id,
      Purpose = AuthCodePurpose.SchoolEmailVerification,
      Code = verificationCode,
      DeliveryAddress = command.SchoolEmail,
      ExpiresAt = expiresAt,
      CreatedAt = now,
    };

    authRepository.AddAuthCode(authCode);
    await authRepository.SaveChangesAsync(cancellationToken);

    try
    {
      await authRepository.ExecuteInTransactionAsync(async ct =>
      {
        authRepository.AddAuthCode(authCode);
        await authRepository.SaveChangesAsync(ct);

        await authEmailService.SendSchoolVerificationCodeAsync(
                  user.FullName,
                  user.SchoolEmail,
                  verificationCode,
                  expiresAt,
                  ct);
      }, cancellationToken);
    }
    catch (Exception exception)
    {
      logger.LogError(exception, "Failed to sent the code for the user with school email {SchoolEmail}", user.SchoolEmail);
      throw;
    }

    return new SendAuthCodeResult(SendAuthCodeOutcome.Success, "The new confirmation code has been sent");
  }


  private static string GenerateVerificationCode()
  {
    return RandomNumberGenerator.GetInt32(100000, 1_000_000).ToString(CultureInfo.InvariantCulture);
  }
}
