using Application.Posts.Abstractions;
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
