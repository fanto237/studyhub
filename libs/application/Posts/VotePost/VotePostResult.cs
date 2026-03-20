namespace Application.Posts.VotePost;

public record VotePostResult(
    VotePostOutcome Outcome,
    string Message,
    Guid? PostId = null,
    int Upvotes = 0,
    int Downvotes = 0,
    int Score = 0,
    string? CurrentVote = null);
