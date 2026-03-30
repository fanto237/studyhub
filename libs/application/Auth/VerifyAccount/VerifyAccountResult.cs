namespace Application.Auth.VerifyAccount;

public record VerifyAccountResult(
    VerifyAccountOutcome Outcome,
    string Message,
    Guid? UserId = null,
    string? SchoolEmail = null,
    bool IsVerified = false,
    DateTimeOffset? LastVerifiedAt = null);
