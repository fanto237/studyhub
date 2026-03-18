using FluentValidation;

namespace Application.Posts.GetPosts;

public class GetPostsQueryValidator : AbstractValidator<GetPostsQuery>
{
    public const int DefaultPage = 1;
    public const int DefaultPageSize = 20;
    public const int MaxPageSize = 100;

    private static readonly string[] AllowedSorts = ["new", "top", "trending"];

    public GetPostsQueryValidator()
    {
        RuleFor(query => query.Sort)
            .Must(sort => string.IsNullOrWhiteSpace(sort) || AllowedSorts.Contains(sort, StringComparer.OrdinalIgnoreCase))
            .WithMessage("Sort must be one of: new, top, trending.");

        RuleFor(query => query.Page)
            .GreaterThanOrEqualTo(1);

        RuleFor(query => query.PageSize)
            .InclusiveBetween(1, MaxPageSize)
            .WithMessage($"Page size must be between 1 and {MaxPageSize}.");

        RuleFor(query => query.Search)
            .MaximumLength(200)
            .When(query => query.Search is not null);

        RuleFor(query => query.Tag)
            .MaximumLength(100)
            .When(query => query.Tag is not null);
    }
}
