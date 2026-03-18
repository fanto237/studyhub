using System.Text;
using Application.Posts.Abstractions;
using Domain.Entities;
using FluentValidation;
using Microsoft.Extensions.Logging;

namespace Application.Posts.CreatePost;

public class CreatePostHandler
{
  private static readonly byte[] PdfHeader = "%PDF-"u8.ToArray();
  private static readonly byte[] EncryptMarker = "/Encrypt"u8.ToArray();

  public static async Task<CreatePostResult> Handle(
      CreatePostCommand command,
      IValidator<CreatePostCommand> validator,
      IPostRepository postRepository,
      IPostFileStorageService postFileStorageService,
      TimeProvider timeProvider,
      ILogger<CreatePostHandler> logger,
      CancellationToken cancellationToken)
  {
    var validationResult = await validator.ValidateAsync(command, cancellationToken);
    if (!validationResult.IsValid)
    {
      return new CreatePostResult(
          CreatePostOutcome.InvalidRequest,
          string.Join(" ", validationResult.Errors.Select(error => error.ErrorMessage).Distinct()));
    }

    if (command.FileBytes.Length > CreatePostCommandValidator.MaxFileSizeBytes)
    {
      return new CreatePostResult(
          CreatePostOutcome.PayloadTooLarge,
          $"PDF files must be {CreatePostCommandValidator.MaxFileSizeBytes / (1024 * 1024)} MB or smaller.");
    }

    if (!HasPdfHeader(command.FileBytes))
    {
      return new CreatePostResult(
          CreatePostOutcome.InvalidFile,
          "Only valid PDF files are allowed.");
    }

    if (ContainsSequence(command.FileBytes, EncryptMarker))
    {
      return new CreatePostResult(
          CreatePostOutcome.InvalidFile,
          "Password-protected PDF files are not supported.");
    }

    var now = timeProvider.GetUtcNow();
    var postId = Guid.NewGuid();
    var normalizedTitle = NormalizeTitle(command.Title);
    var normalizedDescription = NormalizeDescription(command.Description);
    var normalizedTags = NormalizeTags(command.Tags);
    var objectKey = $"posts/{command.UserId.ToString("N")}/{postId.ToString("N")}.pdf";
    string? uploadedObjectKey = null;

    try
    {
      var storedFile = await postFileStorageService.UploadPostPdfAsync(
          new PostFileUploadRequest(
              objectKey,
              command.OriginalFileName,
              NormalizeContentType(command.ContentType),
              command.FileBytes),
          cancellationToken);

      uploadedObjectKey = storedFile.ObjectKey;

      var existingTags = await postRepository.GetTagsByNamesAsync(normalizedTags, cancellationToken);
      var existingTagLookup = existingTags.ToDictionary(tag => tag.Name, StringComparer.Ordinal);
      var newTags = normalizedTags
          .Where(tagName => !existingTagLookup.ContainsKey(tagName))
          .Select(tagName => new Tag
          {
            Id = Guid.NewGuid(),
            Name = tagName,
          })
          .ToList();

      var allTags = existingTags.Concat(newTags).ToList();
      var post = new Post
      {
        Id = postId,
        UserId = command.UserId,
        Title = normalizedTitle,
        Description = normalizedDescription,
        StorageUrl = storedFile.StorageUrl,
        Upvotes = 0,
        Downvotes = 0,
        CreatedAt = now,
      };

      foreach (var tag in allTags)
      {
        post.PostTags.Add(new PostTag
        {
          PostId = post.Id,
          TagId = tag.Id,
          Post = post,
          Tag = tag,
        });
      }

      await postRepository.ExecuteInTransactionAsync(async ct =>
      {
        if (newTags.Count > 0)
        {
          postRepository.AddTags(newTags);
        }

        postRepository.AddPost(post);
        await postRepository.SaveChangesAsync(ct);
      }, cancellationToken);

      return new CreatePostResult(
          CreatePostOutcome.Success,
          "Post uploaded successfully.",
          post.Id,
          post.UserId,
          post.Title,
          post.Description,
          post.StorageUrl,
          normalizedTags,
          post.CreatedAt);
    }
    catch (Exception exception)
    {
      logger.LogError(exception, "Failed to create post {PostId} for user {UserId}", postId, command.UserId);

      if (!string.IsNullOrWhiteSpace(uploadedObjectKey))
      {
        try
        {
          await postFileStorageService.DeleteFileAsync(uploadedObjectKey, CancellationToken.None);
        }
        catch (Exception cleanupException)
        {
          logger.LogWarning(cleanupException, "Failed to clean up uploaded post file {ObjectKey}", uploadedObjectKey);
        }
      }

      throw;
    }
  }

  private static bool HasPdfHeader(ReadOnlySpan<byte> fileBytes)
  {
    return fileBytes.Length >= PdfHeader.Length && fileBytes[..PdfHeader.Length].SequenceEqual(PdfHeader);
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

  private static string NormalizeTitle(string title)
  {
    return string.Join(' ', title.Split([' ', '\t', '\r', '\n'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));
  }

  private static string? NormalizeDescription(string? description)
  {
    return string.IsNullOrWhiteSpace(description) ? null : description.Trim();
  }

  private static string NormalizeContentType(string contentType)
  {
    return string.IsNullOrWhiteSpace(contentType) ? "application/pdf" : contentType.Trim();
  }

  private static IReadOnlyList<string> NormalizeTags(IEnumerable<string> tags)
  {
    return tags
        .Select(tag => tag?.Trim() ?? string.Empty)
        .Where(tag => !string.IsNullOrWhiteSpace(tag))
        .Select(CollapseWhitespace)
        .Select(tag => tag.ToLowerInvariant())
        .Distinct(StringComparer.Ordinal)
        .ToArray();
  }

  private static string CollapseWhitespace(string value)
  {
    return string.Join(' ', value.Split([' ', '\t', '\r', '\n'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));
  }
}
