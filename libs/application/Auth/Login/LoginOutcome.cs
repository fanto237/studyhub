namespace Application.Auth.Login;

public enum LoginOutcome
{
    Success = 0,
    InvalidRequest = 1,
    InvalidCredentials = 2,
    AccountNotVerified = 3
}
