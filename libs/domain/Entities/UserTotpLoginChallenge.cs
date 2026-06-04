namespace Domain.Entities;

public class UserTotpLoginChallenge
{
  public Guid Id { get; set; }
  public Guid UserId { get; set; }
  public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
  public DateTimeOffset ExpiresAt { get; set; }
  public DateTimeOffset? ConsumedAt { get; set; }
  public int FailedAttempts { get; set; }

  public User User { get; set; } = null!;
}
