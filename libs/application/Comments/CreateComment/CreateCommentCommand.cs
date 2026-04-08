namespace Application.Comments.CreateComment;

public record CreateCommentCommand(
    Guid PostId,
    Guid ActorUserId,
    string? Text,
    Guid? ParentCommentId);
