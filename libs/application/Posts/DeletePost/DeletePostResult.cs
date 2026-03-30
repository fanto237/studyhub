namespace Application.Posts.DeletePost;

public record DeletePostResult(
    DeletePostOutcome Outcome,
    string Message);
