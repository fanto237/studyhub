using Application.Posts.GetPosts;

namespace Application.Posts.GetFeed;

public record GetFeedResult(
    GetFeedOutcome Outcome,
    string Message,
    IReadOnlyList<PostFeedItem>? Items = null,
    string? NextCursor = null,
    bool HasMore = false);
