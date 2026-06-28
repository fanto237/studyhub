namespace Infrastructure.Options;

public class CloudflareOptions
{
  public const string SectionName = "Cloudflare";

  public string Api { get; init; } = string.Empty;
  public string AccessKeyId { get; init; } = string.Empty;
  public string SecretAccessKey { get; init; } = string.Empty;
  public string BucketName { get; init; } = string.Empty;
  public string Prefix { get; init; } = string.Empty;
  public required string PublicBaseUrl { get; init; }
}
