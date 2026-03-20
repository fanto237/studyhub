using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class PostVoteConfiguration : IEntityTypeConfiguration<PostVote>
{
    public void Configure(EntityTypeBuilder<PostVote> builder)
    {
        builder.HasKey(postVote => new { postVote.PostId, postVote.UserId });

        builder.Property(postVote => postVote.Value)
            .HasConversion<int>()
            .IsRequired();

        builder.Property(postVote => postVote.CreatedAt)
            .IsRequired();

        builder.HasOne(postVote => postVote.Post)
            .WithMany(post => post.Votes)
            .HasForeignKey(postVote => postVote.PostId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(postVote => postVote.User)
            .WithMany(user => user.PostVotes)
            .HasForeignKey(postVote => postVote.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(postVote => postVote.UserId);
    }
}
