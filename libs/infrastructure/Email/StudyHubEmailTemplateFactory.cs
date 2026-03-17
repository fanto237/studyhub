namespace Infrastructure.Email;

public static class StudyHubEmailTemplateFactory
{
    public static string BuildSchoolVerificationHtml(string fullName, string code, DateTimeOffset expiresAt)
    {
        var safeName = System.Net.WebUtility.HtmlEncode(string.IsNullOrWhiteSpace(fullName) ? "there" : fullName);
        var safeCode = System.Net.WebUtility.HtmlEncode(code);
        var expirationText = System.Net.WebUtility.HtmlEncode(expiresAt.ToLocalTime().ToString("f"));

        return $$"""
<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background-color:#f4f4ff;font-family:Inter,Segoe UI,Arial,sans-serif;color:#1f1b2d;">
    <div style="padding:32px 16px;">
      <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 18px 45px rgba(74,58,255,0.12);">
        <div style="background:linear-gradient(135deg,#6d5efc 0%,#8b5cf6 55%,#38bdf8 100%);padding:40px 32px;color:#ffffff;">
          <div style="font-size:13px;letter-spacing:0.18em;text-transform:uppercase;opacity:0.88;font-weight:700;">StudyHub</div>
          <h1 style="margin:14px 0 10px;font-size:30px;line-height:1.2;font-weight:800;">Verify your school email</h1>
          <p style="margin:0;font-size:16px;line-height:1.7;max-width:460px;opacity:0.96;">
            You're one step away from unlocking your StudyHub account and joining a trusted student-only community.
          </p>
        </div>

        <div style="padding:32px;">
          <p style="margin:0 0 16px;font-size:16px;line-height:1.7;">Hi {{safeName}},</p>
          <p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#433b62;">
            Use the verification code below to confirm your school email address and activate your StudyHub account.
          </p>

          <div style="margin:0 0 24px;padding:24px;border-radius:20px;background:linear-gradient(180deg,#f8f7ff 0%,#f1efff 100%);border:1px solid #e3defe;text-align:center;">
            <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#6d5efc;font-weight:700;margin-bottom:10px;">Verification code</div>
            <div style="font-size:40px;letter-spacing:0.28em;font-weight:800;color:#241b55;">{{safeCode}}</div>
            <div style="margin-top:12px;font-size:14px;color:#625a86;">This code expires on {{expirationText}}.</div>
          </div>

          <div style="margin:0 0 24px;padding:18px 20px;border-radius:18px;background:#fcfbff;border:1px solid #ece8ff;">
            <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#241b55;">Security tip</p>
            <p style="margin:0;font-size:14px;line-height:1.7;color:#5e567e;">
              Never share this code with anyone. StudyHub will never ask for it by email, chat, or phone.
            </p>
          </div>

          <p style="margin:0 0 8px;font-size:15px;line-height:1.7;color:#433b62;">
            If you didn’t create a StudyHub account, you can safely ignore this email.
          </p>
          <p style="margin:0;font-size:15px;line-height:1.7;color:#433b62;">
            See you on StudyHub,<br />
            <span style="font-weight:700;color:#241b55;">The StudyHub Team</span>
          </p>
        </div>
      </div>
    </div>
  </body>
</html>
""";
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
}
