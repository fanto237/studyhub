using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class UserAuthCodeConfiguration : IEntityTypeConfiguration<UserAuthCode>
{
    public void Configure(EntityTypeBuilder<UserAuthCode> builder)
    {
        builder.HasKey(authCode => authCode.Id);

        builder.Property(authCode => authCode.Code)
            .HasMaxLength(6)
            .IsRequired();

        builder.Property(authCode => authCode.DeliveryAddress)
            .HasMaxLength(320)
            .IsRequired();

        builder.Property(authCode => authCode.Purpose)
            .IsRequired();

        builder.Property(authCode => authCode.ExpiresAt)
            .IsRequired();

        builder.Property(authCode => authCode.CreatedAt)
            .IsRequired();

        builder.HasOne(authCode => authCode.User)
            .WithMany(user => user.AuthCodes)
            .HasForeignKey(authCode => authCode.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(authCode => authCode.UserId);
        builder.HasIndex(authCode => new { authCode.DeliveryAddress, authCode.Purpose, authCode.Code });
    }
}
