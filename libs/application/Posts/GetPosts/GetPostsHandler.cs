using Application.Posts.Abstractions;
using FluentValidation;

namespace Application.Posts.GetPosts;

public class GetPostsHandler
{
  public static async Task<GetPostsResult> Handle(
      GetPostsQuery query,
      IValidator<GetPostsQuery> validator,
      IPostRepository postRepository,
      CancellationToken cancellationToken)
  {
    var normalizedQuery = new GetPostsQuery(
        NormalizeSort(query.Sort),
        query.Page <= 0 ? GetPostsQueryValidator.DefaultPage : query.Page,
        query.PageSize <= 0 ? GetPostsQueryValidator.DefaultPageSize : query.PageSize,
        NormalizeSearch(query.Search),
        PostMetadataNormalizer.NormalizeTags(query.Tags),
        query.CurrentUserId,
        query.AuthorUserId);

    var validationResult = await validator.ValidateAsync(normalizedQuery, cancellationToken);
    if (!validationResult.IsValid)
    {
      return new GetPostsResult(
          GetPostsOutcome.InvalidRequest,
          string.Join(" ", validationResult.Errors.Select(error => error.ErrorMessage).Distinct()));
    }

    return await postRepository.GetPostsAsync(normalizedQuery, cancellationToken);
  }

  private static string NormalizeSort(string? sort)
  {
    return string.IsNullOrWhiteSpace(sort) ? "new" : sort.Trim().ToLowerInvariant();
  }

  private static string? NormalizeSearch(string? search)
  {
    return string.IsNullOrWhiteSpace(search) ? null : search.Trim();
  }
}
