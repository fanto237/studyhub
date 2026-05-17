using FluentValidation;

namespace Application.Auth.RequestPasswordReset;

public class RequestPasswordResetCommandValidator : AbstractValidator<RequestPasswordResetCommand>
{
  public RequestPasswordResetCommandValidator()
  {
    RuleFor(command => command.PrivateEmail)
      .NotEmpty()
      .EmailAddress()
      .MaximumLength(320);
  }
}
