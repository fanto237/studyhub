using FluentValidation;

namespace Application.Auth.ResetPassword;

public class ResetPasswordCommandValidator : AbstractValidator<ResetPasswordCommand>
{
  public ResetPasswordCommandValidator()
  {
    RuleFor(command => command.PrivateEmail)
      .NotEmpty()
      .EmailAddress()
      .MaximumLength(320);

    RuleFor(command => command.Code)
      .NotEmpty()
      .Length(6)
      .Matches("^\\d{6}$")
      .WithMessage("Code must be exactly 6 numeric digits.");

    RuleFor(command => command.NewPassword)
      .NotEmpty()
      .MinimumLength(8)
      .MaximumLength(256);
  }
}
