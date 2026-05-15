using Domain.Enums;

namespace Application.Comments.UpdateComment;

public record UpdateCommentCommand(
    Guid CommentId,
    Guid ActorUserId,
    UserRole ActorRole,
    string? Text);
