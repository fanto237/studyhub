namespace Domain.Entities;

public class Post
{
  public Guid Id { get; set; }
  public Guid UserId { get; set; }
  public string Title { get; set; } = string.Empty;
  public string? Description { get; set; }
  public string StorageUrl { get; set; } = string.Empty;
  public int Upvotes { get; set; }
  public int Downvotes { get; set; }
  public bool IsHidden { get; set; }
  public int ReportCount { get; set; }
  public DateTimeOffset? DeletedAt { get; set; }
  public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
  public DateTimeOffset? UpdatedAt { get; set; }

  public User User { get; set; } = null!;
  public ICollection<Comment> Comments { get; set; } = [];
  public ICollection<PostTag> PostTags { get; set; } = [];
  public ICollection<PostVote> Votes { get; set; } = [];
}
