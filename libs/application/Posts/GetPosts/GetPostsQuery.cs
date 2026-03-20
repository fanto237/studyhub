namespace Application.Posts.GetPosts;

public record GetPostsQuery(
    string? Sort,
    int Page,
    int PageSize,
    string? Search,
    string? Tag,
    Guid? CurrentUserId = null,
    Guid? AuthorUserId = null);
