using FluentValidation;

namespace Application.Posts.GetFeed;

public class GetFeedQueryValidator : AbstractValidator<GetFeedQuery>
{
    public const int DefaultLimit = 20;
    public const int MaxLimit = 50;
    public const int MaxTagCount = 20;

    private static readonly string[] AllowedSorts = ["new", "top", "trending"];

    public GetFeedQueryValidator()
    {
        RuleFor(query => query.Sort)
            .Must(sort => string.IsNullOrWhiteSpace(sort) || AllowedSorts.Contains(sort, StringComparer.OrdinalIgnoreCase))
            .WithMessage("Sort must be one of: new, top, trending.");

        RuleFor(query => query.Limit)
            .InclusiveBetween(1, MaxLimit)
            .WithMessage($"Limit must be between 1 and {MaxLimit}.");

        RuleFor(query => query.Tags.Count)
            .LessThanOrEqualTo(MaxTagCount)
            .WithMessage($"At most {MaxTagCount} tags can be selected.");

        RuleForEach(query => query.Tags)
            .MaximumLength(100);

        RuleFor(query => query.Cursor)
            .MaximumLength(1000)
            .When(query => query.Cursor is not null);
    }
}
