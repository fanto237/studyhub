using System.Security.Claims;
using Api.Auth;
using Api.DTOs.Auth;
using Api.DTOs.Users;
using Api.Responses;
using Application.Auth.Login;
using Application.Auth.LogoutSession;
using Application.Auth.RefreshSession;
using Application.Auth.Register;
using Application.Auth.RequestPasswordReset;
using Application.Auth.ResetPassword;
using Application.Auth.SendAuthCode;
using Application.Auth.Totp.CompleteLogin;
using Application.Auth.Totp.Disable;
using Application.Auth.Totp.Enable;
using Application.Auth.Totp.StartSetup;
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
        .WithDescription("Logs a verified user in or returns a two-factor challenge when TOTP is enabled.");

    group.MapPost("/login/totp", CompleteTotpLogin)
        .WithName("CompleteTotpLogin")
        .WithDescription("Completes a login that requires an authenticator app code and then sets auth cookies.");

    group.MapPost("/totp/setup", StartTotpSetup)
        .WithName("StartTotpSetup")
        .WithDescription("Starts authenticator app enrollment for the authenticated user.")
        .RequireAuthorization();

    group.MapPost("/totp/enable", EnableTotp)
        .WithName("EnableTotp")
        .WithDescription("Confirms authenticator app enrollment with a valid TOTP code.")
        .RequireAuthorization();

    group.MapPost("/totp/disable", DisableTotp)
        .WithName("DisableTotp")
        .WithDescription("Disables authenticator app two-factor authentication after password and TOTP verification.")
        .RequireAuthorization();

    group.MapPost("/refresh", RefreshSession)
        .WithName("RefreshSession")
        .WithDescription("Rotates the refresh token and issues a new access token.");

    group.MapPost("/logout", Logout)
        .WithName("Logout")
        .WithDescription("Revokes the current refresh token session and clears auth cookies.")
        .RequireAuthorization();

    group.MapPost("/send-code", SendAuthCode)
        .WithName("SendCode")
        .WithDescription("Send confirmation code.");

    group.MapPost("/request-password-reset", RequestPasswordReset)
        .WithName("RequestPasswordReset")
        .WithDescription("Sends a password reset code to the account's private email address.");

    group.MapPost("/reset-password", ResetPassword)
        .WithName("ResetPassword")
        .WithDescription("Resets a password using a valid private email reset code.");

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
      LoginOutcome.TwoFactorRequired => Results.Json(
          SendResponse.Success(new TwoFactorRequiredLoginResponse(
              true,
              result.TwoFactorChallengeId!.Value,
              result.TwoFactorChallengeExpiresAt!.Value,
              result.Username!,
              result.Message)),
          statusCode: StatusCodes.Status202Accepted),
      LoginOutcome.AccountNotVerified => Results.Json(
          SendResponse.Fail(new UnverifiedAccountLoginResponse(
              result.Message,
              result.SchoolEmail!,
              result.Username)),
          statusCode: StatusCodes.Status403Forbidden),
      LoginOutcome.InvalidCredentials => Results.Json(SendResponse.Fail(new { message = result.Message }), statusCode: StatusCodes.Status404NotFound),
      _ => Results.BadRequest(SendResponse.Fail(new { message = result.Message })),
    };
  }

  private static async Task<IResult> CompleteTotpLogin(
      CompleteTotpLoginRequest request,
      HttpContext httpContext,
      IMessageBus bus,
      CancellationToken cancellationToken)
  {
    var result = await bus.InvokeAsync<CompleteTotpLoginResult>(
        new CompleteTotpLoginCommand(request.ChallengeId, request.Code),
        cancellationToken);

    return result.Outcome switch
    {
      CompleteTotpLoginOutcome.Success => CreateAuthenticatedResult(httpContext, result),
      CompleteTotpLoginOutcome.TooManyAttempts => Results.Json(SendResponse.Fail(new { message = result.Message }), statusCode: StatusCodes.Status429TooManyRequests),
      CompleteTotpLoginOutcome.ReplayedCode => Results.Conflict(SendResponse.Fail(new { message = result.Message })),
      CompleteTotpLoginOutcome.InvalidCode => Results.Json(SendResponse.Fail(new { message = result.Message }), statusCode: StatusCodes.Status401Unauthorized),
      CompleteTotpLoginOutcome.InvalidChallenge => Results.Json(SendResponse.Fail(new { message = result.Message }), statusCode: StatusCodes.Status401Unauthorized),
      CompleteTotpLoginOutcome.ExpiredChallenge => Results.Json(SendResponse.Fail(new { message = result.Message }), statusCode: StatusCodes.Status401Unauthorized),
      CompleteTotpLoginOutcome.TotpNotEnabled => Results.Conflict(SendResponse.Fail(new { message = result.Message })),
      _ => Results.BadRequest(SendResponse.Fail(new { message = result.Message })),
    };
  }

  private static async Task<IResult> StartTotpSetup(
      ClaimsPrincipal user,
      IMessageBus bus,
      CancellationToken cancellationToken)
  {
    if (!TryGetAuthenticatedUserId(user, out var userId))
    {
      return Results.Json(SendResponse.Fail(new { message = "Authentication is required." }), statusCode: StatusCodes.Status401Unauthorized);
    }

    var result = await bus.InvokeAsync<StartTotpSetupResult>(
        new StartTotpSetupCommand(userId),
        cancellationToken);

    return result.Outcome switch
    {
      StartTotpSetupOutcome.Success => Results.Ok(SendResponse.Success(new TotpSetupResponse(
          result.ManualEntryKey!,
          result.OtpAuthUri!,
          result.ExpiresAt!.Value,
          result.Message))),
      StartTotpSetupOutcome.AlreadyEnabled => Results.Conflict(SendResponse.Fail(new { message = result.Message })),
      StartTotpSetupOutcome.NotFound => Results.NotFound(SendResponse.Fail(new { message = result.Message })),
      _ => Results.BadRequest(SendResponse.Fail(new { message = result.Message })),
    };
  }

  private static async Task<IResult> EnableTotp(
      EnableTotpRequest request,
      ClaimsPrincipal user,
      HttpContext httpContext,
      IMessageBus bus,
      CancellationToken cancellationToken)
  {
    if (!TryGetAuthenticatedUserId(user, out var userId))
    {
      return Results.Json(SendResponse.Fail(new { message = "Authentication is required." }), statusCode: StatusCodes.Status401Unauthorized);
    }

    httpContext.Request.Cookies.TryGetValue(AuthCookies.RefreshTokenCookieName, out var refreshToken);

    var result = await bus.InvokeAsync<EnableTotpResult>(
        new EnableTotpCommand(userId, request.Code, refreshToken),
        cancellationToken);

    return result.Outcome switch
    {
      EnableTotpOutcome.Success => Results.Ok(SendResponse.Success(new TotpStatusResponse(
          result.IsTotpEnabled,
          result.TotpEnabledAt,
          result.Message))),
      EnableTotpOutcome.AlreadyEnabled => Results.Conflict(SendResponse.Fail(new { message = result.Message })),
      EnableTotpOutcome.NotFound => Results.NotFound(SendResponse.Fail(new { message = result.Message })),
      EnableTotpOutcome.SetupNotStarted => Results.Conflict(SendResponse.Fail(new { message = result.Message })),
      EnableTotpOutcome.SetupExpired => Results.Json(SendResponse.Fail(new { message = result.Message }), statusCode: StatusCodes.Status410Gone),
      EnableTotpOutcome.ReplayedCode => Results.Conflict(SendResponse.Fail(new { message = result.Message })),
      EnableTotpOutcome.InvalidCode => Results.BadRequest(SendResponse.Fail(new { message = result.Message })),
      _ => Results.BadRequest(SendResponse.Fail(new { message = result.Message })),
    };
  }

  private static async Task<IResult> DisableTotp(
      DisableTotpRequest request,
      ClaimsPrincipal user,
      HttpContext httpContext,
      IMessageBus bus,
      CancellationToken cancellationToken)
  {
    if (!TryGetAuthenticatedUserId(user, out var userId))
    {
      return Results.Json(SendResponse.Fail(new { message = "Authentication is required." }), statusCode: StatusCodes.Status401Unauthorized);
    }

    httpContext.Request.Cookies.TryGetValue(AuthCookies.RefreshTokenCookieName, out var refreshToken);

    var result = await bus.InvokeAsync<DisableTotpResult>(
        new DisableTotpCommand(userId, request.Password, request.Code, refreshToken),
        cancellationToken);

    return result.Outcome switch
    {
      DisableTotpOutcome.Success => Results.Ok(SendResponse.Success(new TotpStatusResponse(
          result.IsTotpEnabled,
          result.TotpEnabledAt,
          result.Message))),
      DisableTotpOutcome.NotFound => Results.NotFound(SendResponse.Fail(new { message = result.Message })),
      DisableTotpOutcome.NotEnabled => Results.Conflict(SendResponse.Fail(new { message = result.Message })),
      DisableTotpOutcome.ReplayedCode => Results.Conflict(SendResponse.Fail(new { message = result.Message })),
      DisableTotpOutcome.InvalidPassword => Results.BadRequest(SendResponse.Fail(new { message = result.Message })),
      DisableTotpOutcome.InvalidCode => Results.BadRequest(SendResponse.Fail(new { message = result.Message })),
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

  private static async Task<IResult> SendAuthCode(
      SendAuthCodeCommand command,
      IMessageBus bus,
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

  private static async Task<IResult> RequestPasswordReset(
      RequestPasswordResetCommand command,
      IMessageBus bus,
      CancellationToken cancellationToken)
  {
    var result = await bus.InvokeAsync<RequestPasswordResetResult>(command, cancellationToken);

    return result.Outcome switch
    {
      RequestPasswordResetOutcome.Success => Results.Ok(SendResponse.Success(new RequestPasswordResetResponse(result.Message))),
      RequestPasswordResetOutcome.CodeAlreadySent => Results.Json(SendResponse.Fail(new { message = result.Message }), statusCode: StatusCodes.Status429TooManyRequests),
      RequestPasswordResetOutcome.EmailDeliveryFailed => Results.Json(SendResponse.Fail(new { message = result.Message }), statusCode: StatusCodes.Status503ServiceUnavailable),
      _ => Results.BadRequest(SendResponse.Fail(new { message = result.Message })),
    };
  }

  private static async Task<IResult> ResetPassword(
      ResetPasswordCommand command,
      IMessageBus bus,
      HttpContext httpContext,
      CancellationToken cancellationToken)
  {
    var result = await bus.InvokeAsync<ResetPasswordResult>(command, cancellationToken);

    return result.Outcome switch
    {
      ResetPasswordOutcome.Success => ClearCookiesAndReturnPasswordResetSuccess(httpContext, result),
      ResetPasswordOutcome.InvalidCode => Results.BadRequest(SendResponse.Fail(new { message = result.Message })),
      ResetPasswordOutcome.ExpiredCode => Results.BadRequest(SendResponse.Fail(new { message = result.Message })),
      _ => Results.BadRequest(SendResponse.Fail(new { message = result.Message })),
    };
  }

  private static IResult ClearCookiesAndReturnPasswordResetSuccess(HttpContext httpContext, ResetPasswordResult result)
  {
    AuthCookies.ClearAuthCookies(httpContext);

    return Results.Ok(SendResponse.Success(new ResetPasswordResponse(result.Message)));
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

  private static IResult CreateAuthenticatedResult(HttpContext httpContext, CompleteTotpLoginResult result)
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

  private static bool TryGetAuthenticatedUserId(ClaimsPrincipal user, out Guid userId)
  {
    var userIdValue = user.FindFirstValue(ClaimTypes.NameIdentifier);
    return Guid.TryParse(userIdValue, out userId);
  }
}
