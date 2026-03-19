namespace Application.Posts.GetPost;

public record GetPostResult(
    GetPostOutcome Outcome,
    string Message,
    PostDetail? Item = null);

public record PostDetail(
    Guid Id,
    string Title,
    string? Description,
    string StorageUrl,
    int Upvotes,
    int Downvotes,
    int Score,
    DateTimeOffset CreatedAt,
    int CommentCount,
    IReadOnlyList<string> Tags,
    PostDetailUser User,
    IReadOnlyList<PostDetailComment> Comments);

public record PostDetailUser(
    Guid Id,
    string Username,
    string FullName);

public record PostDetailComment(
    Guid Id,
    Guid? ParentCommentId,
    string Text,
    DateTimeOffset CreatedAt,
    PostDetailUser User);
