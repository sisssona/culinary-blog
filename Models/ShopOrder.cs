using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CulinaryBlog.Models;

public class ShopOrder
{
    public int Id { get; set; }

    [Required]
    [MaxLength(120)]
    public string CustomerName { get; set; } = string.Empty;

    [Required]
    [MaxLength(40)]
    public string Phone { get; set; } = string.Empty;

    [MaxLength(160)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(80)]
    public string City { get; set; } = string.Empty;

    [MaxLength(300)]
    public string Address { get; set; } = string.Empty;

    [MaxLength(64)]
    public string? DownloadToken { get; set; }

    public bool FileSent { get; set; }

    [MaxLength(500)]
    public string Note { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string PaymentMethod { get; set; } = "cod";

    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "new";

    [Column(TypeName = "numeric(10,2)")]
    public decimal Total { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<ShopOrderItem> Items { get; set; } = new List<ShopOrderItem>();
}

public class ShopOrderItem
{
    public int Id { get; set; }

    public int ShopOrderId { get; set; }
    public ShopOrder? ShopOrder { get; set; }

    public int? ProductId { get; set; }
    public Product? Product { get; set; }

    [Required]
    [MaxLength(160)]
    public string ProductName { get; set; } = string.Empty;

    [Column(TypeName = "numeric(10,2)")]
    public decimal UnitPrice { get; set; }

    public int Quantity { get; set; }

    [MaxLength(20)]
    public string Kind { get; set; } = "stock";

    [MaxLength(80)]
    public string? FileKey { get; set; }

    [MaxLength(200)]
    public string? FileName { get; set; }
}
