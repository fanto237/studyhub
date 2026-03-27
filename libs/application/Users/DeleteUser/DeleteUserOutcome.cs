namespace Application.Users.DeleteUser;

public enum DeleteUserOutcome
{
    Success = 0,
    InvalidRequest = 1,
    NotFound = 2,
    AlreadyDeleted = 3,
}
