namespace Api.DTOs.Auth;

public record DisableTotpRequest(
    string Password,
    string Code);
