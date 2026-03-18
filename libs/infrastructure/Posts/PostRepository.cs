using Application.Posts.Abstractions;
using Application.Posts.GetPosts;
using Domain.Entities;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Posts;

public class PostRepository(StudyHubDbContext dbContext) : IPostRepository
{
  public async Task<IReadOnlyList<Tag>> GetTagsByNamesAsync(IReadOnlyCollection<string> names, CancellationToken cancellationToken)
  {
    if (names.Count == 0)
    {
      return [];
    }

    return await dbContext.Tags
        .Where(tag => names.Contains(tag.Name))
        .ToListAsync(cancellationToken);
  }

  public async Task<GetPostsResult> GetPostsAsync(GetPostsQuery query, CancellationToken cancellationToken)
  {
    var postsQuery = dbContext.Posts
        .AsNoTracking()
        .Where(post => post.DeletedAt == null)
        .Where(post => !post.IsHidden);

    if (!string.IsNullOrWhiteSpace(query.Tag))
    {
      postsQuery = postsQuery.Where(post => post.PostTags.Any(postTag => postTag.Tag.Name == query.Tag));
    }

    if (!string.IsNullOrWhiteSpace(query.Search))
    {
      var pattern = $"%{query.Search}%";
      postsQuery = postsQuery.Where(post =>
          EF.Functions.ILike(post.Title, pattern)
          || (post.Description != null && EF.Functions.ILike(post.Description, pattern))
          || post.PostTags.Any(postTag => EF.Functions.ILike(postTag.Tag.Name, pattern)));
    }

    postsQuery = query.Sort switch
    {
      "top" => postsQuery
          .OrderByDescending(post => post.Upvotes - post.Downvotes)
          .ThenByDescending(post => post.CreatedAt),
      "trending" => postsQuery
          .OrderByDescending(post => post.Upvotes - post.Downvotes)
          .ThenByDescending(post => post.CreatedAt),
      _ => postsQuery
          .OrderByDescending(post => post.CreatedAt),
    };

    var totalCount = await postsQuery.CountAsync(cancellationToken);
    var totalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)query.PageSize);
    var skip = (query.Page - 1) * query.PageSize;

    var items = await postsQuery
        .Skip(skip)
        .Take(query.PageSize)
        .Select(post => new PostFeedItem(
            post.Id,
            post.Title,
            post.Description,
            post.StorageUrl,
            post.Upvotes,
            post.Downvotes,
            post.Upvotes - post.Downvotes,
            post.CreatedAt,
            post.Comments.Count,
            post.PostTags
                .OrderBy(postTag => postTag.Tag.Name)
                .Select(postTag => postTag.Tag.Name)
                .ToArray(),
            new PostFeedUser(
                post.UserId,
                post.User.Username,
                post.User.FullName)))
        .ToListAsync(cancellationToken);

    return new GetPostsResult(
        GetPostsOutcome.Success,
        "Posts retrieved successfully.",
        items,
        query.Page,
        query.PageSize,
        totalCount,
        totalPages);
  }

  public void AddPost(Post post)
  {
    dbContext.Posts.Add(post);
  }

  public void AddTags(IEnumerable<Tag> tags)
  {
    dbContext.Tags.AddRange(tags);
  }

  public Task SaveChangesAsync(CancellationToken cancellationToken)
  {
    return dbContext.SaveChangesAsync(cancellationToken);
  }

  public async Task ExecuteInTransactionAsync(Func<CancellationToken, Task> operation, CancellationToken cancellationToken)
  {
    await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

    try
    {
      await operation(cancellationToken);
      await transaction.CommitAsync(cancellationToken);
    }
    catch
    {
      await transaction.RollbackAsync(cancellationToken);
      throw;
    }
  }
}
