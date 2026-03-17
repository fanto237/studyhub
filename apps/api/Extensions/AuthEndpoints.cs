using Api.DTOs.Users;
using Application.Auth.Register;
using Application.Auth.VerifyAccount;
using Wolverine;

namespace Api.Extensions;

public static class AuthEndpoints
{
  public static WebApplication MapAuthEndpoints(this WebApplication app)
  {
    var group = app.MapGroup("/api/auth")
        .WithTags("Auth");

    group.MapPost("/register", RegisterAccount)
        .WithName("RegisterAccount")
        .WithDescription("Registers a new StudyHub account and sends a school email verification code.");

    group.MapPost("/verify-account", VerifyAccount)
        .WithName("VerifyAccount")
        .WithDescription("Verifies a StudyHub account using the school email verification code.");

    return app;
  }

  private static async Task<IResult> RegisterAccount(
      RegisterUserCommand command,
      IMessageBus bus,
      CancellationToken cancellationToken)
  {
    var result = await bus.InvokeAsync<RegisterUserResult>(command);

    return result.Outcome switch
    {
      RegisterUserOutcome.Success => Results.Created($"/api/users/{result.UserId}", new RegisterAccountResponse(
          result.UserId!.Value,
          result.PrivateEmail!,
          result.Username!,
          result.FullName!,
          result.SchoolEmail!,
          result.IsVerified,
          result.Message)),
      RegisterUserOutcome.PrivateEmailAlreadyRegistered => Results.Conflict(new { message = result.Message }),
      RegisterUserOutcome.UsernameAlreadyRegistered => Results.Conflict(new { message = result.Message }),
      RegisterUserOutcome.SchoolEmailAlreadyRegistered => Results.Conflict(new { message = result.Message }),
      _ => Results.BadRequest(new { message = result.Message }),
    };
  }

  private static async Task<IResult> VerifyAccount(
      VerifyAccountCommand command,
      IMessageBus bus,
      CancellationToken cancellationToken)
  {
    var result = await bus.InvokeAsync<VerifyAccountResult>(
        command,
        cancellationToken);

    return result.Outcome switch
    {
      VerifyAccountOutcome.Success => Results.Ok(new VerifyAccountResponse(
          result.UserId!.Value,
          result.SchoolEmail!,
          result.IsVerified,
          result.LastVerifiedAt,
          result.Message)),
      VerifyAccountOutcome.AlreadyVerified => Results.Conflict(new { message = result.Message }),
      _ => Results.BadRequest(new { message = result.Message }),
    };
  }
}
