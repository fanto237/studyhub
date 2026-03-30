namespace Application.Posts.DeletePost;

public enum DeletePostOutcome
{
    Success = 0,
    InvalidRequest = 1,
    NotFound = 2,
    Forbidden = 3,
}
