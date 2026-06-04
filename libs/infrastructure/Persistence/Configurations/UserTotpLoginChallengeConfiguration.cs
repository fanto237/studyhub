using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class UserTotpLoginChallengeConfiguration : IEntityTypeConfiguration<UserTotpLoginChallenge>
{
    public void Configure(EntityTypeBuilder<UserTotpLoginChallenge> builder)
    {
        builder.HasKey(challenge => challenge.Id);

        builder.Property(challenge => challenge.CreatedAt)
            .IsRequired();

        builder.Property(challenge => challenge.ExpiresAt)
            .IsRequired();

        builder.Property(challenge => challenge.FailedAttempts)
            .HasDefaultValue(0)
            .IsRequired();

        builder.HasOne(challenge => challenge.User)
            .WithMany(user => user.TotpLoginChallenges)
            .HasForeignKey(challenge => challenge.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(challenge => challenge.UserId);
        builder.HasIndex(challenge => challenge.ExpiresAt);
    }
}
