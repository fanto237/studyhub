namespace Application.Auth.Register;

public enum RegisterUserOutcome
{
    Success = 0,
    InvalidRequest = 1,
    PrivateEmailAlreadyRegistered = 2,
    UsernameAlreadyRegistered = 3,
    SchoolEmailAlreadyRegistered = 4
}
