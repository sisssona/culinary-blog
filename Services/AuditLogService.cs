using CulinaryBlog.Data;
using System;
using System.Threading.Tasks;

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
    /// Records an important user action in the application log.
    /// </summary>
    /// <param name="userId">Id of the user who performed the action</param>
    /// <param name="action">Action name (Create, Update, Delete, Approve, Reject)</param>
    /// <param name="resourceType">Type of resource (Recipe, User, Comment)</param>
    /// <param name="resourceId">Id of the resource, if any</param>
    /// <param name="details">Additional details</param>
    public Task LogActionAsync(int userId, string action, string resourceType, int? resourceId, string details)
    {
        try
        {
            _logger.LogInformation(
                "AUDIT: User {UserId} performed {Action} on {ResourceType} {ResourceId}. Details: {Details}",
                userId, action, resourceType, resourceId, details);

            // TODO: later, store these in a dedicated AuditLogs table using _context.
        }
        catch (Exception ex)
        {
            // Audit logging must never break the request.
            _logger.LogError(ex, "Error logging audit action");
        }

        return Task.CompletedTask;
    }
}
