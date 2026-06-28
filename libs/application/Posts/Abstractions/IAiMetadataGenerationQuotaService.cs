namespace Application.Posts.Abstractions;

public interface IAiMetadataGenerationQuotaService
{
  Task<AiMetadataGenerationQuotaConsumptionResult> TryConsumeAsync(
      Guid userId,
      CancellationToken cancellationToken = default);

  Task<AiMetadataGenerationQuotaStatus> GetStatusAsync(
      Guid userId,
      CancellationToken cancellationToken = default);
}

public sealed record AiMetadataGenerationQuotaConsumptionResult(
    bool IsAllowed,
    int Limit,
    int Remaining,
    DateTimeOffset ResetAt);

public sealed record AiMetadataGenerationQuotaStatus(
    int Limit,
    int UsedToday,
    int Remaining,
    DateTimeOffset ResetAt);
