namespace Application.Comments.CreateComment;

public record CreateCommentResult(
    CreateCommentOutcome Outcome,
    string Message,
    CreateCommentItem? Item = null);

public record CreateCommentItem(
    Guid Id,
    Guid PostId,
    Guid? ParentCommentId,
    string Text,
    DateTimeOffset CreatedAt,
    CreateCommentUser User);

public record CreateCommentUser(
    Guid Id,
    string Username,
    string FullName);
