namespace Application.Auth.VerifyAccount;

public record VerifyAccountCommand(string SchoolEmail, string Code);
