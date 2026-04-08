namespace Api.DTOs.Comments;

public record CreateCommentResponse(
    Guid Id,
    Guid PostId,
    Guid? ParentCommentId,
    string Text,
    DateTimeOffset CreatedAt,
    CreateCommentUserResponse User);

public record CreateCommentUserResponse(
    Guid Id,
    string Username,
    string FullName);
