using Application.Auth.Abstractions;
using FluentValidation;

namespace Application.Users.GetPublicUserProfile;

public class GetPublicUserProfileHandler
{
    public const int DefaultLatestPostsLimit = 5;

    public static async Task<GetPublicUserProfileResult> Handle(
        GetPublicUserProfileQuery query,
        IValidator<GetPublicUserProfileQuery> validator,
        IAuthRepository authRepository,
        CancellationToken cancellationToken)
    {
        var validationResult = await validator.ValidateAsync(query, cancellationToken);
        if (!validationResult.IsValid)
        {
            return new GetPublicUserProfileResult(
                GetPublicUserProfileOutcome.InvalidRequest,
                string.Join(" ", validationResult.Errors.Select(error => error.ErrorMessage).Distinct()));
        }

        return await authRepository.GetPublicUserProfileAsync(query, DefaultLatestPostsLimit, cancellationToken);
    }
}
