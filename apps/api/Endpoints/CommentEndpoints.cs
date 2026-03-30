using System.Security.Claims;
using Application.Comments.DeleteComment;
using Domain.Enums;
using Wolverine;

namespace Api.Endpoints;

public static class CommentEndpoints
{
    public static WebApplication MapCommentEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/comments")
            .WithTags("Comments")
            .RequireAuthorization();

        group.MapDelete("/{commentId:guid}", DeleteComment)
            .WithName("DeleteComment")
            .WithDescription("Soft-deletes a StudyHub comment while preserving its replies.");

        return app;
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
}
