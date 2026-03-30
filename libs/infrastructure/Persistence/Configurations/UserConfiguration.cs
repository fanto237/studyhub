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

        builder.Property(user => user.Username)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(user => user.FullName)
            .HasMaxLength(120)
            .IsRequired();

        builder.Property(user => user.SchoolEmail)
            .HasMaxLength(320)
            .IsRequired();

        builder.Property(user => user.UniversityName)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(user => user.PasswordHash)
            .HasMaxLength(512)
            .IsRequired();

        builder.Property(user => user.Role)
            .IsRequired();

        builder.Property(user => user.CreatedAt)
            .IsRequired();

        builder.Property(user => user.DeletedAt);

        builder.HasIndex(user => user.PrivateEmail)
            .IsUnique();

        builder.HasIndex(user => user.Username)
            .IsUnique();

        builder.HasIndex(user => user.SchoolEmail)
            .IsUnique();
    }
}
