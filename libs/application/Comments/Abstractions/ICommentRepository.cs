using Application.Comments.GetPostComments;
using Domain.Entities;

namespace Application.Comments.Abstractions;

public interface ICommentRepository
{
    Task<Post?> GetPostForCommentCreationAsync(Guid postId, CancellationToken cancellationToken);
    Task<Comment?> GetParentCommentForCreationAsync(Guid postId, Guid parentCommentId, CancellationToken cancellationToken);
    Task<Comment?> GetCommentForDeleteAsync(Guid commentId, CancellationToken cancellationToken);
    Task<Comment?> GetCommentForUpdateAsync(Guid commentId, CancellationToken cancellationToken);
    Task<Comment?> GetCommentWithUserAsync(Guid commentId, CancellationToken cancellationToken);
    Task<GetPostCommentsResult> GetPostCommentsAsync(GetPostCommentsQuery query, CancellationToken cancellationToken);
    void AddComment(Comment comment);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
