using Domain.Enums;

namespace Domain.Entities;

public class UserAuthCode
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public AuthCodePurpose Purpose { get; set; }
    public string Code { get; set; } = string.Empty;
    public string DeliveryAddress { get; set; } = string.Empty;
    public DateTimeOffset ExpiresAt { get; set; }
    public DateTimeOffset? ConsumedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public User User { get; set; } = null!;
}
