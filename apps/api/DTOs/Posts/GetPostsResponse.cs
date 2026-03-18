namespace Api.DTOs.Posts;

public record GetPostsResponse(
    IReadOnlyList<PostFeedItemResponse> Items,
    int Page,
    int PageSize,
    int TotalCount,
    int TotalPages);

public record PostFeedItemResponse(
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
    PostFeedUserResponse User);

public record PostFeedUserResponse(
    Guid Id,
    string Username,
    string FullName);
