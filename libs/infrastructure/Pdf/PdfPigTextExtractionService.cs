using System.Text;
using Application.Posts.Abstractions;
using UglyToad.PdfPig;
using UglyToad.PdfPig.DocumentLayoutAnalysis.TextExtractor;

namespace Infrastructure.Pdf;

public sealed class PdfPigTextExtractionService : IPdfTextExtractionService
{
  public Task<PdfTextExtractionResult> ExtractTextAsync(
      PdfTextExtractionRequest request,
      CancellationToken cancellationToken)
  {
    using var stream = new MemoryStream(request.FileBytes, writable: false);
    using var document = PdfDocument.Open(stream);

    var builder = new StringBuilder(Math.Min(request.MaxCharacters, 16_384));
    var pagesRead = 0;

    foreach (var page in document.GetPages().Take(Math.Max(request.MaxPages, 1)))
    {
      cancellationToken.ThrowIfCancellationRequested();

      var pageText = ContentOrderTextExtractor.GetText(page);
      // var pageText = page.Text;
      if (string.IsNullOrWhiteSpace(pageText))
      {
        pagesRead++;
        continue;
      }

      if (builder.Length > 0)
      {
        builder.AppendLine();
        builder.AppendLine();
      }

      var remainingCharacters = request.MaxCharacters - builder.Length;
      if (pageText.Length > remainingCharacters)
      {
        builder.Append(pageText.AsSpan(0, Math.Max(remainingCharacters, 0)));
        pagesRead++;
        break;
      }

      builder.Append(pageText);
      pagesRead++;

      if (builder.Length >= request.MaxCharacters)
      {
        break;
      }
    }

    var text = builder.ToString();
    return Task.FromResult(new PdfTextExtractionResult(text, pagesRead, text.Length));
  }
}
