namespace Application.Posts.CreatePost;

public record CreatePostCommand(
    Guid UserId,
    string Title,
    string? Description,
    IReadOnlyList<string> Tags,
    string OriginalFileName,
    string ContentType,
    byte[] FileBytes);
