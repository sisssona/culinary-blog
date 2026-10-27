namespace CulinaryBlog.Services;

public interface IEmailService
{
    Task SendEmailConfirmationAsync(string toEmail, string displayName, string confirmUrl, string lang = "bg", CancellationToken cancellationToken = default);
    Task SendPasswordResetAsync(string toEmail, string displayName, string resetUrl, string lang = "bg", CancellationToken cancellationToken = default);
    Task SendEmailAsync(string toEmail, string subject, string body, CancellationToken cancellationToken = default);
}
