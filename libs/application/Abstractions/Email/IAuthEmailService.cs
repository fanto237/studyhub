namespace Application.Abstractions.Email;

public interface IAuthEmailService
{
    Task SendSchoolVerificationCodeAsync(
        string fullName,
        string schoolEmail,
        string code,
        DateTimeOffset expiresAt,
        CancellationToken cancellationToken = default);

    Task SendWelcomeEmailAsync(
        string fullName,
        string privateEmail,
        string schoolEmail,
        CancellationToken cancellationToken = default);
}
