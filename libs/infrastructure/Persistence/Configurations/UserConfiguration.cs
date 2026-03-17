using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.HasKey(user => user.Id);

        builder.Property(user => user.PrivateEmail)
            .HasMaxLength(320)
            .IsRequired();

        builder.Property(user => user.SchoolEmail)
            .HasMaxLength(320);

        builder.Property(user => user.PasswordHash)
            .HasMaxLength(512)
            .IsRequired();

        builder.Property(user => user.Role)
            .IsRequired();

        builder.Property(user => user.CreatedAt)
            .IsRequired();

        builder.HasIndex(user => user.PrivateEmail)
            .IsUnique();

        builder.HasIndex(user => user.SchoolEmail)
            .IsUnique();
    }
}
