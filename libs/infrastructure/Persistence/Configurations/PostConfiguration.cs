using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class PostConfiguration : IEntityTypeConfiguration<Post>
{
    public void Configure(EntityTypeBuilder<Post> builder)
    {
        builder.HasKey(post => post.Id);

        builder.Property(post => post.Title)
            .HasMaxLength(256)
            .IsRequired();

        builder.Property(post => post.Description)
            .HasMaxLength(4000);

        builder.Property(post => post.StorageUrl)
            .HasMaxLength(2048)
            .IsRequired();

        builder.Property(post => post.IsHidden)
            .HasDefaultValue(false)
            .IsRequired();

        builder.Property(post => post.ReportCount)
            .HasDefaultValue(0)
            .IsRequired();

        builder.Property(post => post.DeletedAt);

        builder.Property(post => post.CreatedAt)
            .IsRequired();

        builder.HasOne(post => post.User)
            .WithMany(user => user.Posts)
            .HasForeignKey(post => post.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(post => post.UserId);
        builder.HasIndex(post => new { post.IsHidden, post.DeletedAt });
    }
}
