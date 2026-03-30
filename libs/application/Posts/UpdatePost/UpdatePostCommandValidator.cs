using FluentValidation;

namespace Application.Posts.UpdatePost;

public class UpdatePostCommandValidator : AbstractValidator<UpdatePostCommand>
{
    public const int MaxTagCount = 20;

    public UpdatePostCommandValidator()
    {
        RuleFor(command => command.PostId)
            .NotEmpty();

        RuleFor(command => command.ActorUserId)
            .NotEmpty();

        RuleFor(command => command.Title)
            .NotEmpty()
            .MaximumLength(256);

        RuleFor(command => command.Description)
            .MaximumLength(4000)
            .When(command => command.Description is not null);

        RuleFor(command => command.Tags.Count)
            .LessThanOrEqualTo(MaxTagCount)
            .WithMessage($"A post can have at most {MaxTagCount} tags.");

        RuleForEach(command => command.Tags)
            .MaximumLength(100);
    }
}
