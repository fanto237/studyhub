namespace Api.DTOs.Auth;

public record CompleteTotpLoginRequest(
    Guid ChallengeId,
    string Code);
