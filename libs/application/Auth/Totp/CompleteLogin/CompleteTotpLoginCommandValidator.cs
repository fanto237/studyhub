using FluentValidation;

namespace Application.Auth.Totp.CompleteLogin;

public class CompleteTotpLoginCommandValidator : AbstractValidator<CompleteTotpLoginCommand>
{
    public CompleteTotpLoginCommandValidator()
    {
        RuleFor(command => command.ChallengeId)
            .NotEmpty();

        RuleFor(command => command.Code)
            .NotEmpty()
            .Length(6)
            .Matches("^[0-9]{6}$")
            .WithMessage("Enter the 6-digit authenticator code.");
    }
}
