using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class UserAiMetadataGenerationUsageConfiguration : IEntityTypeConfiguration<UserAiMetadataGenerationUsage>
{
  public void Configure(EntityTypeBuilder<UserAiMetadataGenerationUsage> builder)
  {
    builder.HasKey(usage => new { usage.UserId, usage.UsageDate });

    builder.Property(usage => usage.UsageDate)
        .HasColumnType("date")
        .IsRequired();

    builder.Property(usage => usage.GenerationCount)
        .IsRequired();

    builder.Property(usage => usage.CreatedAt)
        .IsRequired();

    builder.Property(usage => usage.UpdatedAt)
        .IsRequired();

    builder.HasOne(usage => usage.User)
        .WithMany(user => user.AiMetadataGenerationUsages)
        .HasForeignKey(usage => usage.UserId)
        .OnDelete(DeleteBehavior.Cascade);
  }
}
