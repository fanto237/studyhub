namespace Api.DTOs.Posts;

public record ReportPostResponse(
    Guid PostId,
    int ReportCount,
    bool IsHidden,
    string Message);
