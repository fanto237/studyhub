namespace Application.Auth.Totp.CompleteLogin;

public record CompleteTotpLoginCommand(Guid ChallengeId, string Code);
