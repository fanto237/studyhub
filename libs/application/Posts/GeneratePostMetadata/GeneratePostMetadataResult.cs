namespace Application.Posts.GeneratePostMetadata;

public sealed record GeneratePostMetadataResult(
    GeneratePostMetadataOutcome Outcome,
    string Message,
    string? Title = null,
    string? Description = null,
    IReadOnlyList<string>? Tags = null,
    string? DetectedLanguage = null,
    double? LanguageConfidence = null,
    IReadOnlyList<string>? Warnings = null);
