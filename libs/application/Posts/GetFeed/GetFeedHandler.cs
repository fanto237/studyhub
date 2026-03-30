using Application.Posts.Abstractions;
using FluentValidation;

namespace Application.Posts.GetFeed;

public class GetFeedHandler
{
  public static async Task<GetFeedResult> Handle(
      GetFeedQuery query,
      IValidator<GetFeedQuery> validator,
      IPostRepository postRepository,
      CancellationToken cancellationToken)
  {
    var normalizedQuery = new GetFeedQuery(
        NormalizeSort(query.Sort),
        query.Limit <= 0 ? GetFeedQueryValidator.DefaultLimit : query.Limit,
        NormalizeCursor(query.Cursor),
        PostMetadataNormalizer.NormalizeTags(query.Tags),
        query.CurrentUserId);

    var validationResult = await validator.ValidateAsync(normalizedQuery, cancellationToken);
    if (!validationResult.IsValid)
    {
      return new GetFeedResult(
          GetFeedOutcome.InvalidRequest,
          string.Join(" ", validationResult.Errors.Select(error => error.ErrorMessage).Distinct()));
    }

    return await postRepository.GetFeedAsync(normalizedQuery, cancellationToken);
  }

  private static string NormalizeSort(string? sort)
  {
    return string.IsNullOrWhiteSpace(sort) ? "new" : sort.Trim().ToLowerInvariant();
  }

  private static string? NormalizeCursor(string? cursor)
  {
    return string.IsNullOrWhiteSpace(cursor) ? null : cursor.Trim();
  }
}
