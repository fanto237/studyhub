using System.Security.Claims;
using Api.DTOs.Posts;
using Application.Posts.CreatePost;
using Microsoft.AspNetCore.Mvc;
using Wolverine;

namespace Api.Extensions;

public static class PostEndpoints
{
  public static WebApplication MapPostEndpoints(this WebApplication app)
  {
    var group = app.MapGroup("/api/posts")
        .WithTags("Posts");

    group.MapPost(string.Empty, CreatePost)
        .WithName("CreatePost")
        .WithDescription("Uploads a PDF to Cloudflare R2 and creates a StudyHub post.")
        .RequireAuthorization()
        .DisableAntiforgery();

    return app;
  }

  private static async Task<IResult> CreatePost(
      [FromForm] CreatePostRequest request,
      ClaimsPrincipal user,
      IMessageBus bus,
      CancellationToken cancellationToken)
  {
    var userIdValue = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (!Guid.TryParse(userIdValue, out var userId))
    {
      return Results.Unauthorized();
    }

    if (request.File is null)
    {
      return Results.BadRequest(new { message = "A PDF file is required." });
    }

    if (request.File.Length == 0)
    {
      return Results.BadRequest(new { message = "The uploaded PDF file cannot be empty." });
    }

    if (request.File.Length > CreatePostCommandValidator.MaxFileSizeBytes)
    {
      return Results.Json(
          new { message = $"PDF files must be {CreatePostCommandValidator.MaxFileSizeBytes / (1024 * 1024)} MB or smaller." },
          statusCode: StatusCodes.Status413PayloadTooLarge);
    }

    await using var fileStream = request.File.OpenReadStream();
    await using var memoryStream = new MemoryStream((int)request.File.Length);
    await fileStream.CopyToAsync(memoryStream, cancellationToken);

    var command = new CreatePostCommand(
        userId,
        request.Title,
        request.Description,
        request.Tags,
        request.File.FileName,
        string.IsNullOrWhiteSpace(request.File.ContentType) ? "application/pdf" : request.File.ContentType,
        memoryStream.ToArray());

    var result = await bus.InvokeAsync<CreatePostResult>(command, cancellationToken);

    return result.Outcome switch
    {
      CreatePostOutcome.Success => Results.Created($"/api/posts/{result.PostId}", new CreatePostResponse(
          result.PostId!.Value,
          result.UserId!.Value,
          result.Title!,
          result.Description,
          result.StorageUrl!,
          result.Tags ?? [],
          result.CreatedAt!.Value,
          result.Message)),
      CreatePostOutcome.PayloadTooLarge => Results.Json(new { message = result.Message }, statusCode: StatusCodes.Status413PayloadTooLarge),
      CreatePostOutcome.InvalidFile => Results.BadRequest(new { message = result.Message }),
      _ => Results.BadRequest(new { message = result.Message }),
    };
  }
}
