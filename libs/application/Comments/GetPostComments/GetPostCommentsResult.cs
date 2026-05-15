namespace Application.Comments.GetPostComments;

public record GetPostCommentsResult(
    GetPostCommentsOutcome Outcome,
    string Message,
    IReadOnlyList<GetPostCommentItem>? Items = null);

public record GetPostCommentItem(
    Guid Id,
    Guid? ParentCommentId,
    string Text,
    DateTimeOffset CreatedAt,
    GetPostCommentUser User);

public record GetPostCommentUser(
    Guid Id,
    string Username,
    string FullName);
