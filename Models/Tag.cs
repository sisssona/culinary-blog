using System.ComponentModel.DataAnnotations;

namespace CulinaryBlog.Models;

public class Tag
{
    public int Id { get; set; }

    [Required]
    [MaxLength(60)]
    public string Name { get; set; } = string.Empty; // display text, e.g. "Без глутен"

    [MaxLength(60)]
    public string NameEn { get; set; } = string.Empty; // display text, e.g. "Gluten-free"

    [Required]
    [MaxLength(60)]
    public string Slug { get; set; } = string.Empty; // used in URLs, e.g. "bez-gluten"

    // Groups tags for the autosuggest/admin UI: "time", "occasion", "diet", "difficulty", "method"
    [MaxLength(30)]
    public string? Group { get; set; }

    // Many-to-many with Recipe via EF Core's implicit skip-navigation join table
    // (no separate join entity needed — EF creates and manages the join table itself).
    public ICollection<Recipe> Recipes { get; set; } = new List<Recipe>();
}