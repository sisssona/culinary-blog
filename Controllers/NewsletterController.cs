using CulinaryBlog.Data;
using CulinaryBlog.Models;
using CulinaryBlog.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CulinaryBlog.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class NewsletterController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IEmailService _emailService;

    public NewsletterController(ApplicationDbContext context, IEmailService emailService)
    {
        _context = context;
        _emailService = emailService;
    }

    [HttpPost("subscribe")]
    public async Task<IActionResult> Subscribe([FromBody] NewsletterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || !request.Email.Contains('@'))
        {
            return BadRequest(new { code = "INVALID_EMAIL", message = "Моля, въведете валиден имейл адрес." });
        }

        var existing = await _context.NewsletterSubscribers
            .FirstOrDefaultAsync(s => s.Email.ToLower() == request.Email.ToLower());

        // Подготвяме тялото на имейла за изпращане
        string unsubscribeLink = $"http://localhost:5173/unsubscribe?email={Uri.EscapeDataString(request.Email.Trim())}";
        string emailBody = $@"
            <div style='font-family: Arial, sans-serif; color: #2c2c2c;'>
                <h2>Благодарим ви, че се абонирахте за нашия кулинарен блог!</h2>
                <p>Очаквайте най-вкусните нови рецепти и вдъхновения директно във вашата поща.</p>
                <br />
                <hr style='border: none; border-top: 1px solid #e3decb;' />
                <p style='font-size: 12px; color: #786f65;'>
                    Ако повече не желаете да получавате имейли от нас, можете да се отпишете по всяко време тук: 
                    <a href='{unsubscribeLink}' style='color: #b45309;'>Отпиши ме</a>
                </p>
            </div>";

        if (existing != null)
        {
            if (!existing.IsActive)
            {
                existing.IsActive = true;
                await _context.SaveChangesAsync();

                // Изпращаме имейл и при повторно абониране
                try
                {
                    await _emailService.SendEmailAsync(
                        existing.Email,
                        "Добре дошли отново в нашия кулинарен блог",
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
            IsActive = true
        };

        _context.NewsletterSubscribers.Add(subscriber);
        await _context.SaveChangesAsync();

        try
        {
            await _emailService.SendEmailAsync(
                subscriber.Email,
                "Успешен абонамент за нашия кулинарен блог",
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
                    <p style='margin: 0 0 10px 0; color: #665c54; font-size: 14px;'>{recipe.Description}</p>
                    <a href='{recipeUrl}' style='color: #fff; background-color: #b45309; padding: 8px 14px; text-decoration: none; border-radius: 4px; font-size: 13px; display: inline-block;'>Виж рецептата</a>
                </div>";
        }

        int sentCount = 0;
        foreach (var subscriber in activeSubscribers)
        {
            string unsubscribeLink = $"{frontendBaseUrl}/unsubscribe?email={Uri.EscapeDataString(subscriber.Email)}";
            string emailBody = $@"
                <div style='font-family: Arial, sans-serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; background-color: #f7f4ed; padding: 30px; border-radius: 8px;'>
                    <h2 style='color: #1a1a1a;'>🍲 Седмичен кулинарен бюлетин</h2>
                    <p>Здравейте! Вижте нашите най-нови и вкусни предложения:</p>
                    <br />
                    {recipesHtml}
                    <br />
                    <hr style='border: none; border-top: 1px solid #e3decb;' />
                    <p style='font-size: 12px; color: #786f65;'>
                        Ако повече не желаете да получавате нашия бюлетин, можете да се отпишете тук: 
                        <a href='{unsubscribeLink}' style='color: #b45309;'>Отпиши ме</a>
                    </p>
                </div>";

            try
            {
                await _emailService.SendEmailAsync(subscriber.Email, "🍲 Нови вкусове и рецепти в нашия блог!", emailBody);
                sentCount++;
            }
            catch
            {
                // Продължаваме при грешка с отделен имейл
            }
        }

        // Маркираме рецептите като изпратени
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
}
