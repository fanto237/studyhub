using Api.Auth;
using Api.DTOs.Auth;
using Api.DTOs.Users;
using Api.Responses;
using Application.Auth.Login;
using Application.Auth.LogoutSession;
using Application.Auth.RefreshSession;
using Application.Auth.Register;
using Application.Auth.SendAuthCode;
using Application.Auth.VerifyAccount;
using Wolverine;

namespace Api.Endpoints;

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

    group.MapPost("/login", Login)
        .WithName("Login")
        .WithDescription("Logs a verified user in and sets access and refresh token cookies.");

    group.MapPost("/refresh", RefreshSession)
        .WithName("RefreshSession")
        .WithDescription("Rotates the refresh token and issues a new access token.")
        .RequireAuthorization();

    group.MapPost("/logout", Logout)
        .WithName("Logout")
        .WithDescription("Revokes the current refresh token session and clears auth cookies.")
        .RequireAuthorization();

    group.MapPost("/send-code", SendAuthCode)
        .WithName("SendCode")
        .WithDescription("Send confirmation code."); ;
    return app;
  }

  private static async Task<IResult> RegisterAccount(
      RegisterUserCommand command,
      IMessageBus bus,
      CancellationToken cancellationToken)
  {
    var result = await bus.InvokeAsync<RegisterUserResult>(command, cancellationToken);

    return result.Outcome switch
    {
      RegisterUserOutcome.Success => Results.Created($"/api/users/{result.UserId}", SendResponse.Success(new RegisterAccountResponse(
          result.UserId!.Value,
          result.PrivateEmail!,
          result.Username!,
          result.FullName!,
          result.SchoolEmail!,
          result.UniversityName!,
          result.IsVerified,
          result.Message))),
      RegisterUserOutcome.PrivateEmailAlreadyRegistered => Results.Conflict(SendResponse.Fail(new { message = result.Message })),
      RegisterUserOutcome.UsernameAlreadyRegistered => Results.Conflict(SendResponse.Fail(new { message = result.Message })),
      RegisterUserOutcome.SchoolEmailAlreadyRegistered => Results.Conflict(SendResponse.Fail(new { message = result.Message })),
      _ => Results.BadRequest(SendResponse.Fail(new { message = result.Message })),
    };
  }

  private static async Task<IResult> VerifyAccount(
      VerifyAccountCommand command,
      IMessageBus bus,
      CancellationToken cancellationToken)
  {
    var result = await bus.InvokeAsync<VerifyAccountResult>(command, cancellationToken);

    return result.Outcome switch
    {
      VerifyAccountOutcome.Success => Results.Ok(SendResponse.Success(new VerifyAccountResponse(
          result.UserId!.Value,
          result.SchoolEmail!,
          result.IsVerified,
          result.LastVerifiedAt,
          result.Message))),
      VerifyAccountOutcome.AlreadyVerified => Results.Conflict(SendResponse.Fail(new { message = result.Message })),
      _ => Results.BadRequest(SendResponse.Fail(new { message = result.Message })),
    };
  }

  private static async Task<IResult> Login(
      LoginCommand command,
      HttpContext httpContext,
      IMessageBus bus,
      CancellationToken cancellationToken)
  {
    var result = await bus.InvokeAsync<LoginResult>(
        command,
        cancellationToken);

    return result.Outcome switch
    {
      LoginOutcome.Success => CreateAuthenticatedResult(httpContext, result),
      LoginOutcome.AccountNotVerified => Results.Json(SendResponse.Fail(new { message = result.Message }), statusCode: StatusCodes.Status403Forbidden),
      LoginOutcome.InvalidCredentials => Results.Json(SendResponse.Fail(new { message = result.Message }), statusCode: StatusCodes.Status404NotFound),
      _ => Results.BadRequest(SendResponse.Fail(new { message = result.Message })),
    };
  }

  private static async Task<IResult> RefreshSession(
      HttpContext httpContext,
      IMessageBus bus,
      CancellationToken cancellationToken)
  {
    httpContext.Request.Cookies.TryGetValue(AuthCookies.RefreshTokenCookieName, out var refreshToken);

    var result = await bus.InvokeAsync<RefreshSessionResult>(
        new RefreshSessionCommand(refreshToken ?? string.Empty),
        cancellationToken);

    if (result.Outcome == RefreshSessionOutcome.Success)
    {
      return CreateAuthenticatedResult(httpContext, result);
    }

    AuthCookies.ClearAuthCookies(httpContext);

    return result.Outcome switch
    {
      RefreshSessionOutcome.InvalidRefreshToken => Results.Json(SendResponse.Fail(new { message = result.Message }), statusCode: StatusCodes.Status401Unauthorized),
      _ => Results.Json(SendResponse.Fail(new { message = "The refresh token is invalid or has expired." }), statusCode: StatusCodes.Status401Unauthorized),
    };
  }

  private static async Task<IResult> Logout(
      HttpContext httpContext,
      IMessageBus bus,
      CancellationToken cancellationToken)
  {
    httpContext.Request.Cookies.TryGetValue(AuthCookies.RefreshTokenCookieName, out var refreshToken);

    var result = await bus.InvokeAsync<LogoutSessionResult>(
        new LogoutSessionCommand(refreshToken),
        cancellationToken);

    AuthCookies.ClearAuthCookies(httpContext);

    return result.Outcome switch
    {
      LogoutSessionOutcome.Success => Results.Ok(SendResponse.Success(new LogoutResponse(result.Message))),
      _ => Results.BadRequest(SendResponse.Fail(new { message = result.Message })),
    };
  }

  private static async Task<IResult> SendAuthCode(SendAuthCodeCommand command, IMessageBus bus, HttpContext httpContext,
      CancellationToken cancellationToken)
  {

    var result = await bus.InvokeAsync<SendAuthCodeResult>(command, cancellationToken);

    return result.Outcome switch
    {
      SendAuthCodeOutcome.Success => Results.Ok(SendResponse.Success(result.Message)),
      SendAuthCodeOutcome.SchoolEmailNotRegistered => Results.Json(SendResponse.Fail(new { message = result.Message }), statusCode: StatusCodes.Status404NotFound),
      SendAuthCodeOutcome.UserAlreadyVerified => Results.Json(SendResponse.Fail(new { message = result.Message }), statusCode: StatusCodes.Status409Conflict),
      SendAuthCodeOutcome.CodeAlreadySent => Results.Json(SendResponse.Fail(new { message = result.Message }), statusCode: StatusCodes.Status429TooManyRequests),
      _ => Results.BadRequest(SendResponse.Fail(new { message = result.Message })),
    };
  }

  private static IResult CreateAuthenticatedResult(HttpContext httpContext, LoginResult result)
  {
    AuthCookies.AppendAuthCookies(
        httpContext,
        result.AccessToken!,
        result.AccessTokenExpiresAt!.Value,
        result.RefreshToken!,
        result.RefreshTokenExpiresAt!.Value);

    return Results.Ok(SendResponse.Success(new AuthSessionResponse(
        result.UserId!.Value,
        result.Username!,
        result.PrivateEmail!,
        result.FullName!,
        result.Role!.Value,
        result.IsVerified,
        result.AccessTokenExpiresAt.Value,
        result.RefreshTokenExpiresAt.Value,
        result.Message)));
  }

  private static IResult CreateAuthenticatedResult(HttpContext httpContext, RefreshSessionResult result)
  {
    AuthCookies.AppendAuthCookies(
        httpContext,
        result.AccessToken!,
        result.AccessTokenExpiresAt!.Value,
        result.RefreshToken!,
        result.RefreshTokenExpiresAt!.Value);

    return Results.Ok(SendResponse.Success(new AuthSessionResponse(
        result.UserId!.Value,
        result.Username!,
        result.PrivateEmail!,
        result.FullName!,
        result.Role!.Value,
        result.IsVerified,
        result.AccessTokenExpiresAt.Value,
        result.RefreshTokenExpiresAt.Value,
        result.Message)));
  }
}
