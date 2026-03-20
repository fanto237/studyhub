using Domain.Enums;

namespace Domain.Entities;

public class PostReport
{
  public Guid PostId { get; set; }
  public Guid UserId { get; set; }
  public PostReportReason Reason { get; set; }
  public string? Details { get; set; }
  public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

  public Post Post { get; set; } = null!;
  public User User { get; set; } = null!;
}
