using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class PostTagConfiguration : IEntityTypeConfiguration<PostTag>
{
    public void Configure(EntityTypeBuilder<PostTag> builder)
    {
        builder.HasKey(postTag => new { postTag.PostId, postTag.TagId });

        builder.HasOne(postTag => postTag.Post)
            .WithMany(post => post.PostTags)
            .HasForeignKey(postTag => postTag.PostId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(postTag => postTag.Tag)
            .WithMany(tag => tag.PostTags)
            .HasForeignKey(postTag => postTag.TagId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(postTag => postTag.TagId);
    }
}
