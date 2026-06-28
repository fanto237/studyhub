using System.Net;

namespace Infrastructure.Email;

public static class StudyHubEmailTemplateFactory
{
    private const string AppUrl = "https://studyhubz.net";

    public static string BuildSchoolVerificationHtml(string fullName, string code, DateTimeOffset expiresAt)
    {
        var safeName = Encode(string.IsNullOrWhiteSpace(fullName) ? "there" : fullName);
        var safeCode = Encode(code);
        var expirationText = Encode(expiresAt.ToLocalTime().ToString("f"));

        var body = $$"""
          {{BuildGreeting(safeName)}}
          <p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#475569;">
            Use the verification code below to confirm your school email address and activate your StudyHub account.
          </p>
          {{BuildCodeCard("Verification code", safeCode, expirationText)}}
          {{BuildInfoCard(
              "Security tip",
              "Never share this code with anyone. StudyHub will never ask for it by email, chat, or phone.",
              "#eff6ff",
              "#bfdbfe")}}
          <p style="margin:0 0 8px;font-size:15px;line-height:1.7;color:#475569;">
            If you didn’t create a StudyHub account, you can safely ignore this email.
          </p>
          {{BuildSignature()}}
""";

        return BuildLayout(
            "Verify your school email",
            "Unlock your StudyHub account and join a trusted student-only study community.",
            "Account verification",
            body);
    }

    public static string BuildSchoolVerificationPlainText(string fullName, string code, DateTimeOffset expiresAt)
    {
        var greetingName = string.IsNullOrWhiteSpace(fullName) ? "there" : fullName.Trim();

        return $"""
Hi {greetingName},

Welcome to StudyHub.

Use this verification code to confirm your school email address:

{code}

This code expires on {expiresAt.ToLocalTime():f}.

If you didn't create a StudyHub account, you can ignore this email.

- The StudyHub Team
""";
    }

    public static string BuildPasswordResetHtml(string fullName, string code, DateTimeOffset expiresAt)
    {
        var safeName = Encode(string.IsNullOrWhiteSpace(fullName) ? "there" : fullName);
        var safeCode = Encode(code);
        var expirationText = Encode(expiresAt.ToLocalTime().ToString("f"));

        var body = $$"""
          {{BuildGreeting(safeName)}}
          <p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#475569;">
            We received a request to reset your StudyHub password. Enter the code below on the password reset screen to continue.
          </p>
          {{BuildCodeCard("Password reset code", safeCode, expirationText)}}
          {{BuildInfoCard(
              "Security tip",
              "If you didn't request this code, you can ignore this email. Your password won't change unless this code is entered with a new password.",
              "#fff1f2",
              "#fecdd3")}}
          {{BuildSignature()}}
""";

        return BuildLayout(
            "Reset your password",
            "Use this one-time code to choose a new StudyHub password. The code expires soon for your security.",
            "Password recovery",
            body);
    }

    public static string BuildPasswordResetPlainText(string fullName, string code, DateTimeOffset expiresAt)
    {
        var greetingName = string.IsNullOrWhiteSpace(fullName) ? "there" : fullName.Trim();

        return $"""
Hi {greetingName},

We received a request to reset your StudyHub password.

Use this password reset code to continue:

{code}

This code expires on {expiresAt.ToLocalTime():f}.

If you didn't request this code, you can ignore this email. Your password won't change unless this code is entered with a new password.

- The StudyHub Team
""";
    }

