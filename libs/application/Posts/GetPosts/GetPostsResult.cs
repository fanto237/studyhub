using Domain.Enums;

namespace Application.Posts.GetPosts;

public record GetPostsResult(
    GetPostsOutcome Outcome,
    string Message,
    IReadOnlyList<PostFeedItem>? Items = null,
    int Page = 1,
    int PageSize = 20,
    int TotalCount = 0,
    int TotalPages = 0);

public record PostFeedItem(
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
    PostFeedUser User,
    PostVoteValue? CurrentVote);

public record PostFeedUser(
    Guid Id,
    string Username,
    string FullName);
