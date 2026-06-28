using Application.Auth.Abstractions;
using Application.Posts.Abstractions;
using FluentValidation;

namespace Application.Users.GetCurrentUser;

public class GetCurrentUserHandler
{
    public const int DefaultLatestPostsLimit = 5;

    public static async Task<GetCurrentUserResult> Handle(
        GetCurrentUserQuery query,
        IValidator<GetCurrentUserQuery> validator,
        IAuthRepository authRepository,
        IAiMetadataGenerationQuotaService aiMetadataGenerationQuotaService,
        CancellationToken cancellationToken)
    {
        var validationResult = await validator.ValidateAsync(query, cancellationToken);
        if (!validationResult.IsValid)
        {
            return new GetCurrentUserResult(
                GetCurrentUserOutcome.InvalidRequest,
                string.Join(" ", validationResult.Errors.Select(error => error.ErrorMessage).Distinct()));
        }

        var result = await authRepository.GetCurrentUserAsync(query, DefaultLatestPostsLimit, cancellationToken);
        if (result.Outcome != GetCurrentUserOutcome.Success || result.Item is null)
        {
            return result;
        }

        var quotaStatus = await aiMetadataGenerationQuotaService.GetStatusAsync(query.UserId, cancellationToken);
        return result with
        {
            Item = result.Item with
            {
                AiMetadataGenerationUsage = new CurrentUserAiMetadataGenerationUsage(
                    quotaStatus.Limit,
                    quotaStatus.UsedToday,
                    quotaStatus.Remaining,
                    quotaStatus.ResetAt),
            },
        };
    }
}
