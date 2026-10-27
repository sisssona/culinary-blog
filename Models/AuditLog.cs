using System.ComponentModel.DataAnnotations;

namespace CulinaryBlog.Models;

public class AuditLog
{
    public int Id { get; set; }

    public int UserId { get; set; }

    [MaxLength(120)]
    public string ActorName { get; set; } = string.Empty;

    [MaxLength(40)]
    public string Action { get; set; } = string.Empty;

    [MaxLength(40)]
    public string ResourceType { get; set; } = string.Empty;

    public int? ResourceId { get; set; }

    [MaxLength(500)]
    public string Details { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
