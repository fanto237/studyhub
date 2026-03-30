namespace Application.Posts.Abstractions;

public interface IPostFileStorageService
{
    Task<StoredPostFile> UploadPostPdfAsync(PostFileUploadRequest request, CancellationToken cancellationToken);
    Task DeleteFileAsync(string objectKey, CancellationToken cancellationToken);
}

public record PostFileUploadRequest(
    string ObjectKey,
    string FileName,
    string ContentType,
    byte[] Content);

public record StoredPostFile(
    string ObjectKey,
    string StorageUrl);
