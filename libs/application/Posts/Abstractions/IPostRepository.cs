using Application.Posts.GetFeed;
using Application.Posts.GetPost;
using Application.Posts.GetPosts;
using Domain.Entities;

namespace Application.Posts.Abstractions;

public interface IPostRepository
{
    Task<IReadOnlyList<Tag>> GetTagsByNamesAsync(IReadOnlyCollection<string> names, CancellationToken cancellationToken);
    Task<GetPostsResult> GetPostsAsync(GetPostsQuery query, CancellationToken cancellationToken);
    Task<GetFeedResult> GetFeedAsync(GetFeedQuery query, CancellationToken cancellationToken);
    Task<GetPostResult> GetPostAsync(GetPostQuery query, CancellationToken cancellationToken);
    Task<Post?> GetPostForUpdateAsync(Guid postId, CancellationToken cancellationToken);
    Task<Post?> GetPostForDeleteAsync(Guid postId, CancellationToken cancellationToken);
    Task<Post?> GetPostForVotingAsync(Guid postId, Guid userId, CancellationToken cancellationToken);
    Task<Post?> GetPostForReportingAsync(Guid postId, Guid userId, CancellationToken cancellationToken);
    void AddPost(Post post);
    void AddTags(IEnumerable<Tag> tags);
    void AddPostVote(PostVote postVote);
    void AddPostReport(PostReport postReport);
    void RemovePostTags(IEnumerable<PostTag> postTags);
    void RemovePostVote(PostVote postVote);
    Task SaveChangesAsync(CancellationToken cancellationToken);
    Task ExecuteInTransactionAsync(Func<CancellationToken, Task> operation, CancellationToken cancellationToken);
}
