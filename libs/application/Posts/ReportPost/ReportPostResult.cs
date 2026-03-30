namespace Application.Posts.ReportPost;

public record ReportPostResult(
    ReportPostOutcome Outcome,
    string Message,
    Guid? PostId = null,
    int ReportCount = 0,
    bool IsHidden = false);
