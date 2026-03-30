namespace Application.Posts.ReportPost;

public enum ReportPostOutcome
{
    Success = 0,
    InvalidRequest = 1,
    NotFound = 2,
    AlreadyReported = 3,
    Forbidden = 4,
}
