using Domain.Enums;

namespace Domain.Entities;

public class User
{
  public const string DeletedUsername = "deleted-user";
  public const string DeletedFullName = "Deleted User";

  public Guid Id { get; set; }
  public string PrivateEmail { get; set; } = string.Empty;
  public string Username { get; set; } = string.Empty;
  public string FullName { get; set; } = string.Empty;
  public string SchoolEmail { get; set; } = string.Empty;
  public string UniversityName { get; set; } = string.Empty;
  public string PasswordHash { get; set; } = string.Empty;
  public UserRole Role { get; set; } = UserRole.User;
  public bool IsVerified { get; set; }
  public DateTimeOffset? LastVerifiedAt { get; set; }
  public int KarmaScore { get; set; }
  public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
  public DateTimeOffset? DeletedAt { get; set; }

  public ICollection<Post> Posts { get; set; } = [];
  public ICollection<Comment> Comments { get; set; } = [];
  public ICollection<PostVote> PostVotes { get; set; } = [];
  public ICollection<PostReport> PostReports { get; set; } = [];
  public ICollection<UserAuthCode> AuthCodes { get; set; } = [];
  public ICollection<UserRefreshToken> RefreshTokens { get; set; } = [];
}
