using Application.Auth.Abstractions;
using Domain.Entities;
using Domain.Enums;
using FluentValidation;
using Microsoft.AspNetCore.Identity;

namespace Application.Auth.ResetPassword;

public class ResetPasswordHandler
{
  public static async Task<ResetPasswordResult> Handle(
      ResetPasswordCommand command,
      CancellationToken cancellationToken,
      IValidator<ResetPasswordCommand> validator,
      IAuthRepository authRepository,
      IPasswordHasher<User> passwordHasher,
      TimeProvider timeProvider)
  {
    var validationResult = await validator.ValidateAsync(command, cancellationToken);
    if (!validationResult.IsValid)
    {
      return new ResetPasswordResult(
          ResetPasswordOutcome.InvalidRequest,
          string.Join(" ", validationResult.Errors.Select(error => error.ErrorMessage).Distinct()));
    }

    var privateEmail = AuthValueNormalizer.NormalizeEmail(command.PrivateEmail);
    var code = AuthValueNormalizer.NormalizeCode(command.Code);
    var user = await authRepository.GetUserWithPasswordResetStateByPrivateEmailAsync(privateEmail, cancellationToken);
    if (user is null)
    {
      return new ResetPasswordResult(
          ResetPasswordOutcome.InvalidCode,
          "The password reset code is invalid or has expired.");
    }

    var resetCode = user.AuthCodes
        .Where(authCode => authCode.Purpose == AuthCodePurpose.PasswordReset)
        .Where(authCode => authCode.DeliveryAddress == privateEmail)
        .Where(authCode => authCode.ConsumedAt is null)
        .OrderByDescending(authCode => authCode.CreatedAt)
        .FirstOrDefault(authCode => authCode.Code == code);

    if (resetCode is null)
    {
      return new ResetPasswordResult(
          ResetPasswordOutcome.InvalidCode,
          "The password reset code is invalid or has expired.");
    }

    var now = timeProvider.GetUtcNow();
    if (resetCode.ExpiresAt <= now)
    {
      return new ResetPasswordResult(
          ResetPasswordOutcome.ExpiredCode,
          "The password reset code has expired. Request a new code and try again.");
    }

    await authRepository.ExecuteInTransactionAsync(async ct =>
    {
      user.PasswordHash = passwordHasher.HashPassword(user, command.NewPassword);

      foreach (var authCode in user.AuthCodes.Where(authCode => authCode.Purpose == AuthCodePurpose.PasswordReset && authCode.ConsumedAt is null))
      {
        authCode.ConsumedAt = now;
      }

      foreach (var refreshToken in user.RefreshTokens.Where(refreshToken => refreshToken.RevokedAt is null))
      {
        refreshToken.RevokedAt = now;
        refreshToken.LastUsedAt = now;
      }

      await authRepository.SaveChangesAsync(ct);
    }, cancellationToken);

    return new ResetPasswordResult(
        ResetPasswordOutcome.Success,
        "Your password has been reset. You can log in with your new password now.");
  }
}
