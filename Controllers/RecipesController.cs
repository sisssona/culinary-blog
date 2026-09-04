using CulinaryBlog.Data;
using CulinaryBlog.DTOs;
using CulinaryBlog.Models;
using CulinaryBlog.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace CulinaryBlog.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class RecipesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IFileStorageService _fileStorage;
    private readonly TranslationService _translationService;

    public RecipesController(
        ApplicationDbContext context,
        IFileStorageService fileStorage,
        TranslationService translationService)
    {
        _context = context;
        _fileStorage = fileStorage;
        _translationService = translationService;
    }

    // GET: api/v1/recipes?lang=bg
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string lang = "bg", CancellationToken cancellationToken = default)
    {
        var recipes = await _context.Recipes
            .Include(r => r.Translations)
            .ToListAsync(cancellationToken);

        var result = recipes.Select(r =>
        {
            var translation = r.Translations.FirstOrDefault(t => t.Language.ToLower() == lang.ToLower());

            return new RecipeResponseDto(
                r.Id,
                Title: translation != null ? translation.Title : r.Title,
                Category: r.Category,
                Ingredients: translation != null ? translation.Ingredients : r.Ingredients,
                Instructions: translation != null ? translation.Instructions : r.Instructions,
                r.ImageUrl,
                r.ThumbnailUrl,
                Language: lang,
                Status: r.Status,
                r.CreatedAt
            );
        });

        return Ok(result);
    }

    // GET: api/v1/recipes/5?lang=bg
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id, [FromQuery] string lang = "bg", CancellationToken cancellationToken = default)
    {
        var recipe = await _context.Recipes
            .Include(r => r.Translations)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        if (recipe == null) return NotFound();

        var translation = recipe.Translations.FirstOrDefault(t => t.Language.ToLower() == lang.ToLower());

        var response = new RecipeResponseDto(
            recipe.Id,
            Title: translation != null ? translation.Title : recipe.Title,
            Category: recipe.Category,
            Ingredients: translation != null ? translation.Ingredients : recipe.Ingredients,
            Instructions: translation != null ? translation.Instructions : recipe.Instructions,
            recipe.ImageUrl,
            recipe.ThumbnailUrl,
            Language: lang,
            Status: recipe.Status,
            recipe.CreatedAt
        );

        return Ok(response);
    }

    // POST: api/v1/recipes
    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create([FromForm] CreateRecipeDto dto, CancellationToken cancellationToken)
    {
        string? imageUrl = null;
        string? thumbnailUrl = null;

        if (dto.ImageFile != null && dto.ImageFile.Length > 0)
        {
            var uploadResult = await _fileStorage.SaveFileAsync(dto.ImageFile, "uploads");
            imageUrl = uploadResult.MainImageUrl;
            thumbnailUrl = uploadResult.ThumbnailUrl;
        }

        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        int.TryParse(userIdClaim, out int authorId);

        var recipe = new Recipe
        {
            Title = dto.Title,
            Category = dto.Category,
            Ingredients = dto.Ingredients,
            Instructions = dto.Instructions,
            ImageUrl = imageUrl,
            ThumbnailUrl = thumbnailUrl,
            AuthorId = authorId,
            CreatedAt = DateTime.UtcNow
        };

        string titleEn = await _translationService.TranslateAsync(dto.Title, "en", "bg");
        string ingredientsEn = await _translationService.TranslateAsync(dto.Ingredients, "en", "bg");
        string instructionsEn = await _translationService.TranslateAsync(dto.Instructions, "en", "bg");

        recipe.Translations.Add(new RecipeTranslation
        {
            Language = "en",
            Title = titleEn,
            Ingredients = ingredientsEn,
            Instructions = instructionsEn
        });

        _context.Recipes.Add(recipe);
        await _context.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetById), new { id = recipe.Id }, recipe);
    }

    // PUT: api/v1/recipes/5
    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> Update(int id, [FromForm] RecipeUpdateDto dto, CancellationToken cancellationToken)
    {
        var recipe = await _context.Recipes
            .Include(r => r.Translations)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        if (recipe == null) return NotFound();

        // Проверка за собственост или Admin роля
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        int.TryParse(userIdClaim, out int currentUserId);
        var isAdmin = User.IsInRole("Admin");

        if (recipe.AuthorId != currentUserId && !isAdmin)
        {
            return Forbid();
        }

        if (dto.ImageFile != null && dto.ImageFile.Length > 0)
        {
            if (!string.IsNullOrEmpty(recipe.ImageUrl)) _fileStorage.DeleteFile(recipe.ImageUrl);
            if (!string.IsNullOrEmpty(recipe.ThumbnailUrl)) _fileStorage.DeleteFile(recipe.ThumbnailUrl);

            var uploadResult = await _fileStorage.SaveFileAsync(dto.ImageFile, "uploads");
            recipe.ImageUrl = uploadResult.MainImageUrl;
            recipe.ThumbnailUrl = uploadResult.ThumbnailUrl;
        }

        recipe.Title = dto.Title;
        recipe.Category = dto.Category;
        recipe.Ingredients = dto.Ingredients;
        recipe.Instructions = dto.Instructions;

        string titleEn = await _translationService.TranslateAsync(dto.Title, "en", "bg");
        string ingredientsEn = await _translationService.TranslateAsync(dto.Ingredients, "en", "bg");
        string instructionsEn = await _translationService.TranslateAsync(dto.Instructions, "en", "bg");

        var enTranslation = recipe.Translations.FirstOrDefault(t => t.Language.ToLower() == "en");
        if (enTranslation != null)
        {
            enTranslation.Title = titleEn;
            enTranslation.Ingredients = ingredientsEn;
            enTranslation.Instructions = instructionsEn;
        }
        else
        {
            recipe.Translations.Add(new RecipeTranslation
            {
                Language = "en",
                Title = titleEn,
                Ingredients = ingredientsEn,
                Instructions = instructionsEn
            });
        }

        await _context.SaveChangesAsync(cancellationToken);
        return Ok(recipe);
    }

    // DELETE: api/v1/recipes/5
    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var recipe = await _context.Recipes.FindAsync(new object[] { id }, cancellationToken);
        if (recipe == null) return NotFound();

        // Проверка за собственост или Admin роля
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        int.TryParse(userIdClaim, out int currentUserId);
        var isAdmin = User.IsInRole("Admin");

        if (recipe.AuthorId != currentUserId && !isAdmin)
        {
            return Forbid();
        }

        if (!string.IsNullOrEmpty(recipe.ImageUrl)) _fileStorage.DeleteFile(recipe.ImageUrl);
        if (!string.IsNullOrEmpty(recipe.ThumbnailUrl)) _fileStorage.DeleteFile(recipe.ThumbnailUrl);

        _context.Recipes.Remove(recipe);
        await _context.SaveChangesAsync(cancellationToken);

        return NoContent();
    }
}