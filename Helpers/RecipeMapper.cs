using CulinaryBlog.DTOs;
using CulinaryBlog.Models;

namespace CulinaryBlog.Helpers;

public static class RecipeMapper
{
    public static RecipeCardDto ToCard(Recipe r, string lang = "bg")
    {
        var translation = r.Translations.FirstOrDefault(t => t.Language.Equals(lang, StringComparison.OrdinalIgnoreCase));
        var categoryName = lang.StartsWith("en", StringComparison.OrdinalIgnoreCase) && r.CategoryEntity != null
            ? (string.IsNullOrWhiteSpace(r.CategoryEntity.NameEn) ? r.CategoryEntity.Name : r.CategoryEntity.NameEn)
            : (r.CategoryEntity?.Name ?? r.Category);
        var title = translation != null ? translation.Title : r.Title;
        var ratings = r.Ratings?.ToList() ?? new List<Rating>();
        var avg = ratings.Count == 0 ? 0 : Math.Round(ratings.Average(x => x.Value), 1);

        return new RecipeCardDto(
            r.Id,
            r.Slug,
            title,
            categoryName,
            r.CategoryEntity?.Slug,
            r.ImageUrl,
            r.ThumbnailUrl,
            lang,
            r.Status,
            r.CreatedAt,
            r.AuthorId,
            r.Author?.DisplayName ?? r.Author?.Email ?? "Готвач",
            r.PrepTimeMinutes,
            r.CookTimeMinutes,
            r.Servings,
            r.Difficulty,
            r.Likes?.Count ?? 0,
            r.Comments?.Count ?? 0,
            r.Favorites?.Count ?? 0,
            avg,
            ratings.Count,
            r.ViewCount,
            r.IsFeatured
        );
    }

    public static RecipeDetailDto ToDetail(Recipe r, string lang, int? currentUserId)
    {
        var card = ToCard(r, lang);
        var translation = r.Translations.FirstOrDefault(t => t.Language.Equals(lang, StringComparison.OrdinalIgnoreCase));
        var ingredients = translation != null ? translation.Ingredients : r.Ingredients;
        var instructions = translation != null ? translation.Instructions : r.Instructions;

        var items = (r.IngredientItems ?? [])
            .OrderBy(i => i.SortOrder)
            .Select(i => new IngredientLineDto(i.Amount, i.Name))
            .ToList();
        if (items.Count == 0)
        {
            items = SplitLines(ingredients)
                .Select(line => ParseIngredient(line))
                .ToList();
        }

        var steps = (r.Steps ?? [])
            .OrderBy(s => s.SortOrder)
            .Select(s => new StepLineDto(s.SortOrder, s.Text, s.ImageUrl))
            .ToList();
        if (steps.Count == 0)
        {
            steps = SplitLines(instructions)
                .Select((text, idx) => new StepLineDto(idx + 1, text, null))
                .ToList();
        }

        var liked = currentUserId.HasValue && r.Likes.Any(l => l.UserId == currentUserId.Value);
        var favorited = currentUserId.HasValue && r.Favorites.Any(f => f.UserId == currentUserId.Value);
        var myRating = currentUserId.HasValue
            ? r.Ratings.FirstOrDefault(x => x.UserId == currentUserId.Value)?.Value
            : null;

        return new RecipeDetailDto(
            card.Id, card.Slug, card.Title, card.Category, card.CategorySlug,
            ingredients, instructions, items, steps,
            card.ImageUrl, card.ThumbnailUrl, card.Language, card.Status, card.CreatedAt,
            card.AuthorId, card.AuthorName, card.PrepTimeMinutes, card.CookTimeMinutes,
            card.Servings, card.Difficulty, card.LikeCount, card.CommentCount, card.FavoriteCount,
            card.RatingAverage, card.RatingCount, card.ViewCount, card.IsFeatured,
            liked, favorited, myRating
        );
    }

    public static List<string> SplitLines(string text) =>
        (text ?? string.Empty)
            .Split(new char[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .ToList();

    public static IngredientLineDto ParseIngredient(string line)
    {
        var parts = line.Split(' ', 2, StringSplitOptions.TrimEntries);
        if (parts.Length == 2 && parts[0].Any(char.IsDigit))
            return new IngredientLineDto(parts[0], parts[1]);
        return new IngredientLineDto("", line);
    }
}
