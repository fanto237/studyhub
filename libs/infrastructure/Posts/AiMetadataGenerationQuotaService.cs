using System.Data;
using Application.Posts.Abstractions;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Posts;

public class AiMetadataGenerationQuotaService(
    StudyHubDbContext dbContext,
    TimeProvider timeProvider) : IAiMetadataGenerationQuotaService
{
  private const int DailyLimit = 5;

  public async Task<AiMetadataGenerationQuotaConsumptionResult> TryConsumeAsync(
      Guid userId,
      CancellationToken cancellationToken = default)
  {
    var now = timeProvider.GetUtcNow();
    var usageDate = DateOnly.FromDateTime(now.UtcDateTime);
    var resetAt = CalculateResetAt(usageDate);

    var connection = dbContext.Database.GetDbConnection();
    var wasClosed = connection.State == ConnectionState.Closed;

    if (wasClosed)
    {
      await dbContext.Database.OpenConnectionAsync(cancellationToken);
    }

    try
    {
      await using var command = connection.CreateCommand();
      command.CommandText = """
          INSERT INTO "UserAiMetadataGenerationUsages" ("UserId", "UsageDate", "GenerationCount", "CreatedAt", "UpdatedAt")
          VALUES (@userId, @usageDate, 1, @now, @now)
          ON CONFLICT ("UserId", "UsageDate") DO UPDATE
          SET "GenerationCount" = "UserAiMetadataGenerationUsages"."GenerationCount" + 1,
              "UpdatedAt" = EXCLUDED."UpdatedAt"
          WHERE "UserAiMetadataGenerationUsages"."GenerationCount" < @limit
          RETURNING "GenerationCount";
          """;

      AddParameter(command, "userId", userId);
      AddParameter(command, "usageDate", usageDate);
      AddParameter(command, "now", now);
      AddParameter(command, "limit", DailyLimit);

      var scalar = await command.ExecuteScalarAsync(cancellationToken);
      if (scalar is null or DBNull)
      {
        return new AiMetadataGenerationQuotaConsumptionResult(false, DailyLimit, 0, resetAt);
      }

      var consumedCount = Convert.ToInt32(scalar);
      return new AiMetadataGenerationQuotaConsumptionResult(
          true,
          DailyLimit,
          Math.Max(DailyLimit - consumedCount, 0),
          resetAt);
    }
    finally
    {
      if (wasClosed)
      {
        await dbContext.Database.CloseConnectionAsync();
      }
    }
  }

  public async Task<AiMetadataGenerationQuotaStatus> GetStatusAsync(
      Guid userId,
      CancellationToken cancellationToken = default)
  {
    var usageDate = DateOnly.FromDateTime(timeProvider.GetUtcNow().UtcDateTime);
    var usedToday = await dbContext.UserAiMetadataGenerationUsages
        .AsNoTracking()
        .Where(usage => usage.UserId == userId && usage.UsageDate == usageDate)
        .Select(usage => usage.GenerationCount)
        .FirstOrDefaultAsync(cancellationToken);

    return new AiMetadataGenerationQuotaStatus(
        DailyLimit,
        usedToday,
        Math.Max(DailyLimit - usedToday, 0),
        CalculateResetAt(usageDate));
  }

  private static DateTimeOffset CalculateResetAt(DateOnly usageDate)
  {
    return new DateTimeOffset(
        usageDate.AddDays(1).ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc));
  }

  private static void AddParameter(System.Data.Common.DbCommand command, string name, object value)
  {
    var parameter = command.CreateParameter();
    parameter.ParameterName = name;
    parameter.Value = value;
    command.Parameters.Add(parameter);
  }
}
