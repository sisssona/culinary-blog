using System.ComponentModel.DataAnnotations;

namespace CulinaryBlog.Models;

public class RecipeIngredient
{
    public int Id { get; set; }
    public int RecipeId { get; set; }
    public Recipe? Recipe { get; set; }

    public int SortOrder { get; set; }

    [MaxLength(80)]
    public string Amount { get; set; } = string.Empty;

    [Required]
    [MaxLength(300)]
    public string Name { get; set; } = string.Empty;
}
