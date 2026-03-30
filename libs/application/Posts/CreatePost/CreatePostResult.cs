namespace Application.Posts.CreatePost;

public record CreatePostResult(
    CreatePostOutcome Outcome,
    string Message,
    Guid? PostId = null,
    Guid? UserId = null,
    string? Title = null,
    string? Description = null,
    string? StorageUrl = null,
    IReadOnlyList<string>? Tags = null,
    DateTimeOffset? CreatedAt = null);
