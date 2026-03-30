using Application.Posts.GetPost;

namespace Application.Posts.UpdatePost;

public record UpdatePostResult(
    UpdatePostOutcome Outcome,
    string Message,
    PostDetail? Item = null);
