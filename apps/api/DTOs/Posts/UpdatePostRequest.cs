namespace Api.DTOs.Posts;

public record UpdatePostRequest(
    string? Title,
    string? Description,
    IReadOnlyList<string>? Tags);
