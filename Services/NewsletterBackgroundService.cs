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
                // Проверяваме дали е време за изпращане (например всеки петък в 17:00 ч.)
                // За тестови цели можеш да промениш интервала, но по подразбиране проверяваме на всеки 24 часа или седмично
                var now = DateTime.UtcNow;

                // Примерно условие: Петък между 17:00 и 18:00 UTC
                if (now.DayOfWeek == DayOfWeek.Friday && now.Hour == 17)
                {
                    using var scope = _scopeFactory.CreateScope();
                    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                    var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();
                    var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();

                    // Намираме нови рецепти, които все още не са изпращани в бюлетин
                    var newRecipes = await dbContext.Recipes
                        .Where(r => !r.IncludedInNewsletter)
                        .OrderByDescending(r => r.CreatedAt)
                        .Take(5) // Взимаме топ 5 най-нови рецепти
                        .ToListAsync(stoppingToken);

                    if (newRecipes.Any())
                    {
                        var activeSubscribers = await dbContext.NewsletterSubscribers
                            .Where(s => s.IsActive)
                            .ToListAsync(stoppingToken);

                        if (activeSubscribers.Any())
                        {
                            var frontendBaseUrl = config["Frontend:BaseUrl"] ?? "http://localhost:5173";

                            // Генерираме HTML списък с новите рецепти
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

                            // Изпращаме до всеки активен абонат
                            foreach (var subscriber in activeSubscribers)
                            {
                                string unsubscribeLink = $"{frontendBaseUrl}/unsubscribe?email={Uri.EscapeDataString(subscriber.Email)}";
                                string emailBody = $@"
                                    <div style='font-family: Arial, sans-serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; background-color: #f7f4ed; padding: 30px; border-radius: 8px;'>
                                        <h2 style='color: #1a1a1a;'>🍲 Седмичен кулинарен бюлетин</h2>
                                        <p>Здравейте! Вижте нашите най-нови и вкусни предложения от изминалата седмица:</p>
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
                                    await emailService.SendEmailAsync(subscriber.Email, "🍲 Нови вкусове и рецепти в нашия блог!", emailBody);
                                }
                                catch
                                {
                                    // Прескачаме при грешка с конкретен имейл, за да не спре процеса
                                }
                            }

                            // Маркираме рецептите като изпратени
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

            // Проверяваме отново на всеки 1 час
            await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
        }
    }
}
