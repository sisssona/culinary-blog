using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CulinaryBlog.Models;

public class RecipeTranslation
{
    public int Id { get; set; }

    public int RecipeId { get; set; }
    public Recipe Recipe { get; set; } = null!;

    [Required]
    public string Language { get; set; } = "bg"; // bg, en, etc.

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Column(TypeName = "text")]
    public string Ingredients { get; set; } = string.Empty;

    [Column(TypeName = "text")]
    public string Instructions { get; set; } = string.Empty;
}