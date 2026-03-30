using Microsoft.AspNetCore.Http;

namespace Api.DTOs.Posts;

public sealed class CreatePostRequest
{
    public IFormFile? File { get; init; }
    public string Title { get; init; } = string.Empty;
    public string? Description { get; init; }
    public List<string> Tags { get; init; } = [];
}
