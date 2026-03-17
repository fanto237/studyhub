namespace Domain.Entities;

public class UserRefreshToken
{
  public Guid Id { get; set; }
  public Guid UserId { get; set; }
  public string TokenHash { get; set; } = string.Empty;
  public DateTimeOffset ExpiresAt { get; set; }
  public DateTimeOffset? RevokedAt { get; set; }
  public Guid? ReplacedByTokenId { get; set; }
  public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
  public DateTimeOffset? LastUsedAt { get; set; }
  public User User { get; set; } = null!;
}
