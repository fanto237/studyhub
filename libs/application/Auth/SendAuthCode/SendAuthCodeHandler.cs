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
  private const int VerificationCodeLifetimeMinutes = 10;
  private const int ResendCooldownMinutes = 5;

  public static async Task<SendAuthCodeResult> Handle(
      SendAuthCodeCommand command,
      CancellationToken cancellationToken,
      IValidator<SendAuthCodeCommand> validator,
      ILogger<SendAuthCodeHandler> logger,
      IAuthRepository authRepository,
      TimeProvider timeProvider,
      IAuthEmailService authEmailService)
  {
    var validationResult = await validator.ValidateAsync(command, cancellationToken);
    if (!validationResult.IsValid)
    {
      return new SendAuthCodeResult(
          SendAuthCodeOutcome.InvalidRequest,
          string.Join(" ", validationResult.Errors.Select(error => error.ErrorMessage).Distinct()));
    }

    var schoolEmail = AuthValueNormalizer.NormalizeEmail(command.SchoolEmail);
    var userExists = await authRepository.SchoolEmailExistsAsync(schoolEmail, cancellationToken);

    if (!userExists)
    {
      return new SendAuthCodeResult(
          SendAuthCodeOutcome.SchoolEmailNotRegistered,
          $"There is no user with the school email {schoolEmail}.");
    }

    var user = await authRepository.GetUserWithAuthCodesBySchoolEmailAsync(schoolEmail, cancellationToken);
    // if (user is null)
    // {
    //   return new SendAuthCodeResult(
    //       SendAuthCodeOutcome.SchoolEmailNotRegistered,
    //       $"There is no user with the school email {schoolEmail}.");
    // }

    if (user!.IsVerified)
    {
      return new SendAuthCodeResult(
          SendAuthCodeOutcome.UserAlreadyVerified,
          $"The user with the school email {schoolEmail} is already verified.");
    }

    var now = timeProvider.GetUtcNow();

    var existingCodes = user.AuthCodes
        .Where(authCode => authCode.Purpose == AuthCodePurpose.SchoolEmailVerification)
        .Where(authCode => authCode.DeliveryAddress == schoolEmail)
        .Where(authCode => authCode.ConsumedAt is null)
        .OrderByDescending(authCode => authCode.CreatedAt)
        .ToArray();

    var latestCode = existingCodes.FirstOrDefault();
    if (latestCode is not null)
    {
      var resendAvailableAt = latestCode.CreatedAt.AddMinutes(ResendCooldownMinutes);
      if (now < resendAvailableAt)
      {
        var remainingMinutes = Math.Max(
            1,
            (int)Math.Ceiling((resendAvailableAt - now).TotalMinutes));
        var minuteLabel = remainingMinutes == 1 ? "minute" : "minutes";
        return new SendAuthCodeResult(
            SendAuthCodeOutcome.CodeAlreadySent,
            $"A verification code was sent recently. Please wait {remainingMinutes} {minuteLabel} before requesting a new code.");
      }

      foreach (var existingCode in existingCodes)
      {
        existingCode.ConsumedAt = now;
      }
    }

    var expiresAt = now.AddMinutes(VerificationCodeLifetimeMinutes);
    var verificationCode = GenerateVerificationCode();

    var authCode = new UserAuthCode
    {
      Id = Guid.NewGuid(),
      UserId = user.Id,
      Purpose = AuthCodePurpose.SchoolEmailVerification,
      Code = verificationCode,
      DeliveryAddress = schoolEmail,
      ExpiresAt = expiresAt,
      CreatedAt = now,
    };

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
      logger.LogError(exception, "Failed to send the code for the user with school email {SchoolEmail}", user.SchoolEmail);
      throw;
    }

    return new SendAuthCodeResult(SendAuthCodeOutcome.Success, "The new confirmation code has been sent.");
  }

  private static string GenerateVerificationCode()
  {
    return RandomNumberGenerator.GetInt32(100000, 1_000_000).ToString(CultureInfo.InvariantCulture);
  }
}
