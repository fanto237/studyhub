using Application.Comments.Abstractions;
using Domain.Entities;
using FluentValidation;

namespace Application.Comments.CreateComment;

public class CreateCommentHandler
{
  public static async Task<CreateCommentResult> Handle(
      CreateCommentCommand command,
      IValidator<CreateCommentCommand> validator,
      ICommentRepository commentRepository,
      TimeProvider timeProvider,
      CancellationToken cancellationToken)
  {
    var validationResult = await validator.ValidateAsync(command, cancellationToken);
    if (!validationResult.IsValid)
    {
      return new CreateCommentResult(
          CreateCommentOutcome.InvalidRequest,
          string.Join(" ", validationResult.Errors.Select(error => error.ErrorMessage).Distinct()));
    }

    var post = await commentRepository.GetPostForCommentCreationAsync(command.PostId, cancellationToken);
    if (post is null)
    {
      return new CreateCommentResult(
          CreateCommentOutcome.NotFound,
          "The requested post was not found.");
    }

    if (command.ParentCommentId.HasValue)
    {
      var parentComment = await commentRepository.GetParentCommentForCreationAsync(
          command.PostId,
          command.ParentCommentId.Value,
          cancellationToken);

      if (parentComment is null)
      {
        return new CreateCommentResult(
            CreateCommentOutcome.NotFound,
            "The requested parent comment was not found.");
      }
    }

    var now = timeProvider.GetUtcNow();
    var comment = new Comment
    {
      Id = Guid.NewGuid(),
      PostId = command.PostId,
      UserId = command.ActorUserId,
      ParentCommentId = command.ParentCommentId,
      Text = command.Text!.Trim(),
      CreatedAt = now,
    };

    commentRepository.AddComment(comment);
    await commentRepository.SaveChangesAsync(cancellationToken);

    var createdComment = await commentRepository.GetCommentWithUserAsync(comment.Id, cancellationToken) ?? throw new InvalidOperationException($"The created comment {comment.Id} could not be loaded.");
    return new CreateCommentResult(
            CreateCommentOutcome.Success,
            "Comment created successfully.",
            new CreateCommentItem(
                createdComment.Id,
                createdComment.PostId,
                createdComment.ParentCommentId,
                createdComment.Text,
                createdComment.CreatedAt,
                new CreateCommentUser(
                    createdComment.User.Id,
                    createdComment.User.Username,
                    createdComment.User.FullName)));
  }
}
