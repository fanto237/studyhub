using FluentValidation;

namespace Application.Users.GetPublicUserProfile;

public class GetPublicUserProfileQueryValidator : AbstractValidator<GetPublicUserProfileQuery>
{
    public GetPublicUserProfileQueryValidator()
    {
        RuleFor(query => query.UserId)
            .NotEmpty();
    }
}
