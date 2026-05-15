namespace Application.Comments.UpdateComment;

public record UpdateCommentResult(
    UpdateCommentOutcome Outcome,
    string Message,
    UpdateCommentItem? Item = null);

public record UpdateCommentItem(
    Guid Id,
    Guid PostId,
    Guid? ParentCommentId,
    string Text,
    DateTimeOffset CreatedAt,
    UpdateCommentUser User);

public record UpdateCommentUser(
    Guid Id,
    string Username,
    string FullName);
