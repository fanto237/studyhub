namespace Application.Auth.Abstractions;

public interface ITotpService
{
    TotpSetupSecret CreateSetup(string accountName);
    TotpVerificationResult VerifyCode(string protectedSecret, string code);
}

public record TotpSetupSecret(
    string ProtectedSecret,
    string ManualEntryKey,
    string OtpAuthUri);

public record TotpVerificationResult(
    bool IsValid,
    long? TimeStepMatched = null);
