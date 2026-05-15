using FluentValidation;

namespace Application.Posts.DownloadPost;

public class DownloadPostCommandValidator : AbstractValidator<DownloadPostCommand>
{
  public DownloadPostCommandValidator()
  {
    RuleFor(command => command.PostId)
        .NotEmpty();

    RuleFor(command => command.UserId)
        .NotEmpty();
  }
}
