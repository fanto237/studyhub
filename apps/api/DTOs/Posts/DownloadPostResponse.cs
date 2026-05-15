namespace Api.DTOs.Posts;

public record DownloadPostResponse(
    Guid PostId,
    string DownloadUrl,
    string? FileName,
    string Message);
