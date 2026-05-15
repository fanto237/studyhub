using System.Security.Claims;
using Api.DTOs.Comments;
using Api.Responses;
using Application.Comments.CreateComment;
using Application.Comments.DeleteComment;
using Application.Comments.GetPostComments;
using Application.Comments.UpdateComment;
using Domain.Enums;
using Microsoft.AspNetCore.Mvc;
using Wolverine;

namespace Api.Endpoints;

public static class CommentEndpoints
{
  public static WebApplication MapCommentEndpoints(this WebApplication app)
  {
    var commentsGroup = app.MapGroup("/api/comments")
        .WithTags("Comments")
        .RequireAuthorization();

    commentsGroup.MapPatch("/{commentId:guid}", UpdateComment)
        .WithName("UpdateComment")
        .WithDescription("Updates the text of an existing StudyHub comment.");

    commentsGroup.MapDelete("/{commentId:guid}", DeleteComment)
        .WithName("DeleteComment")
        .WithDescription("Soft-deletes a StudyHub comment while preserving its replies.");

    var postsGroup = app.MapGroup("/api/posts")
        .WithTags("Comments")
        .RequireAuthorization();

    postsGroup.MapGet("/{postId:guid}/comments", GetPostComments)
        .WithName("GetPostComments")
        .WithDescription("Returns the discussion thread for a StudyHub post.");

    postsGroup.MapPost("/{postId:guid}/comments", CreateComment)
        .WithName("CreateComment")
        .WithDescription("Creates a top-level comment or threaded reply on a StudyHub post.");

    return app;
  }

  private static async Task<IResult> GetPostComments(
      Guid postId,
      IMessageBus bus,
      CancellationToken cancellationToken)
  {
    var result = await bus.InvokeAsync<GetPostCommentsResult>(
        new GetPostCommentsQuery(postId),
        cancellationToken);

    return result.Outcome switch
    {
      GetPostCommentsOutcome.Success => Results.Ok(SendResponse.Success(MapGetPostCommentsResponse(result.Items ?? []))),
      GetPostCommentsOutcome.NotFound => Results.NotFound(SendResponse.Fail(new { message = result.Message })),
      _ => Results.BadRequest(SendResponse.Fail(new { message = result.Message })),
    };
  }

  private static async Task<IResult> CreateComment(
      Guid postId,
      [FromBody] CreateCommentRequest request,
      ClaimsPrincipal user,
      IMessageBus bus,
      CancellationToken cancellationToken)
  {
    if (request is null)
    {
      return Results.BadRequest(SendResponse.Fail(new { message = "A comment body is required." }));
    }

    var userIdValue = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (!Guid.TryParse(userIdValue, out var userId))
    {
      return Results.Json(SendResponse.Fail(new { message = "Authentication is required." }), statusCode: StatusCodes.Status401Unauthorized);
    }

    var result = await bus.InvokeAsync<CreateCommentResult>(
        new CreateCommentCommand(postId, userId, request.Text, request.ParentCommentId),
        cancellationToken);

    return result.Outcome switch
    {
      CreateCommentOutcome.Success => Results.Created(
          $"/api/posts/{postId}/comments/{result.Item!.Id}",
          SendResponse.Success(MapCreateCommentResponse(result.Item!))),
      CreateCommentOutcome.NotFound => Results.NotFound(SendResponse.Fail(new { message = result.Message })),
      _ => Results.BadRequest(SendResponse.Fail(new { message = result.Message })),
    };
  }

  private static async Task<IResult> UpdateComment(
      Guid commentId,
      [FromBody] UpdateCommentRequest request,
      ClaimsPrincipal user,
      IMessageBus bus,
      CancellationToken cancellationToken)
  {
    if (request is null)
    {
      return Results.BadRequest(SendResponse.Fail(new { message = "A comment body is required." }));
    }

    var userIdValue = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (!Guid.TryParse(userIdValue, out var userId))
    {
      return Results.Json(SendResponse.Fail(new { message = "Authentication is required." }), statusCode: StatusCodes.Status401Unauthorized);
    }

    var roleValue = user.FindFirstValue(ClaimTypes.Role);
    if (!Enum.TryParse<UserRole>(roleValue, ignoreCase: true, out var role))
    {
      return Results.Json(SendResponse.Fail(new { message = "You do not have permission to access this resource." }), statusCode: StatusCodes.Status403Forbidden);
    }

    var result = await bus.InvokeAsync<UpdateCommentResult>(
        new UpdateCommentCommand(commentId, userId, role, request.Text),
        cancellationToken);

    return result.Outcome switch
    {
      UpdateCommentOutcome.Success => Results.Ok(SendResponse.Success(MapUpdateCommentResponse(result.Item!))),
      UpdateCommentOutcome.NotFound => Results.NotFound(SendResponse.Fail(new { message = result.Message })),
      UpdateCommentOutcome.Forbidden => Results.Json(SendResponse.Fail(new { message = result.Message }), statusCode: StatusCodes.Status403Forbidden),
      _ => Results.BadRequest(SendResponse.Fail(new { message = result.Message })),
    };
  }

  private static async Task<IResult> DeleteComment(
      Guid commentId,
      ClaimsPrincipal user,
      IMessageBus bus,
      CancellationToken cancellationToken)
  {
    var userIdValue = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (!Guid.TryParse(userIdValue, out var userId))
    {
      return Results.Json(SendResponse.Fail(new { message = "Authentication is required." }), statusCode: StatusCodes.Status401Unauthorized);
    }

    var roleValue = user.FindFirstValue(ClaimTypes.Role);
    if (!Enum.TryParse<UserRole>(roleValue, ignoreCase: true, out var role))
    {
      return Results.Json(SendResponse.Fail(new { message = "You do not have permission to access this resource." }), statusCode: StatusCodes.Status403Forbidden);
    }

    var result = await bus.InvokeAsync<DeleteCommentResult>(
        new DeleteCommentCommand(commentId, userId, role),
        cancellationToken);

    return result.Outcome switch
    {
      DeleteCommentOutcome.Success => Results.NoContent(),
      DeleteCommentOutcome.NotFound => Results.NotFound(SendResponse.Fail(new { message = result.Message })),
      DeleteCommentOutcome.Forbidden => Results.Json(SendResponse.Fail(new { message = result.Message }), statusCode: StatusCodes.Status403Forbidden),
      _ => Results.BadRequest(SendResponse.Fail(new { message = result.Message })),
    };
  }

  private static GetPostCommentsResponse MapGetPostCommentsResponse(IReadOnlyList<GetPostCommentItem> items)
  {
    return new GetPostCommentsResponse(
        items
            .Select(item => new GetPostCommentResponse(
                item.Id,
                item.ParentCommentId,
                item.Text,
                item.CreatedAt,
                new GetPostCommentUserResponse(
                    item.User.Id,
                    item.User.Username,
                    item.User.FullName)))
            .ToArray());
  }

  private static CreateCommentResponse MapCreateCommentResponse(CreateCommentItem item)
  {
    return new CreateCommentResponse(
        item.Id,
        item.PostId,
        item.ParentCommentId,
        item.Text,
        item.CreatedAt,
        new CreateCommentUserResponse(
            item.User.Id,
            item.User.Username,
            item.User.FullName));
  }

  private static UpdateCommentResponse MapUpdateCommentResponse(UpdateCommentItem item)
  {
    return new UpdateCommentResponse(
        item.Id,
        item.PostId,
        item.ParentCommentId,
        item.Text,
        item.CreatedAt,
        new UpdateCommentUserResponse(
            item.User.Id,
            item.User.Username,
            item.User.FullName));
  }
}