    public static string BuildWelcomeHtml(string fullName, string schoolEmail)
    {
        var safeName = Encode(string.IsNullOrWhiteSpace(fullName) ? "there" : fullName);
        var safeSchoolEmail = Encode(schoolEmail);
        var safeAppUrl = Encode(AppUrl);

        var body = $$"""
          {{BuildGreeting(safeName)}}
          <p style="margin:0 0 18px;font-size:16px;line-height:1.7;color:#475569;">
            Your school email has been verified successfully, so your StudyHub account is now fully active.
          </p>
          <p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#475569;">
            StudyHub is built to help you quickly find useful past exams, revise with more confidence, and give back by sharing resources with other students.
          </p>
          <div style="margin:0 0 24px;padding:20px;border-radius:18px;background:#f0fdfa;border:1px solid #99f6e4;">
            <div style="display:inline-block;margin:0 0 10px;padding:6px 10px;border-radius:999px;background:#ccfbf1;color:#0f766e;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;font-weight:800;">
              Verified school email
            </div>
            <div style="font-size:18px;line-height:1.6;font-weight:800;color:#0f172a;word-break:break-word;">{{safeSchoolEmail}}</div>
          </div>
          <div style="margin:0 0 26px;text-align:center;">
            <a href="{{safeAppUrl}}" style="display:inline-block;padding:14px 28px;border-radius:999px;background:#2563eb;color:#ffffff;text-decoration:none;font-size:15px;font-weight:800;letter-spacing:0.01em;box-shadow:0 12px 28px rgba(37,99,235,0.22);">
              Open StudyHub
            </a>
            <p style="margin:12px 0 0;font-size:13px;line-height:1.6;color:#64748b;">
              Or copy and paste this link into your browser:<br />
              <span style="color:#2563eb;font-weight:700;word-break:break-all;">{{safeAppUrl}}</span>
            </p>
          </div>
          <div style="margin:0 0 24px;padding:20px;border-radius:18px;background:#ffffff;border:1px solid #e2e8f0;box-shadow:0 8px 22px rgba(15,23,42,0.04);">
            <div style="margin:0 0 12px;font-size:14px;font-weight:800;color:#0f172a;">A great way to get started</div>
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
              <tr>
                <td style="padding:0 0 10px;width:28px;vertical-align:top;color:#2563eb;font-weight:800;">01</td>
                <td style="padding:0 0 10px;color:#475569;font-size:14px;line-height:1.7;">Search for your course, subject, or exam topic.</td>
              </tr>
              <tr>
                <td style="padding:0 0 10px;width:28px;vertical-align:top;color:#db2777;font-weight:800;">02</td>
                <td style="padding:0 0 10px;color:#475569;font-size:14px;line-height:1.7;">Explore recent uploads and highly rated materials.</td>
              </tr>
              <tr>
                <td style="padding:0;width:28px;vertical-align:top;color:#0d9488;font-weight:800;">03</td>
                <td style="padding:0;color:#475569;font-size:14px;line-height:1.7;">Upload a past exam to help other students and grow the community.</td>
              </tr>
            </table>
          </div>
          {{BuildInfoCard(
              "Why StudyHub exists",
              "Finding quality exam prep material should feel easy, not frustrating. We're building StudyHub to make exam discovery more organized, more useful, and more community-driven.",
              "#f8fafc",
              "#e2e8f0")}}
          <p style="margin:0 0 8px;font-size:15px;line-height:1.7;color:#475569;">
            Thanks for joining us — we're excited to have you here.
          </p>
          {{BuildSignature()}}
""";

        return BuildLayout(
            "You're in — welcome to StudyHub",
            "Your account is verified and ready. Start discovering past exams, finding the right material faster, and contributing to a student-powered community.",
            "Account verified",
            body);
    }

    public static string BuildWelcomePlainText(string fullName, string schoolEmail)
    {
        var greetingName = string.IsNullOrWhiteSpace(fullName) ? "there" : fullName.Trim();

        return $"""
Hi {greetingName},

You're in — welcome to StudyHub.

Your school email has been verified successfully, so your account is now fully active.

Verified school email: {schoolEmail}

Get started here: {AppUrl}

A great way to begin:
- Search for your course, subject, or exam topic.
- Explore recent uploads and highly rated materials.
- Upload a past exam to help other students and grow the community.

StudyHub is built to help students discover useful past exams faster and study with more confidence.

Thanks for joining us.

- The StudyHub Team
""";
    }

    private static string BuildLayout(string title, string subtitle, string badge, string bodyHtml)
    {
        var safeTitle = Encode(title);
        var safeSubtitle = Encode(subtitle);
        var safeBadge = Encode(badge);

        return $$"""
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <title>{{safeTitle}}</title>
  </head>
  <body style="margin:0;padding:0;background:#f8fafc;color:#0f172a;font-family:Inter,Segoe UI,Roboto,Arial,sans-serif;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;background:#f8fafc;">
      <tr>
        <td align="center" style="padding:36px 16px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:separate;border-spacing:0;max-width:640px;overflow:hidden;background:#ffffff;border:1px solid #e2e8f0;border-radius:28px;box-shadow:0 24px 60px rgba(15,23,42,0.10);">
            <tr>
              <td style="padding:0;background:#ffffff;">
                <div style="padding:28px 28px 0;background:#ffffff;">
                  {{BuildBrandHeader()}}
                </div>
                <div style="margin:0 28px;padding:30px 28px;border-radius:24px;background:#2563eb;background-image:radial-gradient(circle at 12% 10%,rgba(45,212,191,0.55) 0,rgba(45,212,191,0) 32%),radial-gradient(circle at 88% 8%,rgba(236,72,153,0.44) 0,rgba(236,72,153,0) 30%),linear-gradient(135deg,#2563eb 0%,#4f46e5 54%,#7c3aed 100%);color:#ffffff;">
                  <div style="display:inline-block;margin:0 0 14px;padding:7px 12px;border-radius:999px;background:rgba(255,255,255,0.16);border:1px solid rgba(255,255,255,0.30);color:#eff6ff;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;font-weight:800;">
                    {{safeBadge}}
                  </div>
                  <h1 style="margin:0 0 12px;font-size:32px;line-height:1.18;font-weight:900;letter-spacing:-0.03em;color:#ffffff;">{{safeTitle}}</h1>
                  <p style="margin:0;font-size:16px;line-height:1.7;max-width:500px;color:#dbeafe;">{{safeSubtitle}}</p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:30px 28px 10px;background:#ffffff;">
{{bodyHtml}}
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 28px;background:#ffffff;">
                {{BuildFooter()}}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
""";
    }

