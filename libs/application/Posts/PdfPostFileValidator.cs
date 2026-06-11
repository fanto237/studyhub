namespace Application.Posts;

public static class PdfPostFileValidator
{
  private static readonly byte[] PdfHeader = "%PDF-"u8.ToArray();
  private static readonly byte[] EncryptMarker = "/Encrypt"u8.ToArray();

  public static bool HasPdfHeader(ReadOnlySpan<byte> fileBytes)
  {
    return fileBytes.Length >= PdfHeader.Length && fileBytes[..PdfHeader.Length].SequenceEqual(PdfHeader);
  }

  public static bool ContainsEncryptMarker(ReadOnlySpan<byte> fileBytes)
  {
    return ContainsSequence(fileBytes, EncryptMarker);
  }

  private static bool ContainsSequence(ReadOnlySpan<byte> source, ReadOnlySpan<byte> sequence)
  {
    if (source.Length < sequence.Length)
    {
      return false;
    }

    for (var index = 0; index <= source.Length - sequence.Length; index++)
    {
      if (source.Slice(index, sequence.Length).SequenceEqual(sequence))
      {
        return true;
      }
    }

    return false;
  }
}
