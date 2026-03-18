using FluentValidation;

namespace Application.Posts.CreatePost;

public class CreatePostCommandValidator : AbstractValidator<CreatePostCommand>
{
    public const int MaxFileSizeBytes = 15 * 1024 * 1024;
    public const int MaxTagCount = 20;

    public CreatePostCommandValidator()
    {
        RuleFor(command => command.UserId)
            .NotEmpty();

        RuleFor(command => command.Title)
            .NotEmpty()
            .MaximumLength(256);

        RuleFor(command => command.Description)
            .MaximumLength(4000)
            .When(command => command.Description is not null);

        RuleFor(command => command.OriginalFileName)
            .NotEmpty()
            .MaximumLength(260);

        RuleFor(command => command.ContentType)
            .NotEmpty()
            .MaximumLength(255);

        RuleFor(command => command.FileBytes)
            .NotEmpty();

        RuleFor(command => command.FileBytes.Length)
            .GreaterThan(0)
            .LessThanOrEqualTo(MaxFileSizeBytes)
            .WithMessage($"PDF files must be {MaxFileSizeBytes / (1024 * 1024)} MB or smaller.");

        RuleFor(command => command.Tags.Count)
            .LessThanOrEqualTo(MaxTagCount)
            .WithMessage($"A post can have at most {MaxTagCount} tags.");

        RuleForEach(command => command.Tags)
            .MaximumLength(100);
    }
}
