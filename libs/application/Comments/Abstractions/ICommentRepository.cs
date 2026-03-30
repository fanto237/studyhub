using Domain.Entities;

namespace Application.Comments.Abstractions;

public interface ICommentRepository
{
    Task<Comment?> GetCommentForDeleteAsync(Guid commentId, CancellationToken cancellationToken);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
