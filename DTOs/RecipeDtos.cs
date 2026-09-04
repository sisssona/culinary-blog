using System.ComponentModel.DataAnnotations;
using CulinaryBlog.Attributes;
using Microsoft.AspNetCore.Http;

namespace CulinaryBlog.DTOs;

public class CreateRecipeDto
{
    [Required(ErrorMessage = "Заглавието е задължително")]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "Категорията е задължителна")]
    public string Category { get; set; } = string.Empty;

    [Required(ErrorMessage = "Съставките са задължителни")]
    public string Ingredients { get; set; } = string.Empty;

    [Required(ErrorMessage = "Инструкциите са задължителни")]
    public string Instructions { get; set; } = string.Empty;

    [AllowedExtensions(".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif", ".avif", ".gif")]
    public IFormFile? ImageFile { get; set; }
}

public class RecipeUpdateDto
{
    [Required(ErrorMessage = "Заглавието е задължително")]
    public string Title { get; set; } = string.Empty;

    public string Category { get; set; } = string.Empty;

    [Required(ErrorMessage = "Съставките са задължителни")]
    public string Ingredients { get; set; } = string.Empty;

    [Required(ErrorMessage = "Инструкциите са задължителни")]
    public string Instructions { get; set; } = string.Empty;

    [AllowedExtensions(".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif", ".avif", ".gif")]
    public IFormFile? ImageFile { get; set; }
}

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