namespace Application.Auth.Register;

public record RegisterUserCommand(
    string PrivateEmail,
    string Username,
    string FullName,
    string Password,
    string SchoolEmail);
