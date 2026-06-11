namespace Infrastructure.Options;

public sealed class GroqOptions
{
  public const string SectionName = "Groq";

  public string? ApiKey { get; init; }
  public string Model { get; init; } = "llama-3.3-70b-versatile";
  public string BaseUrl { get; init; } = "https://api.groq.com/openai/v1";
  public int TimeoutSeconds { get; init; } = 30;
  public int MaxInputCharacters { get; init; } = 12_000;
}
