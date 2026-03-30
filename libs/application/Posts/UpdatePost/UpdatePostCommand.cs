using Domain.Enums;

namespace Application.Posts.UpdatePost;

public record UpdatePostCommand(
    Guid PostId,
    Guid ActorUserId,
    UserRole ActorRole,
    string? Title,
    string? Description,
    IReadOnlyList<string> Tags);
