using Application.Comments.Abstractions;
using FluentValidation;

namespace Application.Comments.GetPostComments;

public class GetPostCommentsHandler
{
    public static async Task<GetPostCommentsResult> Handle(
        GetPostCommentsQuery query,
        IValidator<GetPostCommentsQuery> validator,
        ICommentRepository commentRepository,
        CancellationToken cancellationToken)
    {
        var validationResult = await validator.ValidateAsync(query, cancellationToken);
        if (!validationResult.IsValid)
        {
            return new GetPostCommentsResult(
                GetPostCommentsOutcome.InvalidRequest,
                string.Join(" ", validationResult.Errors.Select(error => error.ErrorMessage).Distinct()));
        }

        return await commentRepository.GetPostCommentsAsync(query, cancellationToken);
    }
}
