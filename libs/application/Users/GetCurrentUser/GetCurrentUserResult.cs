using Domain.Enums;

namespace Application.Users.GetCurrentUser;

public record GetCurrentUserResult(
    GetCurrentUserOutcome Outcome,
    string Message,
    CurrentUserProfile? Item = null);

public record CurrentUserProfile(
    Guid Id,
    string Username,
    string FullName,
    string PrivateEmail,
    string SchoolEmail,
    string UniversityName,
    UserRole Role,
    bool IsVerified,
    DateTimeOffset? LastVerifiedAt,
    bool IsTotpEnabled,
    DateTimeOffset? TotpEnabledAt,
    int KarmaScore,
    DateTimeOffset CreatedAt,
    IReadOnlyList<CurrentUserLatestPost> LatestPosts);

public record CurrentUserLatestPost(
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
