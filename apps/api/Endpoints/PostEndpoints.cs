using System.Security.Claims;
using Api.DTOs.Posts;
using Application.Posts.CreatePost;
using Application.Posts.DeletePost;
using Application.Posts.DownloadPost;
using Application.Posts.GetPost;
using Application.Posts.GetPosts;
using Application.Posts.ReportPost;
using Application.Posts.UpdatePost;
using Application.Posts.VotePost;
using Domain.Enums;
using Microsoft.AspNetCore.Mvc;
using Wolverine;

namespace Api.Endpoints;

public static class PostEndpoints
{
  public static WebApplication MapPostEndpoints(this WebApplication app)
  {
    var group = app.MapGroup("/api/posts")
        .WithTags("Posts")
        .RequireAuthorization();

    group.MapGet(string.Empty, GetPosts)
        .WithName("GetPosts")
        .WithDescription("Returns the authenticated StudyHub post feed.");

    group.MapGet("/me", GetMyPosts)
        .WithName("GetMyPosts")
        .WithDescription("Returns the authenticated user's visible StudyHub posts.");

    group.MapGet("/{postId:guid}", GetPost)
        .WithName("GetPost")
        .WithDescription("Returns a single authenticated StudyHub post with its discussion thread.");

    group.MapPatch("/{postId:guid}", UpdatePost)
        .WithName("UpdatePost")
        .WithDescription("Edits a StudyHub post's metadata.");

    group.MapDelete("/{postId:guid}", DeletePost)
        .WithName("DeletePost")
        .WithDescription("Soft-deletes a StudyHub post.");

    group.MapPost("/{postId:guid}/vote", VotePost)
        .WithName("VotePost")
        .WithDescription("Upvotes, downvotes, or removes the authenticated user's vote on a StudyHub post.");

    group.MapPost("/{postId:guid}/report", ReportPost)
        .WithName("ReportPost")
        .WithDescription("Reports a StudyHub post for moderation review or automatic hiding.");

    group.MapPost("/{postId:guid}/download", DownloadPost)
        .WithName("DownloadPost")
        .WithDescription("Returns a downloadable PDF URL for a visible StudyHub post.");

    group.MapPost(string.Empty, CreatePost)
        .WithName("CreatePost")
        .WithDescription("Uploads a PDF to Cloudflare R2 and creates a StudyHub post.")
        .DisableAntiforgery();

    return app;
  }

  private static async Task<IResult> GetPosts(
      [AsParameters] GetPostsRequest query,
      ClaimsPrincipal user,
      IMessageBus bus,
      CancellationToken cancellationToken)
  {
    var userIdValue = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (!Guid.TryParse(userIdValue, out var userId))
    {
      return Results.Unauthorized();
    }

    var result = await bus.InvokeAsync<GetPostsResult>(
        new GetPostsQuery(query.Sort, query.Page, query.PageSize, query.Search, query.Tags ?? [], userId),
        cancellationToken);

    return MapGetPostsResult(result);
  }

  private static async Task<IResult> GetMyPosts(
      [AsParameters] GetPostsRequest query,
      ClaimsPrincipal user,
      IMessageBus bus,
      CancellationToken cancellationToken)
  {
    var userIdValue = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (!Guid.TryParse(userIdValue, out var userId))
    {
      return Results.Unauthorized();
    }

    var result = await bus.InvokeAsync<GetPostsResult>(
        new GetPostsQuery(query.Sort, query.Page, query.PageSize, query.Search, query.Tags ?? [], userId, userId),
        cancellationToken);

    return MapGetPostsResult(result);
  }

  private static async Task<IResult> GetPost(
      Guid postId,
      ClaimsPrincipal user,
      IMessageBus bus,
      CancellationToken cancellationToken)
  {
    var userIdValue = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (!Guid.TryParse(userIdValue, out var userId))
    {
      return Results.Unauthorized();
    }

    var result = await bus.InvokeAsync<GetPostResult>(
        new GetPostQuery(postId, userId),
        cancellationToken);

    return result.Outcome switch
    {
      GetPostOutcome.Success => Results.Ok(MapGetPostResponse(result.Item!)),
      GetPostOutcome.NotFound => Results.NotFound(new { message = result.Message }),
      _ => Results.BadRequest(new { message = result.Message }),
    };
  }

  private static async Task<IResult> DownloadPost(
      Guid postId,
      ClaimsPrincipal user,
      IMessageBus bus,
      CancellationToken cancellationToken)
  {
    var userIdValue = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (!Guid.TryParse(userIdValue, out var userId))
    {
      return Results.Unauthorized();
    }

    var result = await bus.InvokeAsync<DownloadPostResult>(
        new DownloadPostCommand(postId, userId),
        cancellationToken);

    return result.Outcome switch
    {
      DownloadPostOutcome.Success => Results.Ok(new DownloadPostResponse(
          result.PostId!.Value,
          result.DownloadUrl!,
          result.FileName,
          result.Message)),
      DownloadPostOutcome.NotFound => Results.NotFound(new { message = result.Message }),
      _ => Results.BadRequest(new { message = result.Message }),
    };
  }

