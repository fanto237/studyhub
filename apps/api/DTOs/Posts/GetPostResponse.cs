namespace Api.DTOs.Posts;

public record GetPostResponse(
    Guid Id,
    string Title,
    string? Description,
    string StorageUrl,
    int Upvotes,
    int Downvotes,
    int Score,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt,
    int CommentCount,
    IReadOnlyList<string> Tags,
    GetPostUserResponse User,
    IReadOnlyList<GetPostCommentResponse> Comments);

public record GetPostUserResponse(
    Guid Id,
    string Username,
    string FullName);

public record GetPostCommentResponse(
    Guid Id,
    Guid? ParentCommentId,
    string Text,
    DateTimeOffset CreatedAt,
    GetPostUserResponse User);
