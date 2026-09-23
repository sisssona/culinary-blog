using System.ComponentModel.DataAnnotations;
using CulinaryBlog.Attributes;
using Microsoft.AspNetCore.Http;

namespace CulinaryBlog.DTOs;

public class CreateRecipeDto
{
    [Required(ErrorMessage = "Заглавието е задължително")]
    public string Title { get; set; } = string.Empty;

    public string Category { get; set; } = string.Empty;
    public int? CategoryId { get; set; }

    public string Ingredients { get; set; } = string.Empty;
    public string Instructions { get; set; } = string.Empty;
    public string? IngredientsJson { get; set; }
    public string? StepsJson { get; set; }

    public int PrepTimeMinutes { get; set; }
    public int CookTimeMinutes { get; set; }
    public int Servings { get; set; } = 4;
    public string Difficulty { get; set; } = "medium";
    public bool IsFeatured { get; set; }

    [AllowedExtensions(".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif", ".avif", ".gif")]
    public IFormFile? ImageFile { get; set; }

    public List<IFormFile>? Images { get; set; }
    public List<IFormFile>? Videos { get; set; }
    public bool PublishWithoutImage { get; set; } = true; // optional policy flag
}

public class RecipeUpdateDto : CreateRecipeDto
{
}

public record IngredientLineDto(string Amount, string Name);
public record StepLineDto(int SortOrder, string Text, string? ImageUrl);

public record RecipeCardDto(
    int Id,
    string Slug,
    string Title,
    string Category,
    string? CategorySlug,
    string? ImageUrl,
    string? ThumbnailUrl,
    string Language,
    string Status,
    DateTime CreatedAt,
    int AuthorId,
    string AuthorName,
    int PrepTimeMinutes,
    int CookTimeMinutes,
    int Servings,
    string Difficulty,
    int LikeCount,
    int CommentCount,
    int FavoriteCount,
    double RatingAverage,
    int RatingCount,
    int ViewCount,
    bool IsFeatured
);

public record RecipeDetailDto(
    int Id,
    string Slug,
    string Title,
    string Category,
    string? CategorySlug,
    string Ingredients,
    string Instructions,
    IReadOnlyList<IngredientLineDto> IngredientItems,
    IReadOnlyList<StepLineDto> Steps,
    string? ImageUrl,
    string? ThumbnailUrl,
    string Language,
    string Status,
    DateTime CreatedAt,
    int AuthorId,
    string AuthorName,
    int PrepTimeMinutes,
    int CookTimeMinutes,
    int Servings,
    string Difficulty,
    int LikeCount,
    int CommentCount,
    int FavoriteCount,
    double RatingAverage,
    int RatingCount,
    int ViewCount,
    bool IsFeatured,
    bool Liked,
    bool Favorited,
    int? MyRating
);

public record PagedResult<T>(IReadOnlyList<T> Items, int Total, int Page, int PageSize);

public record RecipeResponseDto(
    int Id,
    string Title,
    string Category,
    string Ingredients,
    string Instructions,
    string? ImageUrl,
    string? ThumbnailUrl,
    string Language,
    string Status,
    DateTime CreatedAt
);
