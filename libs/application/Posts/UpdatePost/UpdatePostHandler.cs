using Application.Posts;
using Application.Posts.Abstractions;
using Application.Posts.GetPost;
using Domain.Entities;
using Domain.Enums;
using FluentValidation;

namespace Application.Posts.UpdatePost;

public class UpdatePostHandler
{
    public static async Task<UpdatePostResult> Handle(
        UpdatePostCommand command,
        IValidator<UpdatePostCommand> validator,
        IPostRepository postRepository,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        var validationResult = await validator.ValidateAsync(command, cancellationToken);
        if (!validationResult.IsValid)
        {
            return new UpdatePostResult(
                UpdatePostOutcome.InvalidRequest,
                string.Join(" ", validationResult.Errors.Select(error => error.ErrorMessage).Distinct()));
        }

        var post = await postRepository.GetPostForUpdateAsync(command.PostId, cancellationToken);
        if (post is null || post.DeletedAt is not null || post.IsHidden)
        {
            return new UpdatePostResult(
                UpdatePostOutcome.NotFound,
                "The requested post was not found.");
        }

        var canEdit = post.UserId == command.ActorUserId
            || command.ActorRole is UserRole.Admin or UserRole.Moderator;

        if (!canEdit)
        {
            return new UpdatePostResult(
                UpdatePostOutcome.Forbidden,
                "You are not allowed to edit this post.");
        }

        var normalizedTitle = PostMetadataNormalizer.NormalizeTitle(command.Title!);
        var normalizedDescription = PostMetadataNormalizer.NormalizeDescription(command.Description);
        var normalizedTags = PostMetadataNormalizer.NormalizeTags(command.Tags);
        var existingTags = await postRepository.GetTagsByNamesAsync(normalizedTags, cancellationToken);
        var existingTagLookup = existingTags.ToDictionary(tag => tag.Name, StringComparer.Ordinal);
        var newTags = normalizedTags
            .Where(tagName => !existingTagLookup.ContainsKey(tagName))
            .Select(tagName => new Tag
            {
                Id = Guid.NewGuid(),
                Name = tagName,
            })
            .ToList();

        var allTags = existingTags.Concat(newTags).ToList();
        var desiredTagIds = allTags.Select(tag => tag.Id).ToHashSet();
        var existingPostTags = post.PostTags.ToList();
        var postTagsToRemove = existingPostTags
            .Where(postTag => !desiredTagIds.Contains(postTag.TagId))
            .ToList();
        var existingTagIds = existingPostTags.Select(postTag => postTag.TagId).ToHashSet();
        var postTagsToAdd = allTags
            .Where(tag => !existingTagIds.Contains(tag.Id))
            .Select(tag => new PostTag
            {
                PostId = post.Id,
                TagId = tag.Id,
                Post = post,
                Tag = tag,
            })
            .ToList();

        post.Title = normalizedTitle;
        post.Description = normalizedDescription;
        post.UpdatedAt = timeProvider.GetUtcNow();

        if (newTags.Count > 0)
        {
            postRepository.AddTags(newTags);
        }

        if (postTagsToRemove.Count > 0)
        {
            postRepository.RemovePostTags(postTagsToRemove);
        }

        foreach (var postTag in postTagsToAdd)
        {
            post.PostTags.Add(postTag);
        }

        await postRepository.SaveChangesAsync(cancellationToken);

        var getPostResult = await postRepository.GetPostAsync(new GetPostQuery(post.Id), cancellationToken);
        if (getPostResult.Outcome != GetPostOutcome.Success || getPostResult.Item is null)
        {
            return new UpdatePostResult(
                UpdatePostOutcome.NotFound,
                "The requested post was not found.");
        }

        return new UpdatePostResult(
            UpdatePostOutcome.Success,
            "Post updated successfully.",
            getPostResult.Item);
    }
}
