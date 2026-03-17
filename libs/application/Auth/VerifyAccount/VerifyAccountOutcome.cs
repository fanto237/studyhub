namespace Application.Auth.VerifyAccount;

public enum VerifyAccountOutcome
{
    Success = 0,
    InvalidRequest = 1,
    InvalidCode = 2,
    ExpiredCode = 3,
    AlreadyVerified = 4
}
