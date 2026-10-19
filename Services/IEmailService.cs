namespace CulinaryBlog.Services;

public interface IEmailService
{
    Task SendEmailConfirmationAsync(string toEmail, string displayName, string confirmUrl, CancellationToken cancellationToken = default);
    Task SendPasswordResetAsync(string toEmail, string displayName, string resetUrl, CancellationToken cancellationToken = default);
}
