using FluentValidation;

namespace Application.Posts.DeletePost;

public class DeletePostCommandValidator : AbstractValidator<DeletePostCommand>
{
    public DeletePostCommandValidator()
    {
        RuleFor(command => command.PostId)
            .NotEmpty();

        RuleFor(command => command.ActorUserId)
            .NotEmpty();
    }
}
