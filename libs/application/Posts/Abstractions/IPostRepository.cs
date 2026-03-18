using Domain.Entities;

namespace Application.Posts.Abstractions;

public interface IPostRepository
{
    Task<IReadOnlyList<Tag>> GetTagsByNamesAsync(IReadOnlyCollection<string> names, CancellationToken cancellationToken);
    void AddPost(Post post);
    void AddTags(IEnumerable<Tag> tags);
    Task SaveChangesAsync(CancellationToken cancellationToken);
    Task ExecuteInTransactionAsync(Func<CancellationToken, Task> operation, CancellationToken cancellationToken);
}
