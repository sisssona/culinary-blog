namespace CulinaryBlog.DTOs
{
    public class UpdateProfileDto
    {
        public string DisplayName { get; set; } = string.Empty;
        public string? Bio { get; set; }
    }
}