using FluentValidation;

namespace Application.Auth.Totp.StartSetup;

public class StartTotpSetupCommandValidator : AbstractValidator<StartTotpSetupCommand>
{
    public StartTotpSetupCommandValidator()
    {
        RuleFor(command => command.UserId)
            .NotEmpty();
    }
}
