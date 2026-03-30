using Application.Auth.Login;
using Application.Auth.Register;
using Application.Options;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;

namespace Application.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddValidatorsFromAssemblyContaining<RegisterUserCommandValidator>();

        services.AddOptions<JwtSetting>()
            .BindConfiguration(JwtSetting.SectionName)
            .Validate(settings => !string.IsNullOrWhiteSpace(settings.Secret), $"{JwtSetting.SectionName}:Secret is required.")
            .Validate(settings => !string.IsNullOrWhiteSpace(settings.Issuer), $"{JwtSetting.SectionName}:Issuer is required.")
            .Validate(settings => !string.IsNullOrWhiteSpace(settings.Audience), $"{JwtSetting.SectionName}:Audience is required.")
            .Validate(settings => settings.AccessTokenLifetimeMinutes > 0, $"{JwtSetting.SectionName}:AccessTokenLifetimeMinutes must be greater than zero.")
            .Validate(settings => settings.RefreshTokenLifetimeDays > 0, $"{JwtSetting.SectionName}:RefreshTokenLifetimeDays must be greater than zero.")
            .ValidateOnStart();

        return services;
    }
}
