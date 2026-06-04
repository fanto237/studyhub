using FluentValidation;

namespace Application.Auth.Totp.Disable;

public class DisableTotpCommandValidator : AbstractValidator<DisableTotpCommand>
{
    public DisableTotpCommandValidator()
    {
        RuleFor(command => command.UserId)
            .NotEmpty();

        RuleFor(command => command.Password)
            .NotEmpty()
            .MaximumLength(256);

        RuleFor(command => command.Code)
            .NotEmpty()
            .Length(6)
            .Matches("^[0-9]{6}$")
            .WithMessage("Enter the 6-digit authenticator code.");

        RuleFor(command => command.CurrentRefreshToken)
            .MaximumLength(1024);
    }
}
