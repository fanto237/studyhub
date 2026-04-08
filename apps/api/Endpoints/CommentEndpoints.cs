using System.Security.Claims;
using Api.DTOs.Comments;
using Application.Comments.CreateComment;
using Application.Comments.DeleteComment;
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

    commentsGroup.MapDelete("/{commentId:guid}", DeleteComment)
        .WithName("DeleteComment")
        .WithDescription("Soft-deletes a StudyHub comment while preserving its replies.");

    var postsGroup = app.MapGroup("/api/posts")
        .WithTags("Comments")
        .RequireAuthorization();

    postsGroup.MapPost("/{postId:guid}/comments", CreateComment)
        .WithName("CreateComment")
        .WithDescription("Creates a top-level comment or threaded reply on a StudyHub post.");

    return app;
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
      return Results.BadRequest(new { message = "A comment body is required." });
    }

    var userIdValue = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (!Guid.TryParse(userIdValue, out var userId))
    {
      return Results.Unauthorized();
    }

    var result = await bus.InvokeAsync<CreateCommentResult>(
        new CreateCommentCommand(postId, userId, request.Text, request.ParentCommentId),
        cancellationToken);

    return result.Outcome switch
    {
      CreateCommentOutcome.Success => Results.Created(
          $"/api/posts/{postId}/comments/{result.Item!.Id}",
          MapCreateCommentResponse(result.Item!)),
      CreateCommentOutcome.NotFound => Results.NotFound(new { message = result.Message }),
      _ => Results.BadRequest(new { message = result.Message }),
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
      return Results.Unauthorized();
    }

    var roleValue = user.FindFirstValue(ClaimTypes.Role);
    if (!Enum.TryParse<UserRole>(roleValue, ignoreCase: true, out var role))
    {
      return Results.Forbid();
    }

    var result = await bus.InvokeAsync<DeleteCommentResult>(
        new DeleteCommentCommand(commentId, userId, role),
        cancellationToken);

    return result.Outcome switch
    {
      DeleteCommentOutcome.Success => Results.NoContent(),
      DeleteCommentOutcome.NotFound => Results.NotFound(new { message = result.Message }),
      DeleteCommentOutcome.Forbidden => Results.Forbid(),
      _ => Results.BadRequest(new { message = result.Message }),
    };
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
}
