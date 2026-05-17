using System.Text.Json.Serialization;

namespace Api.DTOs.Auth;

public sealed record UnverifiedAccountLoginResponse(
  [property: JsonPropertyName("message")]
  string Message,
  [property: JsonPropertyName("schoolEmail")]
  string SchoolEmail,
  [property: JsonPropertyName("username")]
  string? Username);
