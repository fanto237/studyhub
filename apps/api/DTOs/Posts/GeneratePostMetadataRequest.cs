using Microsoft.AspNetCore.Http;

namespace Api.DTOs.Posts;

public sealed class GeneratePostMetadataRequest
{
  public IFormFile? File { get; init; }
  public string? Title { get; init; }
}
