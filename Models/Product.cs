using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CulinaryBlog.Models;

public class Product
{
    public int Id { get; set; }

    [Required]
    [MaxLength(160)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(160)]
    public string? NameEn { get; set; }

    [Column(TypeName = "text")]
    public string Description { get; set; } = string.Empty;

    [Column(TypeName = "text")]
    public string? DescriptionEn { get; set; }

    [Column(TypeName = "numeric(10,2)")]
    public decimal Price { get; set; }

    public int? Stock { get; set; }

    public string? ImageUrl { get; set; }

    [Required]
    [MaxLength(20)]
    public string Kind { get; set; } = "stock";

    [MaxLength(500)]
    public string? ExternalUrl { get; set; }

    [MaxLength(80)]
    public string? FileKey { get; set; }

    [MaxLength(200)]
    public string? FileName { get; set; }

    public bool IsPublished { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<ShopOrderItem> OrderItems { get; set; } = new List<ShopOrderItem>();
}
