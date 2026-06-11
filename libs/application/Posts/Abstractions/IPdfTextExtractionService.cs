namespace Application.Posts.Abstractions;

public interface IPdfTextExtractionService
{
  Task<PdfTextExtractionResult> ExtractTextAsync(
      PdfTextExtractionRequest request,
      CancellationToken cancellationToken);
}

public sealed record PdfTextExtractionRequest(
    byte[] FileBytes,
    int MaxPages,
    int MaxCharacters);

public sealed record PdfTextExtractionResult(
    string Text,
    int PagesRead,
    int CharacterCount);
