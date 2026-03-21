namespace Api.DTOs.Users;

public record RegisterAccountResponse(
    Guid UserId,
    string PrivateEmail,
    string Username,
    string FullName,
    string SchoolEmail,
    string UniversityName,
    bool IsVerified,
    string Message);
