using System.Net;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace CulinaryBlog.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration config, ILogger<EmailService> logger)
    {
        _config = config;
        _logger = logger;
    }

    public Task SendEmailConfirmationAsync(string toEmail, string displayName, string confirmUrl, CancellationToken cancellationToken = default)
    {
        var subject = "Потвърдете своя имейл — Вкусни Рецепти";
        var body = $@"
            <div style=""font-family: sans-serif; max-width: 480px; margin: 0 auto;"">
                <h2>Здравейте, {WebUtility.HtmlEncode(displayName)}!</h2>
                <p>Благодарим ви, че се регистрирахте във <strong>Вкусни Рецепти</strong>.</p>
                <p>Моля, потвърдете своя имейл адрес, за да можете да публикувате рецепти:</p>
                <p style=""margin: 24px 0;"">
                    <a href=""{confirmUrl}"" style=""background:#4CAF50;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;"">
                        Потвърди имейла
                    </a>
                </p>
                <p style=""color:#888;font-size:13px;"">Ако не сте се регистрирали, просто игнорирайте този имейл.</p>
            </div>";

        return SendAsync(toEmail, subject, body, cancellationToken);
    }

    public Task SendPasswordResetAsync(string toEmail, string displayName, string resetUrl, CancellationToken cancellationToken = default)
    {
        var subject = "Възстановяване на парола — Вкусни Рецепти";
        var body = $@"
            <div style=""font-family: sans-serif; max-width: 480px; margin: 0 auto;"">
                <h2>Здравейте, {WebUtility.HtmlEncode(displayName)}!</h2>
                <p>Получихме заявка за възстановяване на паролата на вашия акаунт.</p>
                <p style=""margin: 24px 0;"">
                    <a href=""{resetUrl}"" style=""background:#2196F3;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;"">
                        Задай нова парола
                    </a>
                </p>
                <p style=""color:#888;font-size:13px;"">Линкът е валиден 1 час. Ако не сте поискали тази промяна, игнорирайте този имейл — паролата ви остава непроменена.</p>
            </div>";

        return SendAsync(toEmail, subject, body, cancellationToken);
    }

    // Универсален метод за пращане на имейли (използва се от бюлетина и други модули)
    public Task SendEmailAsync(string toEmail, string subject, string body, CancellationToken cancellationToken = default)
    {
        return SendAsync(toEmail, subject, body, cancellationToken);
    }

    private async Task SendAsync(string toEmail, string subject, string htmlBody, CancellationToken cancellationToken)
    {
        var section = _config.GetSection("Email");
        var senderName = section["SenderName"] ?? "Вкусни Рецепти";
        var senderEmail = section["SenderEmail"];
        var smtpServer = section["SmtpServer"];
        var smtpPort = int.Parse(section["SmtpPort"] ?? "587");
        var smtpLogin = section["SmtpLogin"];
        var smtpPassword = section["SmtpPassword"];

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(senderName, senderEmail));
        message.To.Add(MailboxAddress.Parse(toEmail));
        message.Subject = subject;
        message.Body = new TextPart("html") { Text = htmlBody };

        try
        {
            using var client = new SmtpClient();
            await client.ConnectAsync(smtpServer, smtpPort, SecureSocketOptions.StartTls, cancellationToken);
            await client.AuthenticateAsync(smtpLogin, smtpPassword, cancellationToken);
            await client.SendAsync(message, cancellationToken);
            await client.DisconnectAsync(true, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {ToEmail} with subject {Subject}", toEmail, subject);
        }
    }
}
