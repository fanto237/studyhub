namespace Application.Posts.CreatePost;

public enum CreatePostOutcome
{
    Success = 0,
    InvalidRequest = 1,
    InvalidFile = 2,
    PayloadTooLarge = 3,
}
