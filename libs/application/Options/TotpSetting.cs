namespace Application.Options;

public class TotpSetting
{
    public const string SectionName = "Totp";

    public string Issuer { get; set; } = "StudyHub";
    public int SetupLifetimeMinutes { get; set; } = 10;
    public int LoginChallengeLifetimeMinutes { get; set; } = 5;
    public int MaxLoginAttempts { get; set; } = 5;

    /// <summary>
    /// Optional secret used to encrypt TOTP seeds at rest. When omitted, the JWT secret is used as a fallback key.
    /// Prefer setting this to a stable high-entropy value and rotating it with care.
    /// </summary>
    public string? SecretEncryptionKey { get; set; }
}
