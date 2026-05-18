using Microsoft.AspNetCore.Http;

namespace Api.Auth;

internal static class AuthCookies
{
    public const string AccessTokenCookieName = "studyhub.access_token";
    public const string RefreshTokenCookieName = "studyhub.refresh_token";

    public static void AppendAuthCookies(
        HttpContext httpContext,
        string accessToken,
        DateTimeOffset accessTokenExpiresAt,
        string refreshToken,
        DateTimeOffset refreshTokenExpiresAt)
    {
        httpContext.Response.Cookies.Append(
            AccessTokenCookieName,
            accessToken,
            CreateCookieOptions(httpContext, accessTokenExpiresAt, "/"));

        httpContext.Response.Cookies.Append(
            RefreshTokenCookieName,
            refreshToken,
            CreateCookieOptions(httpContext, refreshTokenExpiresAt, "/api/auth"));
    }

    public static void ClearAccessTokenCookie(HttpContext httpContext)
    {
        httpContext.Response.Cookies.Delete(
            AccessTokenCookieName,
            CreateDeletionCookieOptions(httpContext, "/"));
    }

    public static void ClearAuthCookies(HttpContext httpContext)
    {
        ClearAccessTokenCookie(httpContext);

        httpContext.Response.Cookies.Delete(
            RefreshTokenCookieName,
            CreateDeletionCookieOptions(httpContext, "/api/auth"));
    }

    private static CookieOptions CreateCookieOptions(HttpContext httpContext, DateTimeOffset expiresAt, string path)
    {
        return new CookieOptions
        {
            HttpOnly = true,
            Secure = httpContext.Request.IsHttps,
            SameSite = SameSiteMode.Lax,
            Path = path,
            Expires = expiresAt,
        };
    }

    private static CookieOptions CreateDeletionCookieOptions(HttpContext httpContext, string path)
    {
        return new CookieOptions
        {
            HttpOnly = true,
            Secure = httpContext.Request.IsHttps,
            SameSite = SameSiteMode.Lax,
            Path = path,
            Expires = DateTimeOffset.UnixEpoch,
        };
    }
}
