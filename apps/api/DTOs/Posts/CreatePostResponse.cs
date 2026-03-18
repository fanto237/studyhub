namespace Api.DTOs.Posts;

public record CreatePostResponse(
    Guid Id,
    Guid UserId,
    string Title,
    string? Description,
    string StorageUrl,
    IReadOnlyList<string> Tags,
    DateTimeOffset CreatedAt,
    string Message);
