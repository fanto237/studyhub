namespace Application.Posts.DownloadPost;

public record DownloadPostResult(
    DownloadPostOutcome Outcome,
    string Message,
    Guid? PostId = null,
    string? DownloadUrl = null,
    string? FileName = null);

public record DownloadPostItem(
    Guid Id,
    string StorageUrl);
