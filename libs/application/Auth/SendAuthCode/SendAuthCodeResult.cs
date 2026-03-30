using System;

namespace Application.Auth.SendAuthCode;

public record SendAuthCodeResult(SendAuthCodeOutcome Outcome, string Message);
