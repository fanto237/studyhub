using FluentValidation;

namespace Application.Comments.UpdateComment;

public class UpdateCommentCommandValidator : AbstractValidator<UpdateCommentCommand>
{
    public const int MaxTextLength = 4000;

    public UpdateCommentCommandValidator()
    {
        RuleFor(command => command.CommentId)
            .NotEmpty();

        RuleFor(command => command.ActorUserId)
            .NotEmpty();

        RuleFor(command => command.Text)
            .Cascade(CascadeMode.Stop)
            .Must(text => !string.IsNullOrWhiteSpace(text))
            .WithMessage("Comment text is required.")
            .Must(text => text is not null && text.Trim().Length <= MaxTextLength)
            .WithMessage($"Comment text cannot exceed {MaxTextLength} characters.");
    }
}
