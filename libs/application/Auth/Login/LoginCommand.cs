namespace Application.Auth.Login;

public record LoginCommand(string UsernameOrPrivateEmail, string Password);
