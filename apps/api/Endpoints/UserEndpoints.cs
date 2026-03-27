using System.Security.Claims;
using Api.Auth;
using Api.DTOs.Posts;
using Api.DTOs.Users;
using Application.Posts.GetPosts;
using Application.Users.DeleteUser;
using Application.Users.GetCurrentUser;
using Application.Users.GetPublicUserProfile;
using Domain.Enums;
using Microsoft.AspNetCore.Mvc;
using Wolverine;

namespace Api.Endpoints;

public static class UserEndpoints
{
  public static WebApplication MapUserEndpoints(this WebApplication app)
  {
    var group = app.MapGroup("/api/users")
        .WithTags("Users")
        .RequireAuthorization();

    group.MapGet("/me", GetCurrentUser)
        .WithName("GetCurrentUser")
        .WithDescription("Returns the authenticated StudyHub user's account profile.");

    group.MapGet("/{userId:guid}", GetPublicUserProfile)
        .WithName("GetPublicUserProfile")
        .WithDescription("Returns the public StudyHub profile for the specified user.");

    group.MapGet("/{userId:guid}/posts", GetUserPosts)
        .WithName("GetUserPosts")
        .WithDescription("Returns the visible StudyHub posts authored by the specified user.");

    group.MapDelete("/{userId:guid}", DeleteUser)
        .WithName("DeleteUser")
        .WithDescription("Anonymizes the authenticated StudyHub user account and signs the session out.");

    return app;
  }

  private static async Task<IResult> GetCurrentUser(
      ClaimsPrincipal user,
      IMessageBus bus,
      CancellationToken cancellationToken)
  {
    var userIdValue = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (!Guid.TryParse(userIdValue, out var userId))
    {
      return Results.Unauthorized();
    }

    var result = await bus.InvokeAsync<GetCurrentUserResult>(
        new GetCurrentUserQuery(userId),
        cancellationToken);

    return result.Outcome switch
    {
      GetCurrentUserOutcome.Success => Results.Ok(MapGetCurrentUserResponse(result.Item!)),
      GetCurrentUserOutcome.NotFound => Results.NotFound(new { message = result.Message }),
      _ => Results.BadRequest(new { message = result.Message }),
    };
  }

  private static async Task<IResult> GetPublicUserProfile(
      Guid userId,
      IMessageBus bus,
      CancellationToken cancellationToken)
  {
    var result = await bus.InvokeAsync<GetPublicUserProfileResult>(
        new GetPublicUserProfileQuery(userId),
        cancellationToken);

    return result.Outcome switch
    {
      GetPublicUserProfileOutcome.Success => Results.Ok(MapGetPublicUserProfileResponse(result.Item!)),
      GetPublicUserProfileOutcome.NotFound => Results.NotFound(new { message = result.Message }),
      _ => Results.BadRequest(new { message = result.Message }),
    };
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

  private static async Task<IResult> DeleteUser(
      Guid userId,
      ClaimsPrincipal user,
      HttpContext httpContext,
      IMessageBus bus,
      CancellationToken cancellationToken)
  {
    var actorUserIdValue = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (!Guid.TryParse(actorUserIdValue, out var actorUserId))
    {
      return Results.Unauthorized();
    }

    if (actorUserId != userId)
    {
      return Results.Forbid();
    }

    var result = await bus.InvokeAsync<DeleteUserResult>(
        new DeleteUserCommand(userId),
        cancellationToken);

    if (result.Outcome == DeleteUserOutcome.Success)
    {
      AuthCookies.ClearAuthCookies(httpContext);
      return Results.NoContent();
    }

    return result.Outcome switch
    {
      DeleteUserOutcome.NotFound => Results.NotFound(new { message = result.Message }),
      DeleteUserOutcome.AlreadyDeleted => Results.NotFound(new { message = result.Message }),
      _ => Results.BadRequest(new { message = result.Message }),
    };
  }

  private static GetCurrentUserResponse MapGetCurrentUserResponse(CurrentUserProfile item)
  {
    return new GetCurrentUserResponse(
        item.Id,
        item.Username,
        item.FullName,
        item.PrivateEmail,
        item.SchoolEmail,
        item.UniversityName,
        item.Role,
        item.IsVerified,
        item.LastVerifiedAt,
        item.KarmaScore,
        item.CreatedAt,
        item.LatestPosts
            .Select(post => new CurrentUserLatestPostResponse(
                post.Id,
                post.Title,
                post.Description,
                post.StorageUrl,
                post.Upvotes,
                post.Downvotes,
                post.Score,
                post.CreatedAt,
                post.CommentCount,
                post.Tags))
            .ToArray());
  }

  private static GetPublicUserProfileResponse MapGetPublicUserProfileResponse(PublicUserProfile item)
  {
    return new GetPublicUserProfileResponse(
        item.Id,
        item.Username,
        item.UniversityName,
        item.IsVerified,
        item.KarmaScore,
        item.CreatedAt,
        item.TotalUploads,
        item.TotalUpvotesReceived,
        item.LatestPosts
            .Select(post => new PublicUserLatestPostResponse(
                post.Id,
                post.Title,
                post.Description,
                post.StorageUrl,
                post.Upvotes,
                post.Downvotes,
                post.Score,
                post.CreatedAt,
                post.CommentCount,
                post.Tags))
            .ToArray());
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
