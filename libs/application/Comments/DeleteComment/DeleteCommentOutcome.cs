namespace Application.Comments.DeleteComment;

public enum DeleteCommentOutcome
{
    Success = 0,
    InvalidRequest = 1,
    NotFound = 2,
    Forbidden = 3,
}
