using FluentValidation;

namespace Application.Posts.ReportPost;

public class ReportPostCommandValidator : AbstractValidator<ReportPostCommand>
{
    public const int MaxDetailsLength = 2000;

    public ReportPostCommandValidator()
    {
        RuleFor(command => command.PostId)
            .NotEmpty();

        RuleFor(command => command.UserId)
            .NotEmpty();

        RuleFor(command => command.Reason)
            .NotEmpty()
            .Must(BeValidReason)
            .WithMessage("Report reason must be one of: spam, copyright, abusive, wrong-content, other.");

        RuleFor(command => command.Details)
            .NotEmpty()
            .WithMessage("Details are required when reason is other.")
            .When(command => ReportPostHandler.NormalizeReason(command.Reason) == "other");

        RuleFor(command => command.Details)
            .MaximumLength(MaxDetailsLength)
            .When(command => !string.IsNullOrWhiteSpace(command.Details));
    }

    private static bool BeValidReason(string reason)
    {
        return ReportPostHandler.TryParseReason(reason, out _);
    }
}
