namespace Application.Posts;

public static class PostMetadataNormalizer
{
  public static string NormalizeTitle(string title)
  {
    return CollapseWhitespace(title);
  }

  public static string? NormalizeDescription(string? description)
  {
    return string.IsNullOrWhiteSpace(description) ? null : description.Trim();
  }

  public static IReadOnlyList<string> NormalizeTags(IEnumerable<string> tags)
  {
    return [..tags
            .Select(tag => tag?.Trim() ?? string.Empty)
            .Where(tag => !string.IsNullOrWhiteSpace(tag))
            .Select(CollapseWhitespace)
            .Select(tag => tag.ToLowerInvariant())
            .Distinct(StringComparer.Ordinal)];
  }

  private static string CollapseWhitespace(string value)
  {
    return string.Join(' ', value.Split([' ', '\t', '\r', '\n'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));
  }
}
