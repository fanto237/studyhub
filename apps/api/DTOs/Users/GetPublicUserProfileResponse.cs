namespace Api.DTOs.Users;

public record GetPublicUserProfileResponse(
    Guid Id,
    string Username,
    string UniversityName,
    bool IsVerified,
    int KarmaScore,
    DateTimeOffset CreatedAt,
    int TotalUploads,
    int TotalUpvotesReceived,
    IReadOnlyList<PublicUserLatestPostResponse> LatestPosts);

public record PublicUserLatestPostResponse(
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
