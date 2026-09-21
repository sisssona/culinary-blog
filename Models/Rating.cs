namespace CulinaryBlog.Models;

public class Rating
{
    public int RecipeId { get; set; }
    public Recipe? Recipe { get; set; }

    public int UserId { get; set; }
    public User? User { get; set; }

    public int Value { get; set; }
}
