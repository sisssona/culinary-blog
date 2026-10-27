using System.ComponentModel.DataAnnotations;

namespace CulinaryBlog.Models;

public class User
{
    public int Id { get; set; }

    [MaxLength(80)]
    public string DisplayName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;

    [MaxLength(255)]
    public string? GoogleSubject { get; set; }
    public string Role { get; set; } = "User";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [MaxLength(500)]
    public string Bio { get; set; } = string.Empty;

    [MaxLength(5)]
    public string PreferredLanguage { get; set; } = "bg";

    // --- Абонамент за бюлетин ---
    public bool IsSubscribedToNewsletter { get; set; } = true; // По подразбиране е true

    // --- Потвърждение на имейл ---
    public bool EmailConfirmed { get; set; } = false;

    [MaxLength(100)]
    public string? EmailConfirmationToken { get; set; }
    public DateTime? EmailConfirmationTokenExpiresAt { get; set; }

    // --- Забравена парола ---
    [MaxLength(100)]
    public string? PasswordResetToken { get; set; }
    public DateTime? PasswordResetTokenExpiresAt { get; set; }

    public ICollection<Recipe> Recipes { get; set; } = new List<Recipe>();
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public ICollection<Like> Likes { get; set; } = new List<Like>();
    public ICollection<Favorite> Favorites { get; set; } = new List<Favorite>();
    public ICollection<Rating> Ratings { get; set; } = new List<Rating>();
}
