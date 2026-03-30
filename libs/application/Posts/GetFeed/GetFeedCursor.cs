using System.Text;
using System.Text.Json;
using Application.Posts.GetPosts;

namespace Application.Posts.GetFeed;

public sealed record GetFeedCursor(
    string Sort,
    int Score,
    DateTimeOffset CreatedAt,
    Guid Id);

public static class GetFeedCursorCodec
{
    public static string Encode(string sort, PostFeedItem item)
    {
        var payload = new GetFeedCursor(
            sort,
            item.Score,
            item.CreatedAt,
            item.Id);

        var json = JsonSerializer.Serialize(payload);
        return Convert.ToBase64String(Encoding.UTF8.GetBytes(json));
    }

    public static bool TryDecode(string? cursor, string sort, out GetFeedCursor? decodedCursor, out string? error)
    {
        decodedCursor = null;
        error = null;

        if (string.IsNullOrWhiteSpace(cursor))
        {
            return true;
        }

        try
        {
            var json = Encoding.UTF8.GetString(Convert.FromBase64String(cursor));
            decodedCursor = JsonSerializer.Deserialize<GetFeedCursor>(json);

            if (decodedCursor is null)
            {
                error = "The feed cursor is invalid.";
                return false;
            }

            if (!string.Equals(decodedCursor.Sort, sort, StringComparison.OrdinalIgnoreCase))
            {
                error = "The feed cursor does not match the requested sort order.";
                decodedCursor = null;
                return false;
            }

            return true;
        }
        catch (FormatException)
        {
            error = "The feed cursor is invalid.";
            return false;
        }
        catch (JsonException)
        {
            error = "The feed cursor is invalid.";
            return false;
        }
    }
}
