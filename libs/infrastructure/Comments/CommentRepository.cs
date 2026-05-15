using Application.Comments.Abstractions;
using Application.Comments.GetPostComments;
using Domain.Entities;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Comments;

public class CommentRepository(StudyHubDbContext dbContext) : ICommentRepository
{
    public Task<Post?> GetPostForCommentCreationAsync(Guid postId, CancellationToken cancellationToken)
    {
        return dbContext.Posts
            .AsNoTracking()
            .FirstOrDefaultAsync(
                post => post.Id == postId
                    && post.DeletedAt == null
                    && !post.IsHidden,
                cancellationToken);
    }

    public Task<Comment?> GetParentCommentForCreationAsync(Guid postId, Guid parentCommentId, CancellationToken cancellationToken)
    {
        return dbContext.Comments
            .AsNoTracking()
            .FirstOrDefaultAsync(
                comment => comment.Id == parentCommentId
                    && comment.PostId == postId
                    && comment.DeletedAt == null,
                cancellationToken);
    }

    public Task<Comment?> GetCommentForDeleteAsync(Guid commentId, CancellationToken cancellationToken)
    {
        return dbContext.Comments
            .FirstOrDefaultAsync(comment => comment.Id == commentId, cancellationToken);
    }

    public Task<Comment?> GetCommentForUpdateAsync(Guid commentId, CancellationToken cancellationToken)
    {
        return dbContext.Comments
            .FirstOrDefaultAsync(comment => comment.Id == commentId, cancellationToken);
    }

    public Task<Comment?> GetCommentWithUserAsync(Guid commentId, CancellationToken cancellationToken)
    {
        return dbContext.Comments
            .AsNoTracking()
            .Include(comment => comment.User)
            .FirstOrDefaultAsync(comment => comment.Id == commentId, cancellationToken);
    }

    public async Task<GetPostCommentsResult> GetPostCommentsAsync(GetPostCommentsQuery query, CancellationToken cancellationToken)
    {
        var postExists = await dbContext.Posts
            .AsNoTracking()
            .AnyAsync(
                post => post.Id == query.PostId
                    && post.DeletedAt == null
                    && !post.IsHidden,
                cancellationToken);

        if (!postExists)
        {
            return new GetPostCommentsResult(
                GetPostCommentsOutcome.NotFound,
                "The requested post was not found.");
        }

        var comments = await dbContext.Comments
            .AsNoTracking()
            .Where(comment => comment.PostId == query.PostId)
            .OrderBy(comment => comment.CreatedAt)
            .ThenBy(comment => comment.Id)
            .Select(comment => new GetPostCommentItem(
                comment.Id,
                comment.ParentCommentId,
                comment.DeletedAt != null ? "[deleted]" : comment.Text,
                comment.CreatedAt,
                new GetPostCommentUser(
                    comment.UserId,
                    comment.User.DeletedAt != null ? User.DeletedUsername : comment.User.Username,
                    comment.User.DeletedAt != null ? User.DeletedFullName : comment.User.FullName)))
            .ToListAsync(cancellationToken);

        return new GetPostCommentsResult(
            GetPostCommentsOutcome.Success,
            "Comments retrieved successfully.",
            comments);
    }

    public void AddComment(Comment comment)
    {
        dbContext.Comments.Add(comment);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        return dbContext.SaveChangesAsync(cancellationToken);
    }
}
