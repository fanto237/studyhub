using System.Security.Claims;
using Api.DTOs.Posts;
using Application.Posts.CreatePost;
using Application.Posts.GetPost;
using Application.Posts.GetPosts;
using Microsoft.AspNetCore.Mvc;
using Wolverine;

namespace Api.Endpoints;

public static class PostEndpoints
{
  public static WebApplication MapPostEndpoints(this WebApplication app)
  {
    var group = app.MapGroup("/api/posts")
        .WithTags("Posts");

    group.MapGet(string.Empty, GetPosts)
        .WithName("GetPosts")
        .WithDescription("Returns the authenticated StudyHub post feed.")
        .RequireAuthorization();

    group.MapGet("/{postId:guid}", GetPost)
        .WithName("GetPost")
        .WithDescription("Returns a single authenticated StudyHub post with its discussion thread.")
        .RequireAuthorization();

    group.MapPost(string.Empty, CreatePost)
        .WithName("CreatePost")
        .WithDescription("Uploads a PDF to Cloudflare R2 and creates a StudyHub post.")
        .RequireAuthorization()
        .DisableAntiforgery();

    return app;
  }

  private static async Task<IResult> GetPosts(
      [AsParameters] GetPostsQuery query,
      IMessageBus bus,
      CancellationToken cancellationToken)
  {
    var result = await bus.InvokeAsync<GetPostsResult>(
        query,
        cancellationToken);

    return result.Outcome switch
    {
      GetPostsOutcome.Success => Results.Ok(new GetPostsResponse(
          (result.Items ?? [])
              .Select(item => new PostFeedItemResponse(
                  item.Id,
                  item.Title,
                  item.Description,
                  item.StorageUrl,
                  item.Upvotes,
                  item.Downvotes,
                  item.Score,
                  item.CreatedAt,
                  item.CommentCount,
                  item.Tags,
                  new PostFeedUserResponse(
                      item.User.Id,
                      item.User.Username,
                      item.User.FullName)))
              .ToArray(),
          result.Page,
          result.PageSize,
          result.TotalCount,
          result.TotalPages)),
      _ => Results.BadRequest(new { message = result.Message }),
    };
  }

  private static async Task<IResult> GetPost(
      Guid postId,
      IMessageBus bus,
      CancellationToken cancellationToken)
  {
    var result = await bus.InvokeAsync<GetPostResult>(
        new GetPostQuery(postId),
        cancellationToken);

    return result.Outcome switch
    {
      GetPostOutcome.Success => Results.Ok(new GetPostResponse(
          result.Item!.Id,
          result.Item.Title,
          result.Item.Description,
          result.Item.StorageUrl,
          result.Item.Upvotes,
          result.Item.Downvotes,
          result.Item.Score,
          result.Item.CreatedAt,
          result.Item.CommentCount,
          result.Item.Tags,
          new GetPostUserResponse(
              result.Item.User.Id,
              result.Item.User.Username,
              result.Item.User.FullName),
          result.Item.Comments
              .Select(comment => new GetPostCommentResponse(
                  comment.Id,
                  comment.ParentCommentId,
                  comment.Text,
                  comment.CreatedAt,
                  new GetPostUserResponse(
                      comment.User.Id,
                      comment.User.Username,
                      comment.User.FullName)))
              .ToArray())),
      GetPostOutcome.NotFound => Results.NotFound(new { message = result.Message }),
      _ => Results.BadRequest(new { message = result.Message }),
    };
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
