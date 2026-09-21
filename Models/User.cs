using System.ComponentModel.DataAnnotations;

namespace CulinaryBlog.Models;

public class User
{
    public int Id { get; set; }

    [MaxLength(80)]
    public string DisplayName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = "User";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [MaxLength(500)]
    public string Bio { get; set; } = string.Empty;

    public ICollection<Recipe> Recipes { get; set; } = new List<Recipe>();
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public ICollection<Like> Likes { get; set; } = new List<Like>();
    public ICollection<Favorite> Favorites { get; set; } = new List<Favorite>();
    public ICollection<Rating> Ratings { get; set; } = new List<Rating>();
}
