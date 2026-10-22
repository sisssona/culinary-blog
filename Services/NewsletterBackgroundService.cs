using CulinaryBlog.Data;
using Microsoft.EntityFrameworkCore;

namespace CulinaryBlog.Services;

public class NewsletterBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<NewsletterBackgroundService> _logger;

    public NewsletterBackgroundService(IServiceScopeFactory scopeFactory, ILogger<NewsletterBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Newsletter Background Service е стартиран.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var now = DateTime.UtcNow;

                if (now.DayOfWeek == DayOfWeek.Friday && now.Hour == 17)
                {
                    using var scope = _scopeFactory.CreateScope();
                    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                    var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();
                    var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();

                    var newRecipes = await dbContext.Recipes
                        .Where(r => !r.IncludedInNewsletter)
                        .OrderByDescending(r => r.CreatedAt)
                        .Take(5)
                        .ToListAsync(stoppingToken);

                    if (newRecipes.Any())
                    {
                        var activeSubscribers = await dbContext.NewsletterSubscribers
                            .Where(s => s.IsActive)
                            .ToListAsync(stoppingToken);

                        if (activeSubscribers.Any())
                        {
                            var frontendBaseUrl = config["Frontend:BaseUrl"] ?? "http://localhost:5173";

                            foreach (var subscriber in activeSubscribers)
                            {
                                string lang = subscriber.PreferredLanguage ?? "bg";
                                var texts = EmailTemplates.GetNewsletterTexts(lang);

                                string recipesHtml = "";
                                foreach (var recipe in newRecipes)
                                {
                                    string recipeUrl = $"{frontendBaseUrl}/recipes/{recipe.Id}";
                                    recipesHtml += $@"
                                        <div style='margin-bottom: 20px; padding: 15px; border: 1px solid #e3decb; border-radius: 6px; background-color: #fff;'>
                                            <h3 style='margin: 0 0 8px 0; color: #b45309;'>{recipe.Title}</h3>
                                            <p style='margin: 0 0 10px 0; color: #665c54; font-size: 14px;'>Категория: {recipe.Category} | Време: {recipe.PrepTimeMinutes + recipe.CookTimeMinutes} мин.</p>
                                            <a href='{recipeUrl}' style='color: #fff; background-color: #b45309; padding: 8px 14px; text-decoration: none; border-radius: 4px; font-size: 13px; display: inline-block;'>{texts.ViewRecipe}</a>
                                        </div>";
                                }

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
                                    await emailService.SendEmailAsync(subscriber.Email, texts.Subject, emailBody);
                                }
                                catch
                                {
                                    // Прескачаме при грешка с отделен имейл
                                }
                            }

                            foreach (var recipe in newRecipes)
                            {
                                recipe.IncludedInNewsletter = true;
                            }
                            await dbContext.SaveChangesAsync(stoppingToken);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Грешка при фоновото изпращане на бюлетин.");
            }

            await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
        }
    }
}
