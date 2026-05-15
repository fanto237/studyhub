using Application.Posts.Abstractions;
using FluentValidation;

namespace Application.Posts.DownloadPost;

public class DownloadPostHandler
{
  public static async Task<DownloadPostResult> Handle(
      DownloadPostCommand command,
      IValidator<DownloadPostCommand> validator,
      IPostRepository postRepository,
      CancellationToken cancellationToken)
  {
    var validationResult = await validator.ValidateAsync(command, cancellationToken);
    if (!validationResult.IsValid)
    {
      return new DownloadPostResult(
          DownloadPostOutcome.InvalidRequest,
          string.Join(" ", validationResult.Errors.Select(error => error.ErrorMessage).Distinct()));
    }

    var post = await postRepository.GetPostForDownloadAsync(command.PostId, cancellationToken);
    if (post is null)
    {
      return new DownloadPostResult(
          DownloadPostOutcome.NotFound,
          "The requested post was not found.");
    }

    return new DownloadPostResult(
        DownloadPostOutcome.Success,
        "Download link generated successfully.",
        post.Id,
        post.StorageUrl);
  }
}
