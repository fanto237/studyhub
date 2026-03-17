namespace Api.DTOs.Users;

public record VerifyAccountResponse(
    Guid UserId,
    string SchoolEmail,
    bool IsVerified,
    DateTimeOffset? LastVerifiedAt,
    string Message);
