namespace Api.DTOs.Users;

public record UpdateCurrentUserRequest(
    string? Username,
    string? FullName,
    string? PrivateEmail);
