namespace Application.Auth.ResetPassword;

public record ResetPasswordCommand(
  string PrivateEmail,
  string Code,
  string NewPassword);
