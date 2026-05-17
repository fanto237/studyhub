using System.Net;
using System.Net.Mail;
using Application.Abstractions.Email;
using Infrastructure.Options;
using Microsoft.Extensions.Options;

namespace Infrastructure.Email;

public class AuthEmailService(IOptions<EmailSetting> emailOptions) : IAuthEmailService
{
    private readonly EmailSetting _emailSetting = emailOptions.Value;

    public Task SendSchoolVerificationCodeAsync(
        string fullName,
        string schoolEmail,
        string code,
        DateTimeOffset expiresAt,
        CancellationToken cancellationToken = default)
    {
        var subject = "Verify your StudyHub school email";
        var htmlBody = StudyHubEmailTemplateFactory.BuildSchoolVerificationHtml(fullName, code, expiresAt);
        var plainTextBody = StudyHubEmailTemplateFactory.BuildSchoolVerificationPlainText(fullName, code, expiresAt);

        return SendEmailAsync(schoolEmail, subject, htmlBody, plainTextBody, cancellationToken);
    }

    public Task SendPasswordResetCodeAsync(
        string fullName,
        string privateEmail,
        string code,
        DateTimeOffset expiresAt,
        CancellationToken cancellationToken = default)
    {
        var subject = "Reset your StudyHub password";
        var htmlBody = StudyHubEmailTemplateFactory.BuildPasswordResetHtml(fullName, code, expiresAt);
        var plainTextBody = StudyHubEmailTemplateFactory.BuildPasswordResetPlainText(fullName, code, expiresAt);

        return SendEmailAsync(privateEmail, subject, htmlBody, plainTextBody, cancellationToken);
    }

    public Task SendWelcomeEmailAsync(
        string fullName,
        string privateEmail,
        string schoolEmail,
        CancellationToken cancellationToken = default)
    {
        var subject = "Welcome to StudyHub — your account is verified";
        var htmlBody = StudyHubEmailTemplateFactory.BuildWelcomeHtml(fullName, schoolEmail);
        var plainTextBody = StudyHubEmailTemplateFactory.BuildWelcomePlainText(fullName, schoolEmail);

        return SendEmailAsync(privateEmail, subject, htmlBody, plainTextBody, cancellationToken);
    }

    private async Task SendEmailAsync(
        string recipientEmail,
        string subject,
        string htmlBody,
        string plainTextBody,
        CancellationToken cancellationToken)
    {
        using var message = new MailMessage
        {
            From = new MailAddress(_emailSetting.From, _emailSetting.DisplayName),
            Subject = subject,
            Body = htmlBody,
            IsBodyHtml = true,
        };

        message.To.Add(new MailAddress(recipientEmail));
        message.AlternateViews.Add(AlternateView.CreateAlternateViewFromString(plainTextBody, null, "text/plain"));
        message.AlternateViews.Add(AlternateView.CreateAlternateViewFromString(htmlBody, null, "text/html"));

        using var smtpClient = new SmtpClient(_emailSetting.Server, _emailSetting.Port)
        {
            EnableSsl = _emailSetting.UseSsl,
            Credentials = new NetworkCredential(_emailSetting.Username, _emailSetting.Password),
            DeliveryMethod = SmtpDeliveryMethod.Network,
        };

        await smtpClient.SendMailAsync(message, cancellationToken);
    }
}
