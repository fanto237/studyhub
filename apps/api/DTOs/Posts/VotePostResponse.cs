namespace Api.DTOs.Posts;

public record VotePostResponse(
    Guid PostId,
    int Upvotes,
    int Downvotes,
    int Score,
    string? CurrentVote,
    string Message);
