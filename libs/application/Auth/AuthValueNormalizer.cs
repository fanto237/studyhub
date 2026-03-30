namespace Application.Auth;

internal static class AuthValueNormalizer
{
  public static string NormalizeEmail(string value) => value.Trim().ToLowerInvariant();

  public static string NormalizeUsername(string value) => value.Trim().ToLowerInvariant();

  public static string NormalizeUsernameOrPrivateEmail(string value) => value.Trim().ToLowerInvariant();

  public static string NormalizeFullName(string value) => value.Trim();

  public static string NormalizeUniversityName(string value) => value.Trim();

  public static string NormalizeCode(string value) => value.Trim();
}
