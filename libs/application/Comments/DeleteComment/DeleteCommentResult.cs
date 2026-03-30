namespace Application.Comments.DeleteComment;

public record DeleteCommentResult(
    DeleteCommentOutcome Outcome,
    string Message);
