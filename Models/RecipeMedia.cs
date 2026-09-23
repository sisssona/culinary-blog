using System;

namespace CulinaryBlog.Models
{
    public class RecipeMedia
    {
        public int Id { get; set; }

        public int RecipeId { get; set; }
        public Recipe Recipe { get; set; } = null!;

        // Final public URL or storage key (may point to temp path until processed)
        public string Url { get; set; } = string.Empty;

        // Optional thumbnail or poster image url
        public string? ThumbnailUrl { get; set; }

        // "image" | "video"
        public string MediaType { get; set; } = "image";

        // Display ordering
        public int SortOrder { get; set; }

        // Primary image flag
        public bool IsPrimary { get; set; }

        // Processing state: "pending" | "processing" | "ready" | "failed"
        public string State { get; set; } = "pending";

        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

        public int UploadedBy { get; set; }

        public string? FailureReason { get; set; }
    }
}