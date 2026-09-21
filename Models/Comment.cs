using System;

namespace CulinaryBlog.Models
{
    public class Comment
    {
        public int Id { get; set; }
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public int RecipeId { get; set; }
        public Recipe? Recipe { get; set; }

        public int UserId { get; set; }
        public User? User { get; set; }
    }
}