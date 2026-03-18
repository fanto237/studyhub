using Amazon.S3;
using Amazon.S3.Model;
using Application.Posts.Abstractions;
using Infrastructure.Options;
using Microsoft.Extensions.Options;

namespace Infrastructure.Storage;

public class CloudflareR2PostFileStorageService(
    IAmazonS3 s3Client,
    IOptions<CloudflareOptions> cloudflareOptions) : IPostFileStorageService
{
  private readonly CloudflareOptions options = cloudflareOptions.Value;

  public async Task<StoredPostFile> UploadPostPdfAsync(PostFileUploadRequest request, CancellationToken cancellationToken)
  {
    await using var stream = new MemoryStream(request.Content, writable: false);

    var putObjectRequest = new PutObjectRequest
    {
      BucketName = options.BucketName,
      Key = request.ObjectKey,
      InputStream = stream,
      ContentType = request.ContentType,
      DisablePayloadSigning = true,
      DisableDefaultChecksumValidation = true,
    };

    putObjectRequest.Metadata["original-file-name"] = request.FileName;

    await s3Client.PutObjectAsync(putObjectRequest, cancellationToken);

    return new StoredPostFile(request.ObjectKey, BuildStorageUrl(request.ObjectKey));
  }

  public async Task DeleteFileAsync(string objectKey, CancellationToken cancellationToken)
  {
    await s3Client.DeleteObjectAsync(options.BucketName, objectKey, cancellationToken);
  }

  private string BuildStorageUrl(string objectKey)
  {
    var baseUrl = options.PublicBaseUrl.TrimEnd('/');

    return $"{baseUrl}/{options.BucketName}/{EncodeObjectKey(objectKey)}";
  }

  private static string EncodeObjectKey(string objectKey)
  {
    return string.Join('/', objectKey.Split('/', StringSplitOptions.RemoveEmptyEntries).Select(Uri.EscapeDataString));
  }
}
