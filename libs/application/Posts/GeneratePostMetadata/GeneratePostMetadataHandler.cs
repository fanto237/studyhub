using Application.Posts.Abstractions;
using Application.Posts.CreatePost;
using FluentValidation;
using Microsoft.Extensions.Logging;

namespace Application.Posts.GeneratePostMetadata;

public class GeneratePostMetadataHandler
{
  private const int MaxExtractedPages = 8;
  private const int MaxExtractedCharacters = 12_000;
  private const int MinimumUsefulTextCharacters = 120;

  public static async Task<GeneratePostMetadataResult> Handle(
      GeneratePostMetadataCommand command,
      IValidator<GeneratePostMetadataCommand> validator,
      IPdfTextExtractionService pdfTextExtractionService,
      IPostMetadataAiService postMetadataAiService,
      ILogger<GeneratePostMetadataHandler> logger,
      CancellationToken cancellationToken)
  {
    var validationResult = await validator.ValidateAsync(command, cancellationToken);
    if (!validationResult.IsValid)
    {
      return new GeneratePostMetadataResult(
          GeneratePostMetadataOutcome.InvalidRequest,
          string.Join(" ", validationResult.Errors.Select(error => error.ErrorMessage).Distinct()));
    }

    if (command.FileBytes.Length > CreatePostCommandValidator.MaxFileSizeBytes)
    {
      return new GeneratePostMetadataResult(
          GeneratePostMetadataOutcome.PayloadTooLarge,
          $"PDF files must be {CreatePostCommandValidator.MaxFileSizeBytes / (1024 * 1024)} MB or smaller.");
    }

    if (!PdfPostFileValidator.HasPdfHeader(command.FileBytes))
    {
      return new GeneratePostMetadataResult(
          GeneratePostMetadataOutcome.InvalidFile,
          "Only valid PDF files are allowed.");
    }

    if (PdfPostFileValidator.ContainsEncryptMarker(command.FileBytes))
    {
      return new GeneratePostMetadataResult(
          GeneratePostMetadataOutcome.InvalidFile,
          "Password-protected PDF files are not supported.");
    }

    PdfTextExtractionResult extractedText;
    try
    {
      extractedText = await pdfTextExtractionService.ExtractTextAsync(
          new PdfTextExtractionRequest(command.FileBytes, MaxExtractedPages, MaxExtractedCharacters),
          cancellationToken);
    }
    catch (Exception exception)
    {
      logger.LogWarning(exception, "Could not extract text for metadata suggestions from PDF {FileName} for user {UserId}", command.OriginalFileName, command.UserId);
      return new GeneratePostMetadataResult(
          GeneratePostMetadataOutcome.InvalidFile,
          "The PDF text could not be read. Please check the file and try again.");
    }

    if (CountNonWhitespaceCharacters(extractedText.Text) < MinimumUsefulTextCharacters)
    {
      return new GeneratePostMetadataResult(
          GeneratePostMetadataOutcome.InsufficientText,
          "StudyHub could not find enough readable text in this PDF. Scanned or image-only PDFs are not supported for AI suggestions yet.",
          Warnings: ["No OCR was performed for this PDF."]);
    }

    try
    {
      var aiResult = await postMetadataAiService.GenerateAsync(
          new PostMetadataAiRequest(extractedText.Text, command.Title),
          cancellationToken);

      var normalizedTitle = string.IsNullOrWhiteSpace(aiResult.Title)
          ? null
          : PostMetadataNormalizer.NormalizeTitle(aiResult.Title);
      if (normalizedTitle is { Length: > 256 })
      {
        normalizedTitle = normalizedTitle[..256].Trim();
      }

      var normalizedDescription = PostMetadataNormalizer.NormalizeDescription(aiResult.Description);
      if (normalizedDescription is { Length: > 4000 })
      {
        normalizedDescription = normalizedDescription[..4000].Trim();
      }

      var normalizedTags = PostMetadataNormalizer.NormalizeTags(aiResult.Tags)
          .Take(CreatePostCommandValidator.MaxTagCount)
          .Where(tag => tag.Length <= 100)
          .ToArray();

      var warnings = aiResult.Warnings
          .Where(warning => !string.IsNullOrWhiteSpace(warning))
          .Select(warning => warning.Trim())
          .Distinct(StringComparer.Ordinal)
          .ToArray();

      return new GeneratePostMetadataResult(
          GeneratePostMetadataOutcome.Success,
          "Metadata suggestions generated successfully.",
          normalizedTitle,
          normalizedDescription,
          normalizedTags,
          aiResult.DetectedLanguage,
          aiResult.LanguageConfidence,
          warnings);
    }
    catch (Exception exception)
    {
      logger.LogWarning(exception, "AI metadata provider failed for user {UserId}", command.UserId);
      return new GeneratePostMetadataResult(
          GeneratePostMetadataOutcome.ProviderUnavailable,
          "AI suggestions are temporarily unavailable. You can still upload the PDF manually.");
    }
  }

  private static int CountNonWhitespaceCharacters(string value)
  {
    return value.Count(character => !char.IsWhiteSpace(character));
  }
}
