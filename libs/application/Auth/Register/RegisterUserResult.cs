namespace Application.Auth.Register;

public record RegisterUserResult(
    RegisterUserOutcome Outcome,
    string Message,
    Guid? UserId = null,
    string? PrivateEmail = null,
    string? Username = null,
    string? FullName = null,
    string? SchoolEmail = null,
    bool IsVerified = false);
