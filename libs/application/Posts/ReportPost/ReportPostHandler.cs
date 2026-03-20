using Application.Options;
using Application.Posts.Abstractions;
using Domain.Entities;
using Domain.Enums;
using FluentValidation;

namespace Application.Posts.ReportPost;

public class ReportPostHandler
{
  public static async Task<ReportPostResult> Handle(
      ReportPostCommand command,
      IValidator<ReportPostCommand> validator,
      IPostRepository postRepository,
      TimeProvider timeProvider,
      CancellationToken cancellationToken)
  {
    var validationResult = await validator.ValidateAsync(command, cancellationToken);
    if (!validationResult.IsValid)
    {
      return new ReportPostResult(
          ReportPostOutcome.InvalidRequest,
          string.Join(" ", validationResult.Errors.Select(error => error.ErrorMessage).Distinct()));
    }

    var post = await postRepository.GetPostForReportingAsync(command.PostId, command.UserId, cancellationToken);
    if (post is null || post.DeletedAt is not null || post.IsHidden)
    {
      return new ReportPostResult(
          ReportPostOutcome.NotFound,
          "The requested post was not found.");
    }

    if (post.UserId == command.UserId)
    {
      return new ReportPostResult(
          ReportPostOutcome.Forbidden,
          "You cannot report your own post.");
    }

    if (post.Reports.Count > 0)
    {
      return new ReportPostResult(
          ReportPostOutcome.AlreadyReported,
          "You have already reported this post.");
    }

    if (!TryParseReason(command.Reason, out var reason) || reason is null)
    {
      return new ReportPostResult(
          ReportPostOutcome.InvalidRequest,
          "Report reason must be one of: spam, copyright, abusive, wrong-content, other.");
    }

    var now = timeProvider.GetUtcNow();
    var details = NormalizeDetails(command.Details);
    var threshold = PostModerationHelper.AutoHideReportThreshold;

    postRepository.AddPostReport(new PostReport
    {
      PostId = post.Id,
      UserId = command.UserId,
      Reason = reason.Value,
      Details = details,
      CreatedAt = now,
    });

    post.ReportCount += 1;
    post.IsHidden = command.ActorRole is UserRole.Admin or UserRole.Moderator || post.ReportCount >= threshold;
    post.UpdatedAt = now;

    await postRepository.ExecuteInTransactionAsync(
        ct => postRepository.SaveChangesAsync(ct),
        cancellationToken);

    var message = command.ActorRole is UserRole.Admin or UserRole.Moderator
        ? "Post reported and hidden successfully."
        : post.IsHidden
            ? "Post reported successfully. The post has been hidden."
            : "Post reported successfully.";

    return new ReportPostResult(
        ReportPostOutcome.Success,
        message,
        post.Id,
        post.ReportCount,
        post.IsHidden);
  }

  internal static string NormalizeReason(string reason)
  {
    return string.IsNullOrWhiteSpace(reason)
        ? string.Empty
        : reason.Trim().ToLowerInvariant();
  }

  internal static bool TryParseReason(string reason, out PostReportReason? reportReason)
  {
    reportReason = NormalizeReason(reason) switch
    {
      "spam" => PostReportReason.Spam,
      "copyright" => PostReportReason.Copyright,
      "abusive" => PostReportReason.Abusive,
      "wrong-content" => PostReportReason.WrongContent,
      "other" => PostReportReason.Other,
      _ => null,
    };

    return reportReason.HasValue;
  }

  private static string? NormalizeDetails(string? details)
  {
    return string.IsNullOrWhiteSpace(details) ? null : details.Trim();
  }
}
