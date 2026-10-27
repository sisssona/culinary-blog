using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace CulinaryBlog.Services;

public class RecipeMediaBackgroundService : BackgroundService
{
    private readonly IRecipeMediaProcessingQueue _queue;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<RecipeMediaBackgroundService> _logger;

    public RecipeMediaBackgroundService(
        IRecipeMediaProcessingQueue queue,
        IServiceScopeFactory scopeFactory,
        ILogger<RecipeMediaBackgroundService> logger)
    {
        _queue = queue;
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("RecipeMediaBackgroundService started.");
        while (!stoppingToken.IsCancellationRequested)
        {
            int recipeId;
            try
            {
                recipeId = await _queue.DequeueAsync(stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error dequeuing recipe id");
                await Task.Delay(TimeSpan.FromSeconds(1), stoppingToken);
                continue;
            }

            try
            {
                _logger.LogInformation("Processing media for recipe {RecipeId}", recipeId);
                using var scope = _scopeFactory.CreateScope();
                var processor = scope.ServiceProvider.GetRequiredService<IMediaProcessingService>();
                await processor.ProcessRecipeMediaAsync(recipeId, stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing media for recipe {RecipeId}", recipeId);
            }
        }
        _logger.LogInformation("RecipeMediaBackgroundService stopping.");
    }
}