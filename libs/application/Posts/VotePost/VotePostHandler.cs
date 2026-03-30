using Application.Posts.Abstractions;
using Domain.Entities;
using Domain.Enums;
using FluentValidation;

namespace Application.Posts.VotePost;

public class VotePostHandler
{
  public static async Task<VotePostResult> Handle(
      VotePostCommand command,
      IValidator<VotePostCommand> validator,
      IPostRepository postRepository,
      TimeProvider timeProvider,
      CancellationToken cancellationToken)
  {
    var validationResult = await validator.ValidateAsync(command, cancellationToken);
    if (!validationResult.IsValid)
    {
      return new VotePostResult(
          VotePostOutcome.InvalidRequest,
          string.Join(" ", validationResult.Errors.Select(error => error.ErrorMessage).Distinct()));
    }

    var normalizedVote = NormalizeVote(command.Vote);
    var post = await postRepository.GetPostForVotingAsync(command.PostId, command.UserId, cancellationToken);
    if (post is null || post.DeletedAt is not null || post.IsHidden)
    {
      return new VotePostResult(
          VotePostOutcome.NotFound,
          "The requested post was not found.");
    }

    var existingVote = post.Votes.SingleOrDefault();
    var now = timeProvider.GetUtcNow();
    var stateChanged = false;
    string? currentVote;

    switch (normalizedVote)
    {
      case "up":
        currentVote = "up";

        if (existingVote is null)
        {
          postRepository.AddPostVote(new PostVote
          {
            PostId = post.Id,
            UserId = command.UserId,
            Value = PostVoteValue.Upvote,
            CreatedAt = now,
          });

          post.Upvotes += 1;
          stateChanged = true;
        }
        else if (existingVote.Value == PostVoteValue.Downvote)
        {
          existingVote.Value = PostVoteValue.Upvote;
          post.Downvotes -= 1;
          post.Upvotes += 1;
          stateChanged = true;
        }

        break;

      case "down":
        currentVote = "down";

        if (existingVote is null)
        {
          postRepository.AddPostVote(new PostVote
          {
            PostId = post.Id,
            UserId = command.UserId,
            Value = PostVoteValue.Downvote,
            CreatedAt = now,
          });

          post.Downvotes += 1;
          stateChanged = true;
        }
        else if (existingVote.Value == PostVoteValue.Upvote)
        {
          existingVote.Value = PostVoteValue.Downvote;
          post.Upvotes -= 1;
          post.Downvotes += 1;
          stateChanged = true;
        }

        break;

      default:
        currentVote = null;

        if (existingVote is not null)
        {
          if (existingVote.Value == PostVoteValue.Upvote)
          {
            post.Upvotes -= 1;
          }
          else
          {
            post.Downvotes -= 1;
          }

          postRepository.RemovePostVote(existingVote);
          stateChanged = true;
        }

        break;
    }

    if (stateChanged)
    {
      await postRepository.SaveChangesAsync(cancellationToken);
    }

    return new VotePostResult(
        VotePostOutcome.Success,
        stateChanged ? "Vote updated successfully." : "Vote is already in the requested state.",
        post.Id,
        post.Upvotes,
        post.Downvotes,
        post.Upvotes - post.Downvotes,
        currentVote);
  }

  internal static string NormalizeVote(string vote)
  {
    return string.IsNullOrWhiteSpace(vote)
        ? string.Empty
        : vote.Trim().ToLowerInvariant();
  }
}