  private static async Task<IResult> UpdatePost(
      Guid postId,
      UpdatePostRequest request,
      ClaimsPrincipal user,
      IMessageBus bus,
      CancellationToken cancellationToken)
  {
    var userIdValue = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (!Guid.TryParse(userIdValue, out var userId))
    {
      return Results.Unauthorized();
    }

    var roleValue = user.FindFirstValue(ClaimTypes.Role);
    if (!Enum.TryParse<UserRole>(roleValue, ignoreCase: true, out var role))
    {
      return Results.Forbid();
    }

    var command = new UpdatePostCommand(
        postId,
        userId,
        role,
        request.Title,
        request.Description,
        request.Tags ?? []);

    var result = await bus.InvokeAsync<UpdatePostResult>(command, cancellationToken);

    return result.Outcome switch
    {
      UpdatePostOutcome.Success => Results.Ok(MapGetPostResponse(result.Item!)),
      UpdatePostOutcome.NotFound => Results.NotFound(new { message = result.Message }),
      UpdatePostOutcome.Forbidden => Results.Forbid(),
      _ => Results.BadRequest(new { message = result.Message }),
    };
  }

  private static async Task<IResult> DeletePost(
      Guid postId,
      ClaimsPrincipal user,
      IMessageBus bus,
      CancellationToken cancellationToken)
  {
    var userIdValue = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (!Guid.TryParse(userIdValue, out var userId))
    {
      return Results.Unauthorized();
    }

    var roleValue = user.FindFirstValue(ClaimTypes.Role);
    if (!Enum.TryParse<UserRole>(roleValue, ignoreCase: true, out var role))
    {
      return Results.Forbid();
    }

    var result = await bus.InvokeAsync<DeletePostResult>(
        new DeletePostCommand(postId, userId, role),
        cancellationToken);

    return result.Outcome switch
    {
      DeletePostOutcome.Success => Results.NoContent(),
      DeletePostOutcome.NotFound => Results.NotFound(new { message = result.Message }),
      DeletePostOutcome.Forbidden => Results.Forbid(),
      _ => Results.BadRequest(new { message = result.Message }),
    };
  }

  private static async Task<IResult> VotePost(
      Guid postId,
      VotePostRequest request,
      ClaimsPrincipal user,
      IMessageBus bus,
      CancellationToken cancellationToken)
  {
    var userIdValue = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (!Guid.TryParse(userIdValue, out var userId))
    {
      return Results.Unauthorized();
    }

    var result = await bus.InvokeAsync<VotePostResult>(
        new VotePostCommand(postId, userId, request.Vote),
        cancellationToken);

    return result.Outcome switch
    {
      VotePostOutcome.Success => Results.Ok(new VotePostResponse(
          result.PostId!.Value,
          result.Upvotes,
          result.Downvotes,
          result.Score,
          result.CurrentVote,
          result.Message)),
      VotePostOutcome.NotFound => Results.NotFound(new { message = result.Message }),
      _ => Results.BadRequest(new { message = result.Message }),
    };
  }

  private static async Task<IResult> ReportPost(
      Guid postId,
      ReportPostRequest request,
      ClaimsPrincipal user,
      IMessageBus bus,
      CancellationToken cancellationToken)
  {
    var userIdValue = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (!Guid.TryParse(userIdValue, out var userId))
    {
      return Results.Unauthorized();
    }

    var roleValue = user.FindFirstValue(ClaimTypes.Role);
    if (!Enum.TryParse<UserRole>(roleValue, ignoreCase: true, out var role))
    {
      return Results.Forbid();
    }

    var result = await bus.InvokeAsync<ReportPostResult>(
        new ReportPostCommand(postId, userId, role, request.Reason, request.Details),
        cancellationToken);

    return result.Outcome switch
    {
      ReportPostOutcome.Success => Results.Ok(new ReportPostResponse(
          result.PostId!.Value,
          result.ReportCount,
          result.IsHidden,
          result.Message)),
      ReportPostOutcome.NotFound => Results.NotFound(new { message = result.Message }),
      ReportPostOutcome.AlreadyReported => Results.Conflict(new { message = result.Message }),
      ReportPostOutcome.Forbidden => Results.Json(new { message = result.Message }, statusCode: StatusCodes.Status403Forbidden),
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

  private static IResult MapGetPostsResult(GetPostsResult result)
  {
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
                      item.User.FullName),
                  MapVote(item.CurrentVote)))
              .ToArray(),
          result.Page,
          result.PageSize,
          result.TotalCount,
          result.TotalPages)),
      _ => Results.BadRequest(new { message = result.Message }),
    };
  }

  private static GetPostResponse MapGetPostResponse(PostDetail item)
  {
    return new GetPostResponse(
        item.Id,
        item.Title,
        item.Description,
        item.StorageUrl,
        item.Upvotes,
        item.Downvotes,
        item.Score,
        item.CreatedAt,
        item.UpdatedAt,
        item.CommentCount,
        item.Tags,
        new GetPostUserResponse(
            item.User.Id,
            item.User.Username,
            item.User.FullName),
        item.Comments
            .Select(comment => new GetPostCommentResponse(
                comment.Id,
                comment.ParentCommentId,
                comment.Text,
                comment.CreatedAt,
                new GetPostUserResponse(
                    comment.User.Id,
                    comment.User.Username,
                    comment.User.FullName)))
            .ToArray(),
        MapVote(item.CurrentVote));
  }

  private static string? MapVote(PostVoteValue? vote)
  {
    return vote switch
    {
      PostVoteValue.Upvote => "up",
      PostVoteValue.Downvote => "down",
      _ => null,
    };
  }
}
