using FluentValidation;

namespace Application.Comments.GetPostComments;

public class GetPostCommentsValidator : AbstractValidator<GetPostCommentsQuery>
{
    public GetPostCommentsValidator()
    {
        RuleFor(query => query.PostId)
            .NotEmpty()
            .WithMessage("Post id must be a valid identifier.");
    }
}
