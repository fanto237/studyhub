using Application.Posts.Abstractions;
using Application.Posts.GetPost;
using Application.Posts.GetPosts;
using Domain.Entities;
using Domain.Enums;
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

    if (query.AuthorUserId.HasValue)
    {
      postsQuery = postsQuery.Where(post => post.UserId == query.AuthorUserId.Value);
    }

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
                post.User.FullName),
            query.CurrentUserId.HasValue
                ? post.Votes
                    .Where(vote => vote.UserId == query.CurrentUserId.Value)
                    .Select(vote => (PostVoteValue?)vote.Value)
                    .FirstOrDefault()
                : null))
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

  public async Task<GetPostResult> GetPostAsync(GetPostQuery query, CancellationToken cancellationToken)
  {
    var post = await dbContext.Posts
        .AsNoTracking()
        .Where(candidate => candidate.Id == query.PostId)
        .Where(candidate => candidate.DeletedAt == null)
        .Where(candidate => !candidate.IsHidden)
        .Select(candidate => new
        {
          candidate.Id,
          candidate.Title,
          candidate.Description,
          candidate.StorageUrl,
          candidate.Upvotes,
          candidate.Downvotes,
          Score = candidate.Upvotes - candidate.Downvotes,
          candidate.CreatedAt,
          candidate.UpdatedAt,
          Tags = candidate.PostTags
              .OrderBy(postTag => postTag.Tag.Name)
              .Select(postTag => postTag.Tag.Name)
              .ToArray(),
          CurrentVote = query.CurrentUserId.HasValue
              ? candidate.Votes
                  .Where(vote => vote.UserId == query.CurrentUserId.Value)
                  .Select(vote => (PostVoteValue?)vote.Value)
                  .FirstOrDefault()
              : null,
          User = new PostDetailUser(
              candidate.UserId,
              candidate.User.Username,
              candidate.User.FullName),
        })
        .FirstOrDefaultAsync(cancellationToken);

    if (post is null)
    {
      return new GetPostResult(
          GetPostOutcome.NotFound,
          "The requested post was not found.");
    }

    var comments = await dbContext.Comments
        .AsNoTracking()
        .Where(comment => comment.PostId == query.PostId)
        .OrderBy(comment => comment.CreatedAt)
        .ThenBy(comment => comment.Id)
        .Select(comment => new PostDetailComment(
            comment.Id,
            comment.ParentCommentId,
            comment.Text,
            comment.CreatedAt,
            new PostDetailUser(
                comment.UserId,
                comment.User.Username,
                comment.User.FullName)))
        .ToListAsync(cancellationToken);

    return new GetPostResult(
        GetPostOutcome.Success,
        "Post retrieved successfully.",
        new PostDetail(
            post.Id,
            post.Title,
            post.Description,
            post.StorageUrl,
            post.Upvotes,
            post.Downvotes,
            post.Score,
            post.CreatedAt,
            post.UpdatedAt,
            comments.Count,
            post.Tags,
            post.User,
            comments,
            post.CurrentVote));
  }

  public Task<Post?> GetPostForUpdateAsync(Guid postId, CancellationToken cancellationToken)
  {
    return dbContext.Posts
        .Include(post => post.PostTags)
        .FirstOrDefaultAsync(post => post.Id == postId, cancellationToken);
  }

  public Task<Post?> GetPostForDeleteAsync(Guid postId, CancellationToken cancellationToken)
  {
    return dbContext.Posts
        .FirstOrDefaultAsync(post => post.Id == postId, cancellationToken);
  }

  public Task<Post?> GetPostForVotingAsync(Guid postId, Guid userId, CancellationToken cancellationToken)
  {
    return dbContext.Posts
        .Include(post => post.Votes.Where(vote => vote.UserId == userId))
        .FirstOrDefaultAsync(post => post.Id == postId, cancellationToken);
  }

  public void AddPost(Post post)
  {
    dbContext.Posts.Add(post);
  }

  public void AddTags(IEnumerable<Tag> tags)
  {
    dbContext.Tags.AddRange(tags);
  }

  public void AddPostVote(PostVote postVote)
  {
    dbContext.PostVotes.Add(postVote);
  }

  public void RemovePostTags(IEnumerable<PostTag> postTags)
  {
    dbContext.PostTags.RemoveRange(postTags);
  }

  public void RemovePostVote(PostVote postVote)
  {
    dbContext.PostVotes.Remove(postVote);
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
