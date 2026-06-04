using FluentValidation;

namespace Application.Auth.Totp.Enable;

public class EnableTotpCommandValidator : AbstractValidator<EnableTotpCommand>
{
    public EnableTotpCommandValidator()
    {
        RuleFor(command => command.UserId)
            .NotEmpty();

        RuleFor(command => command.Code)
            .NotEmpty()
            .Length(6)
            .Matches("^[0-9]{6}$")
            .WithMessage("Enter the 6-digit authenticator code.");

        RuleFor(command => command.CurrentRefreshToken)
            .MaximumLength(1024);
    }
}
