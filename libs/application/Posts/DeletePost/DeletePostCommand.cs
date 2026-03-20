using Domain.Enums;

namespace Application.Posts.DeletePost;

public record DeletePostCommand(
    Guid PostId,
    Guid ActorUserId,
    UserRole ActorRole);
