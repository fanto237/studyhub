using System.Text.Json.Serialization;

namespace Api.Responses;

public static class SendResponse
{
  public static Success<T> Success<T>(T? data) => new("success", data);
  public static Fail<T> Fail<T>(T? data) => new("fail", data);
  public static Error Error(string message, int? code = null, object? data = null) => new("error", message, code, data);
}

public sealed record Success<T>(
  [property: JsonPropertyName("status")]
  string Status,
  [property: JsonPropertyName("data")]
  [property: JsonIgnore(Condition = JsonIgnoreCondition.Never)]
  T? Data);

public sealed record Fail<T>(
  [property: JsonPropertyName("status")]
  string Status,
  [property: JsonPropertyName("data")]
  [property: JsonIgnore(Condition = JsonIgnoreCondition.Never)]
  T? Data);

public sealed record Error(
  [property: JsonPropertyName("status")]
  string Status,
  [property: JsonPropertyName("message")]
  string Message,
  [property: JsonPropertyName("code")]
  [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
  int? Code,
  [property: JsonPropertyName("data")]
  [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
  object? Data);
