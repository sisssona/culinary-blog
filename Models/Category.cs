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

    // Hierarchy: null means this is a top-level category.
    public int? ParentCategoryId { get; set; }
    public Category? ParentCategory { get; set; }
    public ICollection<Category> SubCategories { get; set; } = new List<Category>();

    public ICollection<Recipe> Recipes { get; set; } = new List<Recipe>();
}