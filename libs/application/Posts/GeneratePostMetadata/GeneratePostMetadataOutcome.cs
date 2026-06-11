namespace Application.Posts.GeneratePostMetadata;

public enum GeneratePostMetadataOutcome
{
  Success,
  InvalidRequest,
  PayloadTooLarge,
  InvalidFile,
  InsufficientText,
  ProviderUnavailable,
}
