using System.Security.Claims;
using Api.DTOs.Posts;
using Api.Responses;
using Application.Posts.GetFeed;
using Domain.Enums;
using Microsoft.AspNetCore.Mvc;
using Wolverine;

namespace Api.Endpoints;

public static class FeedEndpoints
{
    public static WebApplication MapFeedEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/feed")
            .WithTags("Feed")
            .RequireAuthorization();

        group.MapGet(string.Empty, GetFeed)
            .WithName("GetFeed")
            .WithDescription("Returns the authenticated StudyHub feed using cursor pagination.");

        return app;
    }

    private static async Task<IResult> GetFeed(
        [AsParameters] GetFeedRequest request,
        ClaimsPrincipal user,
        IMessageBus bus,
        CancellationToken cancellationToken)
    {
        var userIdValue = user.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdValue, out var userId))
        {
            return Results.Json(SendResponse.Fail(new { message = "Authentication is required." }), statusCode: StatusCodes.Status401Unauthorized);
        }

        var result = await bus.InvokeAsync<GetFeedResult>(
            new GetFeedQuery(request.Sort, request.Limit, request.Cursor, request.Tags ?? [], userId),
            cancellationToken);

        return result.Outcome switch
        {
            GetFeedOutcome.Success => Results.Ok(SendResponse.Success(new GetFeedResponse(
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
                result.NextCursor,
                result.HasMore))),
            _ => Results.BadRequest(SendResponse.Fail(new { message = result.Message })),
        };
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
