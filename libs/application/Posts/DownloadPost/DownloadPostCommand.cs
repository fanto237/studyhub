namespace Application.Posts.DownloadPost;

public record DownloadPostCommand(Guid PostId, Guid UserId);
