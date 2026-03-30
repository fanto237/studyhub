using Domain.Enums;

namespace Application.Comments.DeleteComment;

public record DeleteCommentCommand(
    Guid CommentId,
    Guid ActorUserId,
    UserRole ActorRole);
