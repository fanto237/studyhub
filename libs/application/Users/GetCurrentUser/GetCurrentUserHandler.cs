using Application.Auth.Abstractions;
using FluentValidation;

namespace Application.Users.GetCurrentUser;

public class GetCurrentUserHandler
{
    public const int DefaultLatestPostsLimit = 5;

    public static async Task<GetCurrentUserResult> Handle(
        GetCurrentUserQuery query,
        IValidator<GetCurrentUserQuery> validator,
        IAuthRepository authRepository,
        CancellationToken cancellationToken)
    {
        var validationResult = await validator.ValidateAsync(query, cancellationToken);
        if (!validationResult.IsValid)
        {
            return new GetCurrentUserResult(
                GetCurrentUserOutcome.InvalidRequest,
                string.Join(" ", validationResult.Errors.Select(error => error.ErrorMessage).Distinct()));
        }

        return await authRepository.GetCurrentUserAsync(query, DefaultLatestPostsLimit, cancellationToken);
    }
}
