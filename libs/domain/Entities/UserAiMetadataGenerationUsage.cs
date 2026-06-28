namespace Domain.Entities;

public class UserAiMetadataGenerationUsage
{
  public Guid UserId { get; set; }
  public DateOnly UsageDate { get; set; }
  public int GenerationCount { get; set; }
  public DateTimeOffset CreatedAt { get; set; }
  public DateTimeOffset UpdatedAt { get; set; }

  public User User { get; set; } = null!;
}
