namespace Api.DTOs.Posts;

public sealed record GeneratePostMetadataResponse(
    string? Title,
    string? Description,
    IReadOnlyList<string> Tags,
    string? DetectedLanguage,
    double? LanguageConfidence,
    IReadOnlyList<string> Warnings,
    string Message);
