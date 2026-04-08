namespace Api.DTOs.Comments;

public record CreateCommentRequest(
    string? Text,
    Guid? ParentCommentId);
