using CulinaryBlog.Data;
using CulinaryBlog.Models;
using CulinaryBlog.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace CulinaryBlog.Controllers;

[Route("api/v1/recipes")]
[ApiController]
public class RecipeInteractionsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ContentTranslator _translator;

    public RecipeInteractionsController(ApplicationDbContext context, ContentTranslator translator)
    {
        _context = context;
        _translator = translator;
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("moderation/comments")]
    public async Task<IActionResult> ListCommentsForModeration([FromQuery] int take = 50)
    {
        take = Math.Clamp(take, 1, 100);

        var comments = await _context.Comments
            .AsNoTracking()
            .OrderByDescending(c => c.CreatedAt)
            .Take(take)
            .Select(c => new
            {
                c.Id,
                c.Content,
                c.CreatedAt,
                c.RecipeId,
                RecipeTitle = c.Recipe != null ? c.Recipe.Title : "",
                c.UserId,
                AuthorName = c.User != null
                    ? (string.IsNullOrWhiteSpace(c.User.DisplayName) ? c.User.Email : c.User.DisplayName)
                    : "Готвач"
            })
            .ToListAsync();

        return Ok(comments);
    }

    [HttpGet("{recipeId:int}/comments")]
    public async Task<IActionResult> GetComments(int recipeId, CancellationToken cancellationToken)
    {
        var pending = await _context.Comments
            .Where(c => c.RecipeId == recipeId && c.ContentEn == null)
            .ToListAsync(cancellationToken);
        var changed = false;
        foreach (var comment in pending)
        {
            if (await _translator.ApplyCommentAsync(comment, cancellationToken))
                changed = true;
        }

        if (changed)
            await _context.SaveChangesAsync(cancellationToken);

        var comments = await _context.Comments
            .AsNoTracking()
            .Where(c => c.RecipeId == recipeId)
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new
            {
                c.Id,
                c.Content,
                c.ContentEn,
                c.CreatedAt,
                c.UserId,
                AuthorName = c.User != null
                    ? (string.IsNullOrWhiteSpace(c.User.DisplayName) ? c.User.Email : c.User.DisplayName)
                    : "Готвач"
            })
            .ToListAsync(cancellationToken);

        return Ok(comments);
    }

    [Authorize]
    [HttpPost("{recipeId:int}/comments")]
    public async Task<IActionResult> AddComment(int recipeId, [FromBody] CommentDto dto, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized();
        if (string.IsNullOrWhiteSpace(dto.Content))
            return BadRequest(new { error = "Коментарът не може да бъде празен." });

        var recipeExists = await _context.Recipes.AnyAsync(r => r.Id == recipeId);
        if (!recipeExists) return NotFound("Recipe not found.");

        var comment = new Comment
        {
            RecipeId = recipeId,
            UserId = userId,
            Content = dto.Content.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        await _translator.ApplyCommentAsync(comment, cancellationToken);
        _context.Comments.Add(comment);
        await _context.SaveChangesAsync(cancellationToken);

        // ✅ Audit log
        var auditService = HttpContext.RequestServices.GetRequiredService<IAuditLogService>();
        await auditService.LogActionAsync(
            userId,
            "AddComment",
            "Comment",
            comment.Id,
            $"Коментар към рецепта {recipeId}"
        );

        var user = await _context.Users.FindAsync(userId);
        return Ok(new
        {
            comment.Id,
            comment.Content,
            comment.ContentEn,
            comment.CreatedAt,
            comment.UserId,
            AuthorName = user?.DisplayName ?? user?.Email ?? "Готвач"
        });
    }

    // НОВ МЕТОД ЗА ИЗТРИВАНЕ НА КОМЕНТАР
    [Authorize]
    [HttpDelete("comments/{commentId:int}")]
    public async Task<IActionResult> DeleteComment(int commentId)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized();

        var comment = await _context.Comments.FindAsync(commentId);
        if (comment == null)
            return NotFound(new { error = "Коментарът не е намерен." });

        // Проверяваме дали потребителят е администратор или е автор на самия коментар
        var isAdmin = User.IsInRole("Admin");
        if (!isAdmin && comment.UserId != userId)
            return Forbid();

        var recipeId = comment.RecipeId;
        var snippet = comment.Content.Length > 80 ? comment.Content[..80] + "…" : comment.Content;

        _context.Comments.Remove(comment);
        await _context.SaveChangesAsync();

        var auditService = HttpContext.RequestServices.GetRequiredService<IAuditLogService>();
        await auditService.LogActionAsync(
            userId,
            "DeleteComment",
            "Comment",
            commentId,
            $"Коментар към рецепта {recipeId}: {snippet}"
        );

        return Ok(new { message = "Коментарът беше изтрит успешно." });
    }

    [Authorize]
    [HttpPost("{recipeId:int}/like")]
    public async Task<IActionResult> ToggleLike(int recipeId)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized();

        var recipeExists = await _context.Recipes.AnyAsync(r => r.Id == recipeId);
        if (!recipeExists) return NotFound();

        var existingLike = await _context.Likes
            .FirstOrDefaultAsync(l => l.RecipeId == recipeId && l.UserId == userId);

        if (existingLike != null)
            _context.Likes.Remove(existingLike);
        else
            _context.Likes.Add(new Like { RecipeId = recipeId, UserId = userId });

        await _context.SaveChangesAsync();
        var count = await _context.Likes.CountAsync(l => l.RecipeId == recipeId);
        return Ok(new { liked = existingLike == null, likeCount = count });
    }

    [Authorize]
    [HttpPost("{recipeId:int}/favorite")]
    public async Task<IActionResult> ToggleFavorite(int recipeId)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized();

        var recipeExists = await _context.Recipes.AnyAsync(r => r.Id == recipeId);
        if (!recipeExists) return NotFound();

        var existing = await _context.Favorites
            .FirstOrDefaultAsync(f => f.RecipeId == recipeId && f.UserId == userId);

        if (existing != null)
            _context.Favorites.Remove(existing);
        else
            _context.Favorites.Add(new Favorite { RecipeId = recipeId, UserId = userId });

        await _context.SaveChangesAsync();
        var count = await _context.Favorites.CountAsync(f => f.RecipeId == recipeId);
        return Ok(new { favorited = existing == null, favoriteCount = count });
    }

    [Authorize]
    [HttpPost("{recipeId:int}/rate")]
    public async Task<IActionResult> Rate(int recipeId, [FromBody] RatingDto dto)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized();
        if (dto.Value is < 1 or > 5)
            return BadRequest(new { error = "Оценката трябва да е между 1 и 5." });

        var recipeExists = await _context.Recipes.AnyAsync(r => r.Id == recipeId);
        if (!recipeExists) return NotFound();

        var existing = await _context.Ratings
            .FirstOrDefaultAsync(r => r.RecipeId == recipeId && r.UserId == userId);
        if (existing == null)
            _context.Ratings.Add(new Rating { RecipeId = recipeId, UserId = userId, Value = dto.Value });
        else
            existing.Value = dto.Value;

        await _context.SaveChangesAsync();
        var ratings = await _context.Ratings.Where(r => r.RecipeId == recipeId).ToListAsync();
        return Ok(new
        {
            myRating = dto.Value,
            ratingAverage = Math.Round(ratings.Average(r => r.Value), 1),
            ratingCount = ratings.Count
        });
    }

    private bool TryGetUserId(out int userId)
    {
        return int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out userId);
    }
}

public class CommentDto
{
    public string Content { get; set; } = string.Empty;
}

public class RatingDto
{
    public int Value { get; set; }
}
