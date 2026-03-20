using FluentValidation;

namespace Application.Posts.VotePost;

public class VotePostCommandValidator : AbstractValidator<VotePostCommand>
{
    public VotePostCommandValidator()
    {
        RuleFor(command => command.PostId)
            .NotEmpty();

        RuleFor(command => command.UserId)
            .NotEmpty();

        RuleFor(command => command.Vote)
            .NotEmpty()
            .Must(BeValidVote)
            .WithMessage("Vote must be one of: up, down, remove.");
    }

    private static bool BeValidVote(string vote)
    {
        var normalizedVote = VotePostHandler.NormalizeVote(vote);
        return normalizedVote is "up" or "down" or "remove";
    }
}
