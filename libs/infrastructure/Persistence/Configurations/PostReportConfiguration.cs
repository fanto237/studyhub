using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class PostReportConfiguration : IEntityTypeConfiguration<PostReport>
{
    public void Configure(EntityTypeBuilder<PostReport> builder)
    {
        builder.HasKey(postReport => new { postReport.PostId, postReport.UserId });

        builder.Property(postReport => postReport.Reason)
            .HasConversion<int>()
            .IsRequired();

        builder.Property(postReport => postReport.Details)
            .HasMaxLength(2000);

        builder.Property(postReport => postReport.CreatedAt)
            .IsRequired();

        builder.HasOne(postReport => postReport.Post)
            .WithMany(post => post.Reports)
            .HasForeignKey(postReport => postReport.PostId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(postReport => postReport.User)
            .WithMany(user => user.PostReports)
            .HasForeignKey(postReport => postReport.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(postReport => postReport.UserId);
    }
}
