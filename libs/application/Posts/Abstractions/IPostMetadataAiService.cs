namespace Application.Posts.Abstractions;

public interface IPostMetadataAiService
{
  Task<PostMetadataAiResult> GenerateAsync(
      PostMetadataAiRequest request,
      CancellationToken cancellationToken);
}

public sealed record PostMetadataAiRequest(
    string ExtractedText,
    string? Title);

public sealed record PostMetadataAiResult(
    string? Title,
    string? Description,
    IReadOnlyList<string> Tags,
    string? DetectedLanguage,
    double? LanguageConfidence,
    IReadOnlyList<string> Warnings);
