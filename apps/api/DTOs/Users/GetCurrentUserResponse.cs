using Domain.Enums;

namespace Api.DTOs.Users;

public record GetCurrentUserResponse(
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
    CurrentUserAiMetadataGenerationUsageResponse? AiMetadataGenerationUsage,
    IReadOnlyList<CurrentUserLatestPostResponse> LatestPosts);

public record CurrentUserAiMetadataGenerationUsageResponse(
    int Limit,
    int UsedToday,
    int Remaining,
    DateTimeOffset ResetAt);

public record CurrentUserLatestPostResponse(
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
