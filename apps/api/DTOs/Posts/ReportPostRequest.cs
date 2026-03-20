namespace Api.DTOs.Posts;

public record ReportPostRequest(
    string Reason,
    string? Details);
