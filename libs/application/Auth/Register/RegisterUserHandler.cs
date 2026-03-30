using System.Globalization;
using System.Security.Cryptography;
using Application.Abstractions.Email;
using Application.Auth.Abstractions;
using Domain.Entities;
using Domain.Enums;
using FluentValidation;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;

namespace Application.Auth.Register;

public class RegisterUserHandler
{
  public static async Task<RegisterUserResult> Handle(
      RegisterUserCommand command,
      IValidator<RegisterUserCommand> validator,
      IAuthRepository authRepository,
      IPasswordHasher<User> passwordHasher,
      IAuthEmailService authEmailService,
      TimeProvider timeProvider,
      ILogger<RegisterUserHandler> logger,
      CancellationToken cancellationToken)
  {
    var validationResult = await validator.ValidateAsync(command, cancellationToken);
    if (!validationResult.IsValid)
    {
      return new RegisterUserResult(
          RegisterUserOutcome.InvalidRequest,
          string.Join(" ", validationResult.Errors.Select(error => error.ErrorMessage).Distinct()));
    }

    var privateEmail = AuthValueNormalizer.NormalizeEmail(command.PrivateEmail);
    var schoolEmail = AuthValueNormalizer.NormalizeEmail(command.SchoolEmail);
    var username = AuthValueNormalizer.NormalizeUsername(command.Username);
    var fullName = AuthValueNormalizer.NormalizeFullName(command.FullName);
    var universityName = AuthValueNormalizer.NormalizeUniversityName(command.UniversityName);

    if (await authRepository.PrivateEmailExistsAsync(privateEmail, cancellationToken))
    {
      return new RegisterUserResult(
          RegisterUserOutcome.PrivateEmailAlreadyRegistered,
          "A user with that private email already exists.");
    }

    if (await authRepository.UsernameExistsAsync(username, cancellationToken))
    {
      return new RegisterUserResult(
          RegisterUserOutcome.UsernameAlreadyRegistered,
          "That username is already taken.");
    }

    if (await authRepository.SchoolEmailExistsAsync(schoolEmail, cancellationToken))
    {
      return new RegisterUserResult(
          RegisterUserOutcome.SchoolEmailAlreadyRegistered,
          "A user with that school email already exists.");
    }

    var now = timeProvider.GetUtcNow();
    var expiresAt = now.AddMinutes(10);
    var verificationCode = GenerateVerificationCode();
    var user = new User
    {
      Id = Guid.NewGuid(),
      PrivateEmail = privateEmail,
      Username = username,
      FullName = fullName,
      SchoolEmail = schoolEmail,
      UniversityName = universityName,
      IsVerified = false,
      LastVerifiedAt = null,
      KarmaScore = 0,
      Role = UserRole.User,
      CreatedAt = now,
    };

    user.PasswordHash = passwordHasher.HashPassword(user, command.Password);

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
        authRepository.AddUser(user);
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
      logger.LogError(exception, "Failed to register user with private email {PrivateEmail}", privateEmail);
      throw;
    }

    return new RegisterUserResult(
        RegisterUserOutcome.Success,
        "Registration successful. Enter the verification code sent to your school email to activate your account.",
        user.Id,
        user.PrivateEmail,
        user.Username,
        user.FullName,
        user.SchoolEmail,
        user.UniversityName,
        user.IsVerified);
  }

  private static string GenerateVerificationCode()
  {
    return RandomNumberGenerator.GetInt32(100000, 1_000_000).ToString(CultureInfo.InvariantCulture);
  }
}
