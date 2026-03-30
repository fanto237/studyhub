namespace Application.Posts.GetFeed;

public record GetFeedQuery(
    string? Sort,
    int Limit,
    string? Cursor,
    IReadOnlyList<string> Tags,
    Guid CurrentUserId);
