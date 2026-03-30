using Application.Comments.Abstractions;
using Domain.Enums;
using FluentValidation;

namespace Application.Comments.DeleteComment;

public class DeleteCommentHandler
{
    public static async Task<DeleteCommentResult> Handle(
        DeleteCommentCommand command,
        IValidator<DeleteCommentCommand> validator,
        ICommentRepository commentRepository,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        var validationResult = await validator.ValidateAsync(command, cancellationToken);
        if (!validationResult.IsValid)
        {
            return new DeleteCommentResult(
                DeleteCommentOutcome.InvalidRequest,
                string.Join(" ", validationResult.Errors.Select(error => error.ErrorMessage).Distinct()));
        }

        var comment = await commentRepository.GetCommentForDeleteAsync(command.CommentId, cancellationToken);
        if (comment is null || comment.DeletedAt is not null)
        {
            return new DeleteCommentResult(
                DeleteCommentOutcome.NotFound,
                "The requested comment was not found.");
        }

        var canDelete = comment.UserId == command.ActorUserId
            || command.ActorRole is UserRole.Admin or UserRole.Moderator;

        if (!canDelete)
        {
            return new DeleteCommentResult(
                DeleteCommentOutcome.Forbidden,
                "You are not allowed to delete this comment.");
        }

        comment.DeletedAt = timeProvider.GetUtcNow();

        await commentRepository.SaveChangesAsync(cancellationToken);

        return new DeleteCommentResult(
            DeleteCommentOutcome.Success,
            "Comment deleted successfully.");
    }
}
