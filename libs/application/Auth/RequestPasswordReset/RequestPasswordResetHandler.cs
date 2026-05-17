using System.Globalization;
using System.Security.Cryptography;
using Application.Abstractions.Email;
using Application.Auth.Abstractions;
using Domain.Entities;
using Domain.Enums;
using FluentValidation;
using Microsoft.Extensions.Logging;

namespace Application.Auth.RequestPasswordReset;

public class RequestPasswordResetHandler
{
  private const int ResetCodeLifetimeMinutes = 10;
  private const int ResendCooldownMinutes = 5;
  private const string GenericSuccessMessage = "If that private email is registered with StudyHub, a password reset code has been sent.";

  public static async Task<RequestPasswordResetResult> Handle(
      RequestPasswordResetCommand command,
      CancellationToken cancellationToken,
      IValidator<RequestPasswordResetCommand> validator,
      ILogger<RequestPasswordResetHandler> logger,
      IAuthRepository authRepository,
      TimeProvider timeProvider,
      IAuthEmailService authEmailService)
  {
    var validationResult = await validator.ValidateAsync(command, cancellationToken);
    if (!validationResult.IsValid)
    {
      return new RequestPasswordResetResult(
          RequestPasswordResetOutcome.InvalidRequest,
          string.Join(" ", validationResult.Errors.Select(error => error.ErrorMessage).Distinct()));
    }

    var privateEmail = AuthValueNormalizer.NormalizeEmail(command.PrivateEmail);
    var user = await authRepository.GetUserWithAuthCodesByPrivateEmailAsync(privateEmail, cancellationToken);
    if (user is null)
    {
      return new RequestPasswordResetResult(RequestPasswordResetOutcome.Success, GenericSuccessMessage);
    }

    var now = timeProvider.GetUtcNow();
    var existingCodes = user.AuthCodes
        .Where(authCode => authCode.Purpose == AuthCodePurpose.PasswordReset)
        .Where(authCode => authCode.DeliveryAddress == privateEmail)
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
        return new RequestPasswordResetResult(
            RequestPasswordResetOutcome.CodeAlreadySent,
            $"A password reset code was sent recently. Please wait {remainingMinutes} {minuteLabel} before requesting a new code.");
      }

      foreach (var existingCode in existingCodes)
      {
        existingCode.ConsumedAt = now;
      }
    }

    var expiresAt = now.AddMinutes(ResetCodeLifetimeMinutes);
    var resetCode = GenerateResetCode();

    var authCode = new UserAuthCode
    {
      Id = Guid.NewGuid(),
      UserId = user.Id,
      Purpose = AuthCodePurpose.PasswordReset,
      Code = resetCode,
      DeliveryAddress = privateEmail,
      ExpiresAt = expiresAt,
      CreatedAt = now,
    };

    try
    {
      await authRepository.ExecuteInTransactionAsync(async ct =>
      {
        authRepository.AddAuthCode(authCode);
        await authRepository.SaveChangesAsync(ct);

        await authEmailService.SendPasswordResetCodeAsync(
            user.FullName,
            user.PrivateEmail,
            resetCode,
            expiresAt,
            ct);
      }, cancellationToken);
    }
    catch (Exception exception)
    {
      logger.LogError(exception, "Failed to send a password reset code to private email {PrivateEmail}", privateEmail);
      return new RequestPasswordResetResult(
          RequestPasswordResetOutcome.EmailDeliveryFailed,
          "We could not send the password reset code. Please try again later.");
    }

    return new RequestPasswordResetResult(RequestPasswordResetOutcome.Success, GenericSuccessMessage);
  }

  private static string GenerateResetCode()
  {
    return RandomNumberGenerator.GetInt32(100000, 1_000_000).ToString(CultureInfo.InvariantCulture);
  }
}
