using Domain.Enums;

namespace Application.Posts.ReportPost;

public record ReportPostCommand(
    Guid PostId,
    Guid UserId,
    UserRole ActorRole,
    string Reason,
    string? Details);
