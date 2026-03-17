using Domain.Enums;

namespace Domain.Entities;

public class User
{
    public Guid Id { get; set; }
    public string PrivateEmail { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string SchoolEmail { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.User;
    public bool IsVerified { get; set; }
    public DateTimeOffset? LastVerifiedAt { get; set; }
    public int KarmaScore { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<Post> Posts { get; set; } = new List<Post>();
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public ICollection<UserAuthCode> AuthCodes { get; set; } = new List<UserAuthCode>();
    public ICollection<UserRefreshToken> RefreshTokens { get; set; } = new List<UserRefreshToken>();
}
