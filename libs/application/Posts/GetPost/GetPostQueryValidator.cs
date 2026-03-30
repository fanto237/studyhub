using FluentValidation;

namespace Application.Posts.GetPost;

public class GetPostQueryValidator : AbstractValidator<GetPostQuery>
{
    public GetPostQueryValidator()
    {
        RuleFor(query => query.PostId)
            .NotEmpty();
    }
}
