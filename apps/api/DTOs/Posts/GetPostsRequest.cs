using System;

namespace Api.DTOs.Posts;

public record GetPostsRequest(
    string? Sort,
    int Page,
    int PageSize,
    string? Search,
    string[]? Tags,
    Guid? CurrentUserId = null,
    Guid? AuthorUserId = null);
