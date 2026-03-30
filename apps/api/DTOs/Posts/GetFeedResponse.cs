namespace Api.DTOs.Posts;

public record GetFeedRequest(
    string? Sort,
    int Limit,
    string? Cursor,
    string[]? Tags = null);

public record GetFeedResponse(
    IReadOnlyList<PostFeedItemResponse> Items,
    string? NextCursor,
    bool HasMore);
