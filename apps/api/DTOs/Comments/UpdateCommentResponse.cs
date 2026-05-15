namespace Api.DTOs.Comments;

public record UpdateCommentResponse(
    Guid Id,
    Guid PostId,
    Guid? ParentCommentId,
    string Text,
    DateTimeOffset CreatedAt,
    UpdateCommentUserResponse User);

public record UpdateCommentUserResponse(
    Guid Id,
    string Username,
    string FullName);
