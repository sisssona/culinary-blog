using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CulinaryBlog.Models;

public class Article
{
    public int Id { get; set; }

    [Required]
    [MaxLength(220)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MaxLength(220)]
    public string Slug { get; set; } = string.Empty;

    [MaxLength(400)]
    public string Excerpt { get; set; } = string.Empty;

    [Column(TypeName = "text")]
    public string Body { get; set; } = string.Empty;

    public string? ImageUrl { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public int AuthorId { get; set; }
    public User? Author { get; set; }
}
