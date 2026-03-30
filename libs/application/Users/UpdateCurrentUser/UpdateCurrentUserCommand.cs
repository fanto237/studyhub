namespace Application.Users.UpdateCurrentUser;

public record UpdateCurrentUserCommand(
    Guid UserId,
    string? Username,
    string? FullName,
    string? PrivateEmail);
