namespace Application.Auth.Register;

public record RegisterUserCommand(
    string PrivateEmail,
    string Username,
    string FullName,
    string UniversityName,
    string Password,
    string SchoolEmail);
