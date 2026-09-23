using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Collections.Generic;

namespace CulinaryBlog.Models;

public class Recipe
{
    public int Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MaxLength(220)]
    public string Slug { get; set; } = string.Empty;

    [Required]
    public string Category { get; set; } = string.Empty;

    public int? CategoryId { get; set; }
    public Category? CategoryEntity { get; set; }

    [Column(TypeName = "text")]
    public string Ingredients { get; set; } = string.Empty;

    [Column(TypeName = "text")]
    public string Instructions { get; set; } = string.Empty;

    public string? ImageUrl { get; set; }
    public string? ThumbnailUrl { get; set; }

    public string Status { get; set; } = "pending";
    public bool IsFeatured { get; set; }

    public int PrepTimeMinutes { get; set; }
    public int CookTimeMinutes { get; set; }
    public int Servings { get; set; } = 4;

    [MaxLength(20)]
    public string Difficulty { get; set; } = "medium";

    public int ViewCount { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public int AuthorId { get; set; }
    public User? Author { get; set; }

    public ICollection<RecipeTranslation> Translations { get; set; } = new List<RecipeTranslation>();
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public ICollection<Like> Likes { get; set; } = new List<Like>();
    public ICollection<Favorite> Favorites { get; set; } = new List<Favorite>();
    public ICollection<Rating> Ratings { get; set; } = new List<Rating>();
    public ICollection<RecipeIngredient> IngredientItems { get; set; } = new List<RecipeIngredient>();
    public ICollection<RecipeStep> Steps { get; set; } = new List<RecipeStep>();

    // Added: recipe-level media (images, videos)
    public ICollection<RecipeMedia> Media { get; set; } = new List<RecipeMedia>();
}
