namespace Api.DTOs.Comments;

public record GetPostCommentsResponse(
    IReadOnlyList<GetPostCommentResponse> Comments);

public record GetPostCommentResponse(
    Guid Id,
    Guid? ParentCommentId,
    string Text,
    DateTimeOffset CreatedAt,
    GetPostCommentUserResponse User);

public record GetPostCommentUserResponse(
    Guid Id,
    string Username,
    string FullName);
