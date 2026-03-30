using Application.Posts.Abstractions;
using FluentValidation;

namespace Application.Posts.GetPost;

public class GetPostHandler
{
    public static async Task<GetPostResult> Handle(
        GetPostQuery query,
        IValidator<GetPostQuery> validator,
        IPostRepository postRepository,
        CancellationToken cancellationToken)
    {
        var validationResult = await validator.ValidateAsync(query, cancellationToken);
        if (!validationResult.IsValid)
        {
            return new GetPostResult(
                GetPostOutcome.InvalidRequest,
                string.Join(" ", validationResult.Errors.Select(error => error.ErrorMessage).Distinct()));
        }

        return await postRepository.GetPostAsync(query, cancellationToken);
    }
}