    private static string BuildBrandHeader()
    {
        return """
                  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;margin:0 0 22px;">
                    <tr>
                      <td style="vertical-align:middle;">
                        <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                          <tr>
                            <td style="width:48px;height:48px;border-radius:16px;background:#eff6ff;border:1px solid #bfdbfe;text-align:center;vertical-align:middle;">
                              <div style="display:inline-block;width:24px;height:30px;border-radius:7px;background:#ffffff;border:2px solid #2563eb;box-shadow:0 7px 14px rgba(37,99,235,0.18);vertical-align:middle;">
                                <div style="height:4px;margin:7px 5px 0;border-radius:999px;background:#2dd4bf;"></div>
                                <div style="height:4px;margin:5px 5px 0;border-radius:999px;background:#60a5fa;"></div>
                                <div style="height:4px;margin:5px 9px 0 5px;border-radius:999px;background:#f472b6;"></div>
                              </div>
                            </td>
                            <td style="padding-left:12px;vertical-align:middle;">
                              <div style="font-size:20px;line-height:1.1;font-weight:900;letter-spacing:-0.03em;color:#0f172a;">StudyHub</div>
                              <div style="margin-top:4px;font-size:12px;line-height:1.2;color:#64748b;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Student knowledge base</div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
""";
    }

    private static string BuildGreeting(string safeName)
    {
        return $$"""
          <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#0f172a;">Hi {{safeName}},</p>
""";
    }

    private static string BuildCodeCard(string label, string safeCode, string expirationText)
    {
        var safeLabel = Encode(label);

        return $$"""
          <div style="margin:0 0 24px;padding:22px;border-radius:22px;background:#f8fafc;background-image:radial-gradient(circle at top left,rgba(45,212,191,0.18),rgba(45,212,191,0) 36%),radial-gradient(circle at bottom right,rgba(219,39,119,0.14),rgba(219,39,119,0) 34%);border:1px solid #e2e8f0;text-align:center;">
            <div style="display:inline-block;margin:0 0 12px;padding:6px 10px;border-radius:999px;background:#dbeafe;color:#1d4ed8;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;font-weight:800;">{{safeLabel}}</div>
            <div style="padding:16px 12px;border-radius:16px;background:#ffffff;border:1px dashed #93c5fd;color:#0f172a;font-size:40px;line-height:1.1;letter-spacing:0.24em;font-family:SFMono-Regular,Consolas,Liberation Mono,Menlo,monospace;font-weight:900;">{{safeCode}}</div>
            <div style="margin-top:12px;font-size:14px;line-height:1.6;color:#64748b;">This code expires on <span style="font-weight:700;color:#334155;">{{expirationText}}</span>.</div>
          </div>
""";
    }

    private static string BuildInfoCard(string title, string text, string backgroundColor, string borderColor)
    {
        var safeTitle = Encode(title);
        var safeText = Encode(text);
        var safeBackgroundColor = Encode(backgroundColor);
        var safeBorderColor = Encode(borderColor);

        return $$"""
          <div style="margin:0 0 24px;padding:18px 20px;border-radius:18px;background:{{safeBackgroundColor}};border:1px solid {{safeBorderColor}};">
            <p style="margin:0 0 8px;font-size:14px;font-weight:800;color:#0f172a;">{{safeTitle}}</p>
            <p style="margin:0;font-size:14px;line-height:1.7;color:#475569;">{{safeText}}</p>
          </div>
""";
    }

    private static string BuildSignature()
    {
        return """
          <p style="margin:0;font-size:15px;line-height:1.7;color:#475569;">
            See you on StudyHub,<br />
            <span style="font-weight:800;color:#0f172a;">The StudyHub Team</span>
          </p>
""";
    }

    private static string BuildFooter()
    {
        return """
                <div style="height:1px;background:#e2e8f0;margin:4px 0 18px;"></div>
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
                  <tr>
                    <td style="font-size:12px;line-height:1.7;color:#64748b;">
                      StudyHub helps students discover, organize, and share study resources with their campus community.
                    </td>
                    <td align="right" style="font-size:12px;line-height:1.7;color:#94a3b8;white-space:nowrap;padding-left:16px;">
                      © StudyHub
                    </td>
                  </tr>
                </table>
""";
    }

    private static string Encode(string value) => WebUtility.HtmlEncode(value);
}
