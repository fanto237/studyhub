namespace Application.Users.UpdateCurrentUser;

public enum UpdateCurrentUserOutcome
{
    Success = 0,
    InvalidRequest = 1,
    NotFound = 2,
    UsernameAlreadyRegistered = 3,
    PrivateEmailAlreadyRegistered = 4,
}
