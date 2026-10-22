using CulinaryBlog.Data;
using CulinaryBlog.Models;
using CulinaryBlog.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

namespace CulinaryBlog.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class NewsletterController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IEmailService _emailService;
    private readonly IConfiguration _config;

    public NewsletterController(ApplicationDbContext context, IEmailService emailService, IConfiguration config)
    {
        _context = context;
        _emailService = emailService;
        _config = config;
    }

    [HttpPost("subscribe")]
    public async Task<IActionResult> Subscribe([FromBody] NewsletterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || !request.Email.Contains('@'))
        {
            return BadRequest(new { code = "INVALID_EMAIL", message = "Моля, въведете валиден имейл адрес." });
        }

        string lang = !string.IsNullOrWhiteSpace(request.PreferredLanguage) ? request.PreferredLanguage : "bg";
        var frontendBaseUrl = _config["Frontend:BaseUrl"] ?? "http://localhost:5173";
        string unsubscribeLink = $"{frontendBaseUrl}/unsubscribe?email={Uri.EscapeDataString(request.Email.Trim())}";

        // Използваме динамични текстове спрямо езика (английски или български)
        var welcomeTitle = lang == "en" ? "Thank you for subscribing to our culinary blog!" : "Благодарим ви, че се абонирахте за нашия кулинарен блог!";
        var welcomeSubtitle = lang == "en" ? "Expect the most delicious new recipes and inspirations directly in your inbox." : "Очаквайте най-вкусните нови рецепти и вдъхновения директно във вашата поща.";
        var unsubscribeText = lang == "en" ? "If you no longer wish to receive emails from us, you can unsubscribe at any time here:" : "Ако повече не желаете да получавате имейли от нас, можете да се отпишете по всяко време тук:";
        var unsubscribeButton = lang == "en" ? "Unsubscribe" : "Отпиши ме";
        var welcomeSubject = lang == "en" ? "Successful subscription to our culinary blog" : "Успешен абонамент за нашия кулинарен блог";
        var welcomeBackSubject = lang == "en" ? "Welcome back to our culinary blog" : "Добре дошли отново в нашия кулинарен блог";

        string emailBody = $@"
            <div style='font-family: Arial, sans-serif; color: #2c2c2c;'>
                <h2>{welcomeTitle}</h2>
                <p>{welcomeSubtitle}</p>
                <br />
                <hr style='border: none; border-top: 1px solid #e3decb;' />
                <p style='font-size: 12px; color: #786f65;'>
                    {unsubscribeText} 
                    <a href='{unsubscribeLink}' style='color: #b45309;'>{unsubscribeButton}</a>
                </p>
            </div>";

        var existing = await _context.NewsletterSubscribers
            .FirstOrDefaultAsync(s => s.Email.ToLower() == request.Email.ToLower());

        if (existing != null)
        {
            existing.PreferredLanguage = lang; // Обновяваме езика

            if (!existing.IsActive)
            {
                existing.IsActive = true;
                await _context.SaveChangesAsync();

                try
                {
                    await _emailService.SendEmailAsync(
                        existing.Email,
                        welcomeBackSubject,
                        emailBody
                    );
                }
                catch
                {
                    // Продължаваме дори ако имейлът се забави
                }

                return Ok(new { code = "RESUBSCRIBED_SUCCESS", message = "Успяхте да се абонирате отново успешно!" });
            }
            return BadRequest(new { code = "ALREADY_SUBSCRIBED", message = "Този имейл адрес вече е абониран за бюлетина." });
        }

        var subscriber = new NewsletterSubscriber
        {
            Email = request.Email.Trim(),
            SubscribedAt = DateTime.UtcNow,
            IsActive = true,
            PreferredLanguage = lang
        };

        _context.NewsletterSubscribers.Add(subscriber);
        await _context.SaveChangesAsync();

        try
        {
            await _emailService.SendEmailAsync(
                subscriber.Email,
                welcomeSubject,
                emailBody
            );
        }
        catch
        {
            // Продължаваме дори ако имейлът се забави
        }

        return Ok(new { code = "SUBSCRIBED_SUCCESS", message = "Благодарим ви за абонамента!" });
    }

    [HttpPost("unsubscribe")]
    public async Task<IActionResult> Unsubscribe([FromBody] NewsletterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest(new { code = "INVALID_EMAIL", message = "Моля, въведете валиден имейл адрес." });
        }

        var subscriber = await _context.NewsletterSubscribers
            .FirstOrDefaultAsync(s => s.Email.ToLower() == request.Email.ToLower());

        if (subscriber == null || !subscriber.IsActive)
        {
            return BadRequest(new { code = "NOT_SUBSCRIBED", message = "Този имейл адрес не е активен абонат." });
        }

        subscriber.IsActive = false;
        await _context.SaveChangesAsync();

        return Ok(new { code = "UNSUBSCRIBED_SUCCESS", message = "Успяхте да се отпишете успешно от бюлетина." });
    }

    [HttpPost("admin/send-digest")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> SendManualDigest()
    {
        var activeSubscribers = await _context.NewsletterSubscribers
            .Where(s => s.IsActive)
            .ToListAsync();

        if (!activeSubscribers.Any())
        {
            return BadRequest(new { message = "Няма активни абонати за бюлетина." });
        }

        var newRecipes = await _context.Recipes
            .Where(r => !r.IncludedInNewsletter)
            .OrderByDescending(r => r.CreatedAt)
            .Take(5)
            .ToListAsync();

        if (!newRecipes.Any())
        {
            return BadRequest(new { message = "Няма нови неизпратени рецепти за бюлетин." });
        }

        var frontendBaseUrl = _config["Frontend:BaseUrl"] ?? "http://localhost:5173";

        string recipesHtml = "";
        foreach (var recipe in newRecipes)
        {
            string recipeUrl = $"{frontendBaseUrl}/recipes/{recipe.Id}";
            recipesHtml += $@"
                <div style='margin-bottom: 20px; padding: 15px; border: 1px solid #e3decb; border-radius: 6px; background-color: #fff;'>
                    <h3 style='margin: 0 0 8px 0; color: #b45309;'>{recipe.Title}</h3>
                    <p style='margin: 0 0 10px 0; color: #665c54; font-size: 14px;'>Категория: {recipe.Category} | Време за приготвяне: {recipe.PrepTimeMinutes + recipe.CookTimeMinutes} мин.</p>
                    <a href='{recipeUrl}' style='color: #fff; background-color: #b45309; padding: 8px 14px; text-decoration: none; border-radius: 4px; font-size: 13px; display: inline-block;'>Виж рецептата</a>
                </div>";
        }

        int sentCount = 0;
        foreach (var subscriber in activeSubscribers)
        {
            string lang = subscriber.PreferredLanguage ?? "bg";
            var texts = EmailTemplates.GetNewsletterTexts(lang);

            string unsubscribeLink = $"{frontendBaseUrl}/unsubscribe?email={Uri.EscapeDataString(subscriber.Email)}";
            string emailBody = $@"
                <div style='font-family: Arial, sans-serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; background-color: #f7f4ed; padding: 30px; border-radius: 8px;'>
                    <h2 style='color: #1a1a1a;'>{texts.Title}</h2>
                    <p>{texts.Greeting}</p>
                    <br />
                    {recipesHtml}
                    <br />
                    <hr style='border: none; border-top: 1px solid #e3decb;' />
                    <p style='font-size: 12px; color: #786f65;'>
                        {texts.Unsubscribe} 
                        <a href='{unsubscribeLink}' style='color: #b45309;'>{(lang == "en" ? "Unsubscribe" : "Отпиши ме")}</a>
                    </p>
                </div>";

            try
            {
                await _emailService.SendEmailAsync(subscriber.Email, texts.Subject, emailBody);
                sentCount++;
            }
            catch
            {
                // Продължаваме при грешка с отделен имейл
            }
        }

        foreach (var recipe in newRecipes)
        {
            recipe.IncludedInNewsletter = true;
        }
        await _context.SaveChangesAsync();

        return Ok(new { message = $"Бюлетинът беше успешно изпратен до {sentCount} абонати." });
    }
}

public class NewsletterRequest
{
    public string Email { get; set; } = string.Empty;
    public string? PreferredLanguage { get; set; }
}
