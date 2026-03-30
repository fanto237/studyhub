using System;
using FluentValidation;

namespace Application.Auth.SendAuthCode;

public class SendAuthCodeCommandValidator : AbstractValidator<SendAuthCodeCommand>
{
  public SendAuthCodeCommandValidator()
  {
    RuleFor(command => command.SchoolEmail)
      .NotEmpty()
      .EmailAddress()
      .MaximumLength(320);
  }
}
