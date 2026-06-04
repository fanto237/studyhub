using System.Security.Cryptography;
using System.Text.RegularExpressions;
using Application.Auth.Abstractions;
using Application.Options;
using Microsoft.Extensions.Options;
using OtpNet;

namespace Infrastructure.Auth;

public partial class TotpService(
    ITotpSecretProtector secretProtector,
    IOptions<TotpSetting> totpSettingOptions) : ITotpService
{
  private const int Digits = 6;
  private const int Period = 30;

  public TotpSetupSecret CreateSetup(string accountName)
  {
    var secret = KeyGeneration.GenerateRandomKey(OtpHashMode.Sha1);
    var manualEntryKey = Base32Encoding.ToString(secret).TrimEnd('=');
    var otpAuthUri = new OtpUri(
        OtpType.Totp,
        secret,
        accountName,
        totpSettingOptions.Value.Issuer,
        OtpHashMode.Sha1,
        Digits,
        Period).ToString();

    return new TotpSetupSecret(
        secretProtector.Protect(secret),
        manualEntryKey,
        otpAuthUri);
  }

  public TotpVerificationResult VerifyCode(string protectedSecret, string code)
  {
    var normalizedCode = code.Trim();
    if (!TotpCodeRegex().IsMatch(normalizedCode))
    {
      return new TotpVerificationResult(false);
    }

    try
    {
      var secret = secretProtector.Unprotect(protectedSecret);
      var totp = new Totp(secret, Period, OtpHashMode.Sha1, Digits);
      var isValid = totp.VerifyTotp(
          normalizedCode,
          out var timeStepMatched,
          VerificationWindow.RfcSpecifiedNetworkDelay);

      return new TotpVerificationResult(isValid, isValid ? timeStepMatched : null);
    }
    catch (Exception exception) when (exception is CryptographicException or FormatException or ArgumentException)
    {
      return new TotpVerificationResult(false);
    }
  }

  [GeneratedRegex("^[0-9]{6}$")]
  private static partial Regex TotpCodeRegex();
}
