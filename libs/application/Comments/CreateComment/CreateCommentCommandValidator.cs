using FluentValidation;

namespace Application.Comments.CreateComment;

public class CreateCommentCommandValidator : AbstractValidator<CreateCommentCommand>
{
    public const int MaxTextLength = 4000;

    public CreateCommentCommandValidator()
    {
        RuleFor(command => command.PostId)
            .NotEmpty();

        RuleFor(command => command.ActorUserId)
            .NotEmpty();

        RuleFor(command => command.Text)
            .Cascade(CascadeMode.Stop)
            .Must(text => !string.IsNullOrWhiteSpace(text))
            .WithMessage("Comment text is required.")
            .Must(text => text is not null && text.Trim().Length <= MaxTextLength)
            .WithMessage($"Comment text cannot exceed {MaxTextLength} characters.");

        RuleFor(command => command.ParentCommentId)
            .Must(parentCommentId => !parentCommentId.HasValue || parentCommentId.Value != Guid.Empty)
            .WithMessage("Parent comment id must be a valid identifier.");
    }
}
