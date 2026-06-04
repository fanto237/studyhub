using System.Security.Cryptography;
using System.Text;
using Application.Auth.Abstractions;
using Application.Options;
using Microsoft.Extensions.Options;

namespace Infrastructure.Auth;

public class TotpSecretProtector(
    IOptions<TotpSetting> totpSettingOptions,
    IOptions<JwtSetting> jwtSettingOptions) : ITotpSecretProtector
{
    private const string Version = "v1";
    private const int NonceSize = 12;
    private const int TagSize = 16;

    public string Protect(byte[] secret)
    {
        ArgumentNullException.ThrowIfNull(secret);

        var nonce = RandomNumberGenerator.GetBytes(NonceSize);
        var ciphertext = new byte[secret.Length];
        var tag = new byte[TagSize];

        using var aes = new AesGcm(GetEncryptionKey(), TagSize);
        aes.Encrypt(nonce, secret, ciphertext, tag);

        return string.Join(
            '.',
            Version,
            Convert.ToBase64String(nonce),
            Convert.ToBase64String(ciphertext),
            Convert.ToBase64String(tag));
    }

    public byte[] Unprotect(string protectedSecret)
    {
        if (string.IsNullOrWhiteSpace(protectedSecret))
        {
            throw new ArgumentException("A protected TOTP secret is required.", nameof(protectedSecret));
        }

        var parts = protectedSecret.Split('.', 4);
        if (parts.Length != 4 || parts[0] != Version)
        {
            throw new FormatException("The protected TOTP secret format is invalid.");
        }

        var nonce = Convert.FromBase64String(parts[1]);
        var ciphertext = Convert.FromBase64String(parts[2]);
        var tag = Convert.FromBase64String(parts[3]);
        var plaintext = new byte[ciphertext.Length];

        using var aes = new AesGcm(GetEncryptionKey(), TagSize);
        aes.Decrypt(nonce, ciphertext, tag, plaintext);

        return plaintext;
    }

    private byte[] GetEncryptionKey()
    {
        var configuredKey = totpSettingOptions.Value.SecretEncryptionKey;
        var keyMaterial = !string.IsNullOrWhiteSpace(configuredKey)
            ? configuredKey.Trim()
            : jwtSettingOptions.Value.Secret;

        if (TryDecodeAes256Key(keyMaterial, out var decodedKey))
        {
            return decodedKey;
        }

        return SHA256.HashData(Encoding.UTF8.GetBytes(keyMaterial));
    }

    private static bool TryDecodeAes256Key(string value, out byte[] key)
    {
        try
        {
            key = Convert.FromBase64String(value);
            return key.Length == 32;
        }
        catch (FormatException)
        {
            key = [];
            return false;
        }
    }
}
