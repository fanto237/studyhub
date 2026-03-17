using FluentValidation;

namespace Application.Auth.RefreshSession;

public class RefreshSessionCommandValidator : AbstractValidator<RefreshSessionCommand>
{
    public RefreshSessionCommandValidator()
    {
        RuleFor(command => command.RefreshToken)
            .NotEmpty()
            .MaximumLength(512);
    }
}
