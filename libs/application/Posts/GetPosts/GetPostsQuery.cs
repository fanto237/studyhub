namespace Application.Posts.GetPosts;

public record GetPostsQuery(
    string? Sort,
    int Page,
    int PageSize,
    string? Search,
    IReadOnlyList<string> Tags,
    Guid? CurrentUserId = null,
    Guid? AuthorUserId = null);
