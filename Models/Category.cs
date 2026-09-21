using System.ComponentModel.DataAnnotations;

namespace CulinaryBlog.Models;

public class Category
{
    public int Id { get; set; }

    [Required]
    [MaxLength(120)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(120)]
    public string NameEn { get; set; } = string.Empty;

    [Required]
    [MaxLength(120)]
    public string Slug { get; set; } = string.Empty;

    public int SortOrder { get; set; }

    public ICollection<Recipe> Recipes { get; set; } = new List<Recipe>();
}
