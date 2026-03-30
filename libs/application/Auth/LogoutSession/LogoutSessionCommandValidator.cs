using FluentValidation;

namespace Application.Auth.LogoutSession;

public class LogoutSessionCommandValidator : AbstractValidator<LogoutSessionCommand>
{
    public LogoutSessionCommandValidator()
    {
        RuleFor(command => command.RefreshToken)
            .MaximumLength(512)
            .When(command => !string.IsNullOrWhiteSpace(command.RefreshToken));
    }
}
