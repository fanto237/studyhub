using System.Security.Claims;
using Api.DTOs.Posts;
using Application.Posts.GetPosts;
using Domain.Enums;
using Microsoft.AspNetCore.Mvc;
using Wolverine;

namespace Api.Endpoints;

public static class UserEndpoints
{
  public static WebApplication MapUserEndpoints(this WebApplication app)
  {
    var group = app.MapGroup("/api/users")
        .WithTags("Users");

    group.MapGet("/{userId:guid}/posts", GetUserPosts)
        .WithName("GetUserPosts")
        .WithDescription("Returns the visible StudyHub posts authored by the specified user.")
        .RequireAuthorization();

    return app;
  }

  private static async Task<IResult> GetUserPosts(
      Guid userId,
      [AsParameters] GetPostsQuery query,
      ClaimsPrincipal user,
      IMessageBus bus,
      CancellationToken cancellationToken)
  {
    var requesterUserIdValue = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (!Guid.TryParse(requesterUserIdValue, out var requesterUserId))
    {
      return Results.Unauthorized();
    }

    var result = await bus.InvokeAsync<GetPostsResult>(
        new GetPostsQuery(query.Sort, query.Page, query.PageSize, query.Search, query.Tag, requesterUserId, userId),
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
