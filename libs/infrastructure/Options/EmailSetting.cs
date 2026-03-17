namespace Infrastructure.Options;

public class EmailSetting
{
    public const string SectionName = "EmailSetting";

    public string From { get; set; } = string.Empty;
    public string Server { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string DisplayName { get; set; } = "StudyHub";
    public int Port { get; set; } = 587;
    public bool UseSsl { get; set; } = true;
}
