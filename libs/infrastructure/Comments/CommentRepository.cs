using Application.Comments.Abstractions;
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

    public Task<Comment?> GetCommentWithUserAsync(Guid commentId, CancellationToken cancellationToken)
    {
        return dbContext.Comments
            .AsNoTracking()
            .Include(comment => comment.User)
            .FirstOrDefaultAsync(comment => comment.Id == commentId, cancellationToken);
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
