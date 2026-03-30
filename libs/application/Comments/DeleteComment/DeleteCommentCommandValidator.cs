using FluentValidation;

namespace Application.Comments.DeleteComment;

public class DeleteCommentCommandValidator : AbstractValidator<DeleteCommentCommand>
{
    public DeleteCommentCommandValidator()
    {
        RuleFor(command => command.CommentId)
            .NotEmpty();

        RuleFor(command => command.ActorUserId)
            .NotEmpty();
    }
}
