namespace Application.Auth.Abstractions;

public interface ITotpSecretProtector
{
    string Protect(byte[] secret);
    byte[] Unprotect(string protectedSecret);
}
