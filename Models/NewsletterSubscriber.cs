using System.ComponentModel.DataAnnotations;

namespace CulinaryBlog.Models;

public class NewsletterSubscriber
{
    public int Id { get; set; }

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    public DateTime SubscribedAt { get; set; } = DateTime.UtcNow;
}
