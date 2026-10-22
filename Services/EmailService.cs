using System.Net;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace CulinaryBlog.Services;

public static class EmailTemplates
{
    public static (string Subject, string Title, string Greeting, string ViewRecipe, string Unsubscribe) GetNewsletterTexts(string lang)
    {
        if (lang == "en")
        {
            return (
                "🍲 New flavors and recipes on our blog!",
                "🍲 Weekly Culinary Newsletter",
                "Hello! Check out our latest and most delicious recipes from the past week:",
                "View Recipe",
                "If you no longer wish to receive our newsletter, you can unsubscribe here:"
            );
        }
        else
        {
            return (
                "🍲 Нови вкусове и рецепти в нашия блог!",
                "🍲 Седмичен кулинарен бюлетин",
                "Здравейте! Вижте нашите най-нови и вкусни предложения от изминалата седмица:",
                "Виж рецептата",
                "Ако повече не желаете да получавате нашия бюлетин, можете да се отпишете тук:"
            );
        }
    }

    public static (string Subject, string Title, string Greeting, string Message, string Button, string Ignore) GetConfirmationTexts(string lang)
    {
        if (lang == "en")
        {
            return (
                "Confirm your email — Delicious Recipes",
                "Hello, {0}!",
                "Thank you for registering at Delicious Recipes.",
                "Please confirm your email address so you can publish recipes:",
                "Confirm Email",
                "If you did not register, simply ignore this email."
            );
        }
        else
        {
            return (
                "Потвърдете своя имейл — Вкусни Рецепти",
                "Здравейте, {0}!",
                "Благодарим ви, че се регистрирахте във Вкусни Рецепти.",
                "Моля, потвърдете своя имейл адрес, за да можете да публикувате рецепти:",
                "Потвърди имейла",
                "Ако не сте се регистрирали, просто игнорирайте този имейл."
            );
        }
    }
}

public class EmailService : IEmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration config, ILogger<EmailService> logger)
    {
        _config = config;
        _logger = logger;
    }

    public Task SendEmailConfirmationAsync(string toEmail, string displayName, string confirmUrl, string lang = "bg", CancellationToken cancellationToken = default)
    {
        var texts = EmailTemplates.GetConfirmationTexts(lang);
        var subject = texts.Subject;
        var body = $@"
            <div style=""font-family: sans-serif; max-width: 480px; margin: 0 auto;"">
                <h2>{string.Format(texts.Title, WebUtility.HtmlEncode(displayName))}</h2>
                <p>{texts.Greeting}</p>
                <p>{texts.Message}</p>
                <p style=""margin: 24px 0;"">
                    <a href=""{confirmUrl}"" style=""background:#4CAF50;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;"">
                        {texts.Button}
                    </a>
                </p>
                <p style=""color:#888;font-size:13px;"">{texts.Ignore}</p>
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
