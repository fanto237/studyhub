using Application.Comments.Abstractions;
using Domain.Enums;
using FluentValidation;

namespace Application.Comments.UpdateComment;

public class UpdateCommentHandler
{
    public static async Task<UpdateCommentResult> Handle(
        UpdateCommentCommand command,
        IValidator<UpdateCommentCommand> validator,
        ICommentRepository commentRepository,
        CancellationToken cancellationToken)
    {
        var validationResult = await validator.ValidateAsync(command, cancellationToken);
        if (!validationResult.IsValid)
        {
            return new UpdateCommentResult(
                UpdateCommentOutcome.InvalidRequest,
                string.Join(" ", validationResult.Errors.Select(error => error.ErrorMessage).Distinct()));
        }

        var comment = await commentRepository.GetCommentForUpdateAsync(command.CommentId, cancellationToken);
        if (comment is null || comment.DeletedAt is not null)
        {
            return new UpdateCommentResult(
                UpdateCommentOutcome.NotFound,
                "The requested comment was not found.");
        }

        var canUpdate = comment.UserId == command.ActorUserId
            || command.ActorRole is UserRole.Admin or UserRole.Moderator;

        if (!canUpdate)
        {
            return new UpdateCommentResult(
                UpdateCommentOutcome.Forbidden,
                "You are not allowed to edit this comment.");
        }

        comment.Text = command.Text!.Trim();

        await commentRepository.SaveChangesAsync(cancellationToken);

        var updatedComment = await commentRepository.GetCommentWithUserAsync(comment.Id, cancellationToken) ?? throw new InvalidOperationException($"The updated comment {comment.Id} could not be loaded.");
        return new UpdateCommentResult(
            UpdateCommentOutcome.Success,
            "Comment updated successfully.",
            new UpdateCommentItem(
                updatedComment.Id,
                updatedComment.PostId,
                updatedComment.ParentCommentId,
                updatedComment.Text,
                updatedComment.CreatedAt,
                new UpdateCommentUser(
                    updatedComment.User.Id,
                    updatedComment.User.Username,
                    updatedComment.User.FullName)));
    }
}
