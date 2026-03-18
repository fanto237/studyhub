using Amazon.Runtime;
using Amazon.S3;
using Application.Abstractions.Email;
using Application.Auth.Abstractions;
using Application.Posts.Abstractions;
using Infrastructure.Auth;
using Infrastructure.Email;
using Infrastructure.Options;
using Infrastructure.Persistence;
using Infrastructure.Posts;
using Infrastructure.Storage;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Npgsql;

namespace Infrastructure.Extensions;

public static class ServiceCollectionExtensions
{
  public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
  {
    var rawConnectionString = configuration["ConnectionString:Default"]
        ?? configuration.GetConnectionString("Default")
        ?? throw new InvalidOperationException(
            "Database connection string was not found. Configure 'ConnectionString:Default' in user secrets.");

    var connectionString = NormalizeConnectionString(rawConnectionString);

    services.Configure<EmailSetting>(configuration.GetSection(EmailSetting.SectionName));

    services.AddOptions<CloudflareOptions>()
        .BindConfiguration(CloudflareOptions.SectionName)
        .Validate(options => !string.IsNullOrWhiteSpace(options.Api), $"{CloudflareOptions.SectionName}:Api is required.")
        .Validate(options => !string.IsNullOrWhiteSpace(options.AccessKeyId), $"{CloudflareOptions.SectionName}:AccessKeyId is required.")
        .Validate(options => !string.IsNullOrWhiteSpace(options.SecretAccessKey), $"{CloudflareOptions.SectionName}:SecretAccessKey is required.")
        .Validate(options => !string.IsNullOrWhiteSpace(options.BucketName), $"{CloudflareOptions.SectionName}:BucketName is required.")
        .ValidateOnStart();

    services.AddDbContext<StudyHubDbContext>(options =>
        options.UseNpgsql(connectionString)
          .EnableSensitiveDataLogging()
          .LogTo(Console.WriteLine, LogLevel.Information));

    services.AddSingleton<IAmazonS3>(serviceProvider =>
    {
      var cloudflareOptions = serviceProvider.GetRequiredService<IOptions<CloudflareOptions>>().Value;
      var credentials = new BasicAWSCredentials(cloudflareOptions.AccessKeyId, cloudflareOptions.SecretAccessKey);

      return new AmazonS3Client(credentials, new AmazonS3Config
      {
        ServiceURL = cloudflareOptions.Api,
        ForcePathStyle = true,
      });
    });

    services.AddScoped<IAuthRepository, AuthRepository>();
    services.AddScoped<IAuthEmailService, AuthEmailService>();
    services.AddSingleton<IAuthTokenService, AuthTokenService>();
    services.AddScoped<IPostRepository, PostRepository>();
    services.AddScoped<IPostFileStorageService, CloudflareR2PostFileStorageService>();

    return services;
  }

  private static string NormalizeConnectionString(string rawConnectionString)
  {
    if (!rawConnectionString.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase)
        && !rawConnectionString.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
    {
      return rawConnectionString;
    }

    var databaseUrl = new Uri(rawConnectionString);
    var userInfoParts = databaseUrl.UserInfo.Split(':', 2);
    var builder = new NpgsqlConnectionStringBuilder
    {
      Host = databaseUrl.Host,
      Port = databaseUrl.Port > 0 ? databaseUrl.Port : 5432,
      Database = databaseUrl.AbsolutePath.TrimStart('/'),
      Username = userInfoParts.ElementAtOrDefault(0) ?? string.Empty,
      Password = userInfoParts.ElementAtOrDefault(1) ?? string.Empty,
    };

    foreach (var (key, value) in ParseQueryString(databaseUrl.Query))
    {
      if (string.Equals(key, "sslmode", StringComparison.OrdinalIgnoreCase)
          && Enum.TryParse<SslMode>(value, ignoreCase: true, out var sslMode))
      {
        builder.SslMode = sslMode;
        continue;
      }

      if (string.Equals(key, "channel_binding", StringComparison.OrdinalIgnoreCase)
          && Enum.TryParse<ChannelBinding>(value, ignoreCase: true, out var channelBinding))
      {
        builder.ChannelBinding = channelBinding;
        continue;
      }

      builder[key.Replace('_', ' ')] = value;
    }

    return builder.ConnectionString;
  }

  private static IEnumerable<KeyValuePair<string, string>> ParseQueryString(string queryString)
  {
    if (string.IsNullOrWhiteSpace(queryString))
    {
      yield break;
    }

    var segments = queryString.TrimStart('?')
        .Split('&', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

    foreach (var segment in segments)
    {
      var parts = segment.Split('=', 2);
      var key = Uri.UnescapeDataString(parts[0]);
      var value = parts.Length > 1 ? Uri.UnescapeDataString(parts[1]) : string.Empty;

      if (!string.IsNullOrWhiteSpace(key))
      {
        yield return new KeyValuePair<string, string>(key, value);
      }
    }
  }
}
