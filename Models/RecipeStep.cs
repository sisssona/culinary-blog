using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CulinaryBlog.Models;

public class RecipeStep
{
    public int Id { get; set; }
    public int RecipeId { get; set; }
    public Recipe? Recipe { get; set; }

    public int SortOrder { get; set; }

    [Required]
    [Column(TypeName = "text")]
    public string Text { get; set; } = string.Empty;

    public string? ImageUrl { get; set; }
}
