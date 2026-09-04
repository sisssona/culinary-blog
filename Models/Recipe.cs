using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CulinaryBlog.Models;

public class Recipe
{
    public int Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    public string Category { get; set; } = string.Empty;

    [Column(TypeName = "text")]
    public string Ingredients { get; set; } = string.Empty;

    [Column(TypeName = "text")]
    public string Instructions { get; set; } = string.Empty;

    public string? ImageUrl { get; set; }
   
    public string? ThumbnailUrl { get; set; } // <--- Добавено

    public string Status { get; set; } = "pending"; // "pending", "approved"

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Връзка към автора (User)
    public int AuthorId { get; set; }
    public User? Author { get; set; }

    // Връзка към преводите
    public ICollection<RecipeTranslation> Translations { get; set; } = new List<RecipeTranslation>();
}