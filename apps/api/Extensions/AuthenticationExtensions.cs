using System.Security.Claims;
using System.Text;
using Api.Auth;
using Application.Auth.Abstractions;
using Application.Options;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Api.Extensions;

public static class AuthenticationExtensions
{
    public static IServiceCollection AddApiAuthentication(this IServiceCollection services)
    {
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer();

        services.AddAuthorization();

        services.AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
            .Configure<IOptions<JwtSetting>>((options, jwtSettingOptions) =>
            {
                var jwtSetting = jwtSettingOptions.Value;
                var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSetting.Secret));

                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = signingKey,
                    ValidateIssuer = true,
                    ValidIssuer = jwtSetting.Issuer,
                    ValidateAudience = true,
                    ValidAudience = jwtSetting.Audience,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero,
                };

                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        if (context.Request.Cookies.TryGetValue(AuthCookies.AccessTokenCookieName, out var accessToken)
                            && !string.IsNullOrWhiteSpace(accessToken))
                        {
                            context.Token = accessToken;
                        }

                        return Task.CompletedTask;
                    },
                    OnTokenValidated = async context =>
                    {
                        var userIdValue = context.Principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                        if (!Guid.TryParse(userIdValue, out var userId))
                        {
                            AuthCookies.ClearAuthCookies(context.HttpContext);
                            context.Fail("The access token is invalid.");
                            return;
                        }

                        var authRepository = context.HttpContext.RequestServices.GetRequiredService<IAuthRepository>();
                        var isActiveUser = await authRepository.IsUserActiveAsync(userId, context.HttpContext.RequestAborted);
                        if (!isActiveUser)
                        {
                            AuthCookies.ClearAuthCookies(context.HttpContext);
                            context.Fail("The user account is no longer active.");
                        }
                    },
                };
            });

        return services;
    }
}
