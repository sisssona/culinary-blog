namespace CulinaryBlog.Models;

public class Favorite
{
    public int RecipeId { get; set; }
    public Recipe? Recipe { get; set; }

    public int UserId { get; set; }
    public User? User { get; set; }
}
