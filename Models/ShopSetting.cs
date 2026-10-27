using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CulinaryBlog.Models;

public class ShopSetting
{
    public int Id { get; set; }

    [MaxLength(120)]
    public string AccountName { get; set; } = string.Empty;

    [MaxLength(40)]
    public string Iban { get; set; } = string.Empty;

    [MaxLength(80)]
    public string BankName { get; set; } = string.Empty;

    [Column(TypeName = "text")]
    public string PaymentNote { get; set; } = string.Empty;
}
