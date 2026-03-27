namespace Application.Users.DeleteUser;

public record DeleteUserResult(
    DeleteUserOutcome Outcome,
    string Message);
