using FluentValidation;

namespace Application.Users.UpdateCurrentUser;

public class UpdateCurrentUserCommandValidator : AbstractValidator<UpdateCurrentUserCommand>
{
    public UpdateCurrentUserCommandValidator()
    {
        RuleFor(command => command.UserId)
            .NotEmpty();

        When(command => command.Username is not null, () =>
        {
            RuleFor(command => command.Username)
                .Cascade(CascadeMode.Stop)
                .Must(value => !string.IsNullOrWhiteSpace(value))
                .WithMessage("Username is required.")
                .MinimumLength(3)
                .MaximumLength(30)
                .Matches("^[A-Za-z0-9](?:[A-Za-z0-9._-]{1,28}[A-Za-z0-9])?$")
                .WithMessage("Username can contain letters, numbers, dots, underscores, and hyphens only.");
        });

        When(command => command.FullName is not null, () =>
        {
            RuleFor(command => command.FullName)
                .Cascade(CascadeMode.Stop)
                .Must(value => !string.IsNullOrWhiteSpace(value))
                .WithMessage("Full name is required.")
                .MinimumLength(2)
                .MaximumLength(120);
        });

        When(command => command.PrivateEmail is not null, () =>
        {
            RuleFor(command => command.PrivateEmail)
                .Cascade(CascadeMode.Stop)
                .Must(value => !string.IsNullOrWhiteSpace(value))
                .WithMessage("Private email is required.")
                .EmailAddress()
                .MaximumLength(320);
        });
    }
}
