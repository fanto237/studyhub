using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Application.Posts.Abstractions;
using Infrastructure.Options;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Infrastructure.Ai;

public sealed class GroqPostMetadataAiService(
    HttpClient httpClient,
    IOptionsMonitor<GroqOptions> options,
    ILogger<GroqPostMetadataAiService> logger) : IPostMetadataAiService
{
  private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
  {
    DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
  };

  private readonly HttpClient httpClient = httpClient;
  private readonly IOptionsMonitor<GroqOptions> options = options;
  private readonly ILogger<GroqPostMetadataAiService> logger = logger;

  public async Task<PostMetadataAiResult> GenerateAsync(
      PostMetadataAiRequest request,
      CancellationToken cancellationToken)
  {
    var groqOptions = options.CurrentValue;
    if (string.IsNullOrWhiteSpace(groqOptions.ApiKey))
    {
      throw new InvalidOperationException("Groq:ApiKey is not configured.");
    }

    var inputText = Truncate(request.ExtractedText, Math.Max(groqOptions.MaxInputCharacters, 1));
    Exception? lastException = null;

    for (var attempt = 1; attempt <= 2; attempt++)
    {
      try
      {
        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, BuildChatCompletionsUri(groqOptions.BaseUrl));
        httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", groqOptions.ApiKey);
        httpRequest.Content = JsonContent.Create(
            BuildPayload(groqOptions.Model, request.Title, inputText, attempt),
            options: JsonOptions);

        using var response = await httpClient.SendAsync(httpRequest, cancellationToken);
        var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
          logger.LogWarning("Groq metadata request failed with HTTP {StatusCode}", (int)response.StatusCode);
          throw new InvalidOperationException($"Groq request failed with HTTP {(int)response.StatusCode}.");
        }

        var content = ExtractAssistantContent(responseBody);
        var metadata = JsonSerializer.Deserialize<GroqMetadataResponse>(content, JsonOptions);
        if (metadata is null)
        {
          throw new JsonException("Groq returned an empty JSON object.");
        }

        var tags = metadata.Tags ?? [];
        return new PostMetadataAiResult(
            metadata.Title,
            metadata.Description,
            tags,
            metadata.DetectedLanguage,
            metadata.LanguageConfidence,
            metadata.Warnings ?? []);
      }
      catch (Exception exception) when (attempt < 2 && exception is JsonException or InvalidOperationException)
      {
        lastException = exception;
        logger.LogWarning(exception, "Groq metadata response was invalid on attempt {Attempt}; retrying once", attempt);
      }
    }

    throw lastException ?? new InvalidOperationException("Groq metadata generation failed.");
  }

  private static Uri BuildChatCompletionsUri(string? baseUrl)
  {
    var normalizedBaseUrl = string.IsNullOrWhiteSpace(baseUrl)
        ? "https://api.groq.com/openai/v1"
        : baseUrl.TrimEnd('/');

    return new Uri($"{normalizedBaseUrl}/chat/completions");
  }

  private static object BuildPayload(
      string model,
      string? title,
      string inputText,
      int attempt)
  {
    var systemPrompt = """
You generate StudyHub PDF metadata. Return only syntactically valid JSON.
The JSON object must use exactly these camelCase fields:
{
  "title": string | null,
  "description": string | null,
  "tags": string[],
  "detectedLanguage": string | null,
  "languageConfidence": number | null,
  "warnings": string[]
}
Rules:
- Detect the dominant language of the PDF text and write title, description, and tags in that language.
- Preserve acronyms, course codes, mathematical notation, names, universities, and proper nouns as written.
- Do not invent facts that are not supported by the text.
- Title: concise and searchable for classmates, maximum 256 characters. Prefer course name/code, document type, term/year when supported by the text.
- Description: concise, useful for students, 2 to 4 sentences, maximum 4000 characters.
- Tags: 4 to 8 short searchable tags, max 100 characters each, no duplicates, no hashtags.
- Warnings: include short user-facing warnings only if the text was ambiguous, truncated, or too sparse.
""";

    var retryInstruction = attempt > 1
        ? "Previous output did not match the required JSON shape. Return only a valid JSON object with title, description, tags, detectedLanguage, languageConfidence, and warnings."
        : null;

    return new
    {
      model = string.IsNullOrWhiteSpace(model) ? "llama-3.3-70b-versatile" : model,
      messages = new object[]
      {
        new { role = "system", content = systemPrompt },
        new
        {
          role = "user",
          content = $"Optional user title: {NullIfWhiteSpace(title) ?? "(none)"}\n{retryInstruction}\n\nExtracted PDF text:\n---\n{inputText}\n---",
        },
      },
      temperature = 0.2,
      max_completion_tokens = 900,
      response_format = new { type = "json_object" },
    };
  }

  private static string ExtractAssistantContent(string responseBody)
  {
    using var document = JsonDocument.Parse(responseBody);
    var root = document.RootElement;
    var choices = root.GetProperty("choices");
    if (choices.GetArrayLength() == 0)
    {
      throw new JsonException("Groq response did not contain choices.");
    }

    var message = choices[0].GetProperty("message");
    if (!message.TryGetProperty("content", out var content) || content.ValueKind != JsonValueKind.String)
    {
      throw new JsonException("Groq response did not contain assistant content.");
    }

    var value = content.GetString();
    if (string.IsNullOrWhiteSpace(value))
    {
      throw new JsonException("Groq response content was empty.");
    }

    return value;
  }

  private static string Truncate(string value, int maxCharacters)
  {
    return value.Length <= maxCharacters ? value : value[..maxCharacters];
  }

  private static string? NullIfWhiteSpace(string? value)
  {
    return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
  }

  private sealed record GroqMetadataResponse(
      string? Title,
      string? Description,
      IReadOnlyList<string>? Tags,
      string? DetectedLanguage,
      double? LanguageConfidence,
      IReadOnlyList<string>? Warnings);
}
