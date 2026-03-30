namespace Application.Posts.VotePost;

public record VotePostCommand(
    Guid PostId,
    Guid UserId,
    string Vote);
