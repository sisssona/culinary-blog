using CulinaryBlog.Data;
using CulinaryBlog.Models;
using Microsoft.EntityFrameworkCore;

namespace CulinaryBlog.Services;

public interface IAuditLogService
{
    Task LogActionAsync(int userId, string action, string resourceType, int? resourceId, string details);
}

public class AuditLogService : IAuditLogService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<AuditLogService> _logger;

    public AuditLogService(ApplicationDbContext context, ILogger<AuditLogService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Records an important user action. The row stays even if the recipe or comment is gone.
    /// </summary>
    public async Task LogActionAsync(int userId, string action, string resourceType, int? resourceId, string details)
    {
        try
        {
            var actorName = await _context.Users.AsNoTracking()
                .Where(u => u.Id == userId)
                .Select(u => u.DisplayName != "" ? u.DisplayName : u.Email)
                .FirstOrDefaultAsync() ?? $"#{userId}";

            var text = details ?? string.Empty;
            if (text.Length > 500) text = text[..500];
            if (actorName.Length > 120) actorName = actorName[..120];

            _context.AuditLogs.Add(new AuditLog
            {
                UserId = userId,
                ActorName = actorName,
                Action = action.Length > 40 ? action[..40] : action,
                ResourceType = resourceType.Length > 40 ? resourceType[..40] : resourceType,
                ResourceId = resourceId,
                Details = text,
                CreatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "AUDIT: User {UserId} performed {Action} on {ResourceType} {ResourceId}. Details: {Details}",
                userId, action, resourceType, resourceId, details);
        }
        catch (Exception ex)
        {
            // Audit logging must never break the request.
            _logger.LogError(ex, "Error logging audit action");
        }
    }
}
