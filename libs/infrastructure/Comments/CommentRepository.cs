using Application.Comments.Abstractions;
using Domain.Entities;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Comments;

public class CommentRepository(StudyHubDbContext dbContext) : ICommentRepository
{
    public Task<Comment?> GetCommentForDeleteAsync(Guid commentId, CancellationToken cancellationToken)
    {
        return dbContext.Comments
            .FirstOrDefaultAsync(comment => comment.Id == commentId, cancellationToken);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        return dbContext.SaveChangesAsync(cancellationToken);
    }
}
