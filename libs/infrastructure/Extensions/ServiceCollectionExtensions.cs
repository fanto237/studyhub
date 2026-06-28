using Amazon.Runtime;
using Amazon.S3;
using Application.Abstractions.Email;
using Application.Auth.Abstractions;
using Application.Comments.Abstractions;
using Application.Posts.Abstractions;
using Infrastructure.Ai;
using Infrastructure.Auth;
using Infrastructure.Comments;
using Infrastructure.Email;
using Infrastructure.Options;
using Infrastructure.Pdf;
using Infrastructure.Persistence;
using Infrastructure.Posts;
using Infrastructure.Storage;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Infrastructure.Extensions;

public static class ServiceCollectionExtensions
{
  public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
  {
    var connectionString = configuration["ConnectionString:Default"]
        ?? configuration.GetConnectionString("Default")
        ?? throw new InvalidOperationException(
            "Database connection string was not found. Configure 'ConnectionString:Default' in user secrets.");

    services.Configure<EmailSetting>(configuration.GetSection(EmailSetting.SectionName));
    services.Configure<GroqOptions>(configuration.GetSection(GroqOptions.SectionName));

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
    services.AddSingleton<ITotpSecretProtector, TotpSecretProtector>();
    services.AddSingleton<ITotpService, TotpService>();
    services.AddScoped<ICommentRepository, CommentRepository>();
    services.AddScoped<IPostRepository, PostRepository>();
    services.AddScoped<IAiMetadataGenerationQuotaService, AiMetadataGenerationQuotaService>();
    services.AddScoped<IPostFileStorageService, CloudflareR2PostFileStorageService>();
    services.AddScoped<IPdfTextExtractionService, PdfPigTextExtractionService>();
    services.AddHttpClient<IPostMetadataAiService, GroqPostMetadataAiService>((serviceProvider, httpClient) =>
    {
      var groqOptions = serviceProvider.GetRequiredService<IOptions<GroqOptions>>().Value;
      httpClient.Timeout = TimeSpan.FromSeconds(Math.Max(groqOptions.TimeoutSeconds, 1));
    });

    return services;
  }
}
