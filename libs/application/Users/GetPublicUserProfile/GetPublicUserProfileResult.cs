namespace Application.Users.GetPublicUserProfile;

public record GetPublicUserProfileResult(
    GetPublicUserProfileOutcome Outcome,
    string Message,
    PublicUserProfile? Item = null);

public record PublicUserProfile(
    Guid Id,
    string Username,
    string UniversityName,
    bool IsVerified,
    int KarmaScore,
    DateTimeOffset CreatedAt,
    int TotalUploads,
    int TotalUpvotesReceived,
    IReadOnlyList<PublicUserLatestPost> LatestPosts);

public record PublicUserLatestPost(
    Guid Id,
    string Title,
    string? Description,
    string StorageUrl,
    int Upvotes,
    int Downvotes,
    int Score,
    DateTimeOffset CreatedAt,
    int CommentCount,
    IReadOnlyList<string> Tags);
