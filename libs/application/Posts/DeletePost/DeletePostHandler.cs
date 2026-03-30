using Application.Posts.Abstractions;
using Domain.Enums;
using FluentValidation;

namespace Application.Posts.DeletePost;

public class DeletePostHandler
{
  public static async Task<DeletePostResult> Handle(
      DeletePostCommand command,
      IValidator<DeletePostCommand> validator,
      IPostRepository postRepository,
      TimeProvider timeProvider,
      CancellationToken cancellationToken)
  {
    var validationResult = await validator.ValidateAsync(command, cancellationToken);
    if (!validationResult.IsValid)
    {
      return new DeletePostResult(
          DeletePostOutcome.InvalidRequest,
          string.Join(" ", validationResult.Errors.Select(error => error.ErrorMessage).Distinct()));
    }

    var post = await postRepository.GetPostForDeleteAsync(command.PostId, cancellationToken);
    if (post is null || post.DeletedAt is not null || post.IsHidden)
    {
      return new DeletePostResult(
          DeletePostOutcome.NotFound,
          "The requested post was not found.");
    }

    var canDelete = post.UserId == command.ActorUserId
        || command.ActorRole is UserRole.Admin or UserRole.Moderator;

    if (!canDelete)
    {
      return new DeletePostResult(
          DeletePostOutcome.Forbidden,
          "You are not allowed to delete this post.");
    }

    var now = timeProvider.GetUtcNow();
    post.DeletedAt = now;
    post.UpdatedAt = now;

    await postRepository.SaveChangesAsync(cancellationToken);

    return new DeletePostResult(
        DeletePostOutcome.Success,
        "Post deleted successfully.");
  }
}
