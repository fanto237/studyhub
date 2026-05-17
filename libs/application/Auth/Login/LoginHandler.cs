using Application.Auth.Abstractions;
using Domain.Entities;
using FluentValidation;
using Microsoft.AspNetCore.Identity;

namespace Application.Auth.Login;

public class LoginHandler
{
  public static async Task<LoginResult> Handle(
      LoginCommand command,
      IValidator<LoginCommand> validator,
      IAuthRepository authRepository,
      IAuthTokenService authTokenService,
      IPasswordHasher<User> passwordHasher,
      TimeProvider timeProvider,
      CancellationToken cancellationToken)
  {
    var validationResult = await validator.ValidateAsync(command, cancellationToken);
    if (!validationResult.IsValid)
    {
      return new LoginResult(
          LoginOutcome.InvalidRequest,
          string.Join(" ", validationResult.Errors.Select(error => error.ErrorMessage).Distinct()));
    }

    var usernameOrPrivateEmail = AuthValueNormalizer.NormalizeUsernameOrPrivateEmail(command.UsernameOrPrivateEmail);
    var user = await authRepository.GetUserByUsernameOrPrivateEmailAsync(usernameOrPrivateEmail, cancellationToken);
    if (user is null || user.DeletedAt is not null)
    {
      return new LoginResult(
          LoginOutcome.InvalidCredentials,
          "The provided username/private email is incorrect.");
    }

    var passwordVerificationResult = passwordHasher.VerifyHashedPassword(user, user.PasswordHash, command.Password);
    if (passwordVerificationResult == PasswordVerificationResult.Failed)
    {
      return new LoginResult(
          LoginOutcome.InvalidCredentials,
          "The provided password is incorrect.");
    }

    if (!user.IsVerified)
    {
      return new LoginResult(
          LoginOutcome.AccountNotVerified,
          "You must verify your school email before you can log in.",
          Username: user.Username,
          SchoolEmail: user.SchoolEmail);
    }

    var now = timeProvider.GetUtcNow();
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
      if (passwordVerificationResult == PasswordVerificationResult.SuccessRehashNeeded)
      {
        user.PasswordHash = passwordHasher.HashPassword(user, command.Password);
      }

      authRepository.AddRefreshToken(userRefreshToken);
      await authRepository.SaveChangesAsync(ct);
    }, cancellationToken);

    return new LoginResult(
        LoginOutcome.Success,
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
        user.IsVerified,
        user.SchoolEmail);
  }
}
