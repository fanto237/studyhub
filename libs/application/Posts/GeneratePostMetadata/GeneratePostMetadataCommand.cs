namespace Application.Posts.GeneratePostMetadata;

public record GeneratePostMetadataCommand(
    Guid UserId,
    string? Title,
    string OriginalFileName,
    string ContentType,
    byte[] FileBytes);
