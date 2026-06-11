using Application.Posts.CreatePost;
using FluentValidation;

namespace Application.Posts.GeneratePostMetadata;

public class GeneratePostMetadataCommandValidator : AbstractValidator<GeneratePostMetadataCommand>
{
  public GeneratePostMetadataCommandValidator()
  {
    RuleFor(command => command.UserId)
        .NotEmpty();

    RuleFor(command => command.Title)
        .MaximumLength(256)
        .When(command => command.Title is not null);

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
        .LessThanOrEqualTo(CreatePostCommandValidator.MaxFileSizeBytes)
        .WithMessage($"PDF files must be {CreatePostCommandValidator.MaxFileSizeBytes / (1024 * 1024)} MB or smaller.");
  }
}
