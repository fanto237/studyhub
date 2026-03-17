using System.Net;
using System.Net.Mail;
using Application.Abstractions.Email;
using Infrastructure.Options;
using Microsoft.Extensions.Options;

namespace Infrastructure.Email;

public class AuthEmailService(IOptions<EmailSetting> emailOptions) : IAuthEmailService
{
    private readonly EmailSetting _emailSetting = emailOptions.Value;

    public async Task SendSchoolVerificationCodeAsync(
        string fullName,
        string schoolEmail,
        string code,
        DateTimeOffset expiresAt,
        CancellationToken cancellationToken = default)
    {
        var subject = "Verify your StudyHub school email";
        var htmlBody = StudyHubEmailTemplateFactory.BuildSchoolVerificationHtml(fullName, code, expiresAt);
        var plainTextBody = StudyHubEmailTemplateFactory.BuildSchoolVerificationPlainText(fullName, code, expiresAt);

        using var message = new MailMessage
        {
            From = new MailAddress(_emailSetting.From, _emailSetting.DisplayName),
            Subject = subject,
            Body = htmlBody,
            IsBodyHtml = true,
        };

        message.To.Add(new MailAddress(schoolEmail));
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
