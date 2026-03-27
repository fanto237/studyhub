using Application.Users.GetCurrentUser;

namespace Application.Users.UpdateCurrentUser;

public record UpdateCurrentUserResult(
    UpdateCurrentUserOutcome Outcome,
    string Message,
    CurrentUserProfile? Item = null);
