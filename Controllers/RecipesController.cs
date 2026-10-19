using System;
using System.Text.Json;
using CulinaryBlog.Data;
using CulinaryBlog.DTOs;
using CulinaryBlog.Helpers;
using CulinaryBlog.Models;
using CulinaryBlog.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Microsoft.Extensions.DependencyInjection;
using System.Linq;
using System.Collections.Generic;
using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace CulinaryBlog.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class RecipesController : ControllerBase
{
    private const int MinTags = 3;
    private const int MaxTags = 6;

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

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string lang = "bg",
        [FromQuery] string? q = null,
        [FromQuery] string? category = null,
        [FromQuery] string? tag = null,
        [FromQuery] string sort = "newest",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 48);

        var query = BaseRecipeQuery().Where(r => r.Status == "approved");

        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(r =>
                r.CategoryEntity != null && r.CategoryEntity.Slug == category);
        }

        if (!string.IsNullOrWhiteSpace(tag))
        {
            query = query.Where(r => r.Tags.Any(t => t.Slug == tag));
        }

        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim();
            query = query.Where(r =>
                EF.Functions.ILike(r.Title, $"%{term}%") ||
                EF.Functions.ILike(r.Ingredients, $"%{term}%") ||
                EF.Functions.ILike(r.Instructions, $"%{term}%") ||
                r.Translations.Any(tr =>
                    EF.Functions.ILike(tr.Title, $"%{term}%") ||
                    EF.Functions.ILike(tr.Ingredients, $"%{term}%") ||
                    EF.Functions.ILike(tr.Instructions, $"%{term}%")));
        }

        query = sort switch
        {
            "popular" => query.OrderByDescending(r => r.ViewCount).ThenByDescending(r => r.Likes.Count),
            "rating" => query.OrderByDescending(r => r.Ratings.Average(x => (double?)x.Value) ?? 0),
            _ => query.OrderByDescending(r => r.CreatedAt)
        };

        var total = await query.CountAsync(cancellationToken);
        var recipes = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var items = recipes.Select(r => RecipeMapper.ToCard(r, lang)).ToList();
        return Ok(new PagedResult<RecipeCardDto>(items, total, page, pageSize));
    }

    [HttpGet("featured")]
    public async Task<IActionResult> Featured([FromQuery] string lang = "bg", CancellationToken cancellationToken = default)
    {
        var recipes = await BaseRecipeQuery()
            .Where(r => r.Status == "approved" && r.IsFeatured)
            .OrderByDescending(r => r.CreatedAt)
            .Take(6)
            .ToListAsync(cancellationToken);

        if (recipes.Count == 0)
        {
            recipes = await BaseRecipeQuery()
                .Where(r => r.Status == "approved")
                .OrderByDescending(r => r.CreatedAt)
                .Take(5)
                .ToListAsync(cancellationToken);
        }

        return Ok(recipes.Select(r => RecipeMapper.ToCard(r, lang)));
    }

    [HttpGet("popular")]
    public async Task<IActionResult> Popular([FromQuery] string lang = "bg", CancellationToken cancellationToken = default)
    {
        var recipes = await BaseRecipeQuery()
            .Where(r => r.Status == "approved")
            .OrderByDescending(r => r.ViewCount)
            .ThenByDescending(r => r.Likes.Count)
            .Take(8)
            .ToListAsync(cancellationToken);

        return Ok(recipes.Select(r => RecipeMapper.ToCard(r, lang)));
    }

    [HttpGet("my-recipes")]
    [Authorize]
    public async Task<IActionResult> GetMyRecipes([FromQuery] string lang = "bg", CancellationToken cancellationToken = default)
    {
        if (!TryGetUserId(out var currentUserId))
            return Unauthorized();

        var recipes = await BaseRecipeQuery()
           .Where(r => r.AuthorId == currentUserId)
           .OrderByDescending(r => r.CreatedAt)
           .ToListAsync(cancellationToken);

        return Ok(recipes.Select(r => RecipeMapper.ToCard(r, lang)));
    }

    [HttpGet("favorites")]
    [Authorize]
    public async Task<IActionResult> GetFavorites([FromQuery] string lang = "bg", CancellationToken cancellationToken = default)
    {
        if (!TryGetUserId(out var currentUserId))
            return Unauthorized();

        var recipes = await BaseRecipeQuery()
            .Where(r => r.Favorites.Any(f => f.UserId == currentUserId) && r.Status == "approved")
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);

        return Ok(recipes.Select(r => RecipeMapper.ToCard(r, lang)));
    }

    [HttpGet("pending")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Pending([FromQuery] string lang = "bg", CancellationToken cancellationToken = default)
    {
        var recipes = await BaseRecipeQuery()
            .Where(r => r.Status == "pending")
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);

        return Ok(recipes.Select(r => RecipeMapper.ToCard(r, lang)));
    }

    [HttpGet("{idOrSlug}/similar")]
    public async Task<IActionResult> Similar(string idOrSlug, [FromQuery] string lang = "bg", CancellationToken cancellationToken = default)
    {
        var recipe = await FindRecipeAsync(idOrSlug, cancellationToken);
        if (recipe == null) return NotFound();

        var similar = await BaseRecipeQuery()
            .Where(r => r.Status == "approved" && r.Id != recipe.Id && r.CategoryId == recipe.CategoryId)
            .OrderByDescending(r => r.Likes.Count)
            .Take(4)
            .ToListAsync(cancellationToken);

        if (similar.Count < 4)
        {
            var takenIds = similar.Select(s => s.Id).ToList();
            takenIds.Add(recipe.Id);
            var extra = await BaseRecipeQuery()
                .Where(r => r.Status == "approved" && !takenIds.Contains(r.Id))
                .OrderByDescending(r => r.CreatedAt)
                .Take(4 - similar.Count)
                .ToListAsync(cancellationToken);
            similar.AddRange(extra);
        }

        return Ok(similar.Select(r => RecipeMapper.ToCard(r, lang)));
    }

    [HttpGet("{idOrSlug}")]
    public async Task<IActionResult> GetById(string idOrSlug, [FromQuery] string lang = "bg", CancellationToken cancellationToken = default)
    {
        var recipe = await FindRecipeAsync(idOrSlug, cancellationToken);
        if (recipe == null) return NotFound();

        TryGetUserId(out var userId);
        var isOwnerOrAdmin = userId == recipe.AuthorId || User.IsInRole("Admin");
        if (recipe.Status != "approved" && !isOwnerOrAdmin)
            return NotFound();

        if (recipe.Status == "approved" && userId != recipe.AuthorId)
        {
            recipe.ViewCount++;
            await _context.SaveChangesAsync(cancellationToken);
        }

        return Ok(RecipeMapper.ToDetail(recipe, lang, userId == 0 ? null : userId));
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create([FromForm] CreateRecipeDto dto, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var authorId))
            return Unauthorized();

        var currentUser = await _context.Users.FindAsync(new object[] { authorId }, cancellationToken);
        if (currentUser == null)
            return Unauthorized();

        if (!currentUser.EmailConfirmed)
            return BadRequest(new { error = "Трябва да потвърдите имейла си, преди да публикувате рецепта. Проверете пощата си или поискайте нов линк за потвърждение." });

        if (!dto.AgreedToTerms)
            return BadRequest(new { error = "Трябва да приемете условията за публикуване, за да качите рецепта." });

        var tagIds = ParseTagIds(dto.TagsJson);
        if (tagIds.Count < MinTags || tagIds.Count > MaxTags)
            return BadRequest(new { error = $"Изберете между {MinTags} и {MaxTags} тага за рецептата." });

        var tags = await _context.Tags.Where(t => tagIds.Contains(t.Id)).ToListAsync(cancellationToken);
        if (tags.Count != tagIds.Count)
            return BadRequest(new { error = "Един или повече избрани тагове не съществуват." });

        var isAdmin = User.IsInRole("Admin");
        var (imageUrl, thumbnailUrl) = await SaveImageAsync(dto.ImageFile, cancellationToken);
        var category = await ResolveCategoryAsync(dto, cancellationToken);

        var recipe = new Recipe
        {
            Title = dto.Title,
            Category = category.Name,
            CategoryId = category.Id,
            Ingredients = dto.Ingredients,
            Instructions = dto.Instructions,
            ImageUrl = imageUrl,
            ThumbnailUrl = thumbnailUrl,
            AuthorId = authorId,
            CreatedAt = DateTime.UtcNow,
            // Post-moderation: every recipe is published immediately;
            // admins remove inappropriate ones afterwards.
            Status = "approved",
            IsFeatured = isAdmin && dto.IsFeatured,
            PrepTimeMinutes = dto.PrepTimeMinutes,
            CookTimeMinutes = dto.CookTimeMinutes,
            Servings = dto.Servings <= 0 ? 4 : dto.Servings,
            Difficulty = string.IsNullOrWhiteSpace(dto.Difficulty) ? "medium" : dto.Difficulty,
            AgreedToTermsAt = DateTime.UtcNow,
            TermsVersion = "1.0"
        };

        foreach (var t in tags)
            recipe.Tags.Add(t);

        ApplyStructuredContent(recipe, dto);
        recipe.Slug = SlugHelper.Unique(
            SlugHelper.Slugify(recipe.Title),
            s => _context.Recipes.Any(r => r.Slug == s));

        await AddEnglishTranslationAsync(recipe, cancellationToken);

        _context.Recipes.Add(recipe);
        await _context.SaveChangesAsync(cancellationToken);

        var auditService = HttpContext.RequestServices.GetRequiredService<IAuditLogService>();
        await auditService.LogActionAsync(
            authorId,
            "Create",
            "Recipe",
            recipe.Id,
            $"Рецепта '{recipe.Title}' със статус '{recipe.Status}'"
        );

        return CreatedAtAction(nameof(GetById), new { idOrSlug = recipe.Slug }, RecipeMapper.ToDetail(recipe, "bg", authorId));
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> Update(int id, [FromForm] RecipeUpdateDto dto, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var currentUserId))
            return Unauthorized();

        var recipe = await FindRecipeAsync(id.ToString(), cancellationToken);
        if (recipe == null) return NotFound();

        if (!await CanEditWithAuditAsync(recipe, currentUserId, "Update"))
            return Forbid();

        var originalTitle = recipe.Title;  // For audit log

        if (dto.ImageFile != null && dto.ImageFile.Length > 0)
        {
            if (!string.IsNullOrEmpty(recipe.ImageUrl)) _fileStorage.DeleteFile(recipe.ImageUrl);
            if (!string.IsNullOrEmpty(recipe.ThumbnailUrl)) _fileStorage.DeleteFile(recipe.ThumbnailUrl);
            var upload = await SaveImageAsync(dto.ImageFile, cancellationToken);
            recipe.ImageUrl = upload.imageUrl;
            recipe.ThumbnailUrl = upload.thumbnailUrl;
        }

        if (!string.IsNullOrWhiteSpace(dto.TagsJson))
        {
            var tagIds = ParseTagIds(dto.TagsJson);
            if (tagIds.Count < MinTags || tagIds.Count > MaxTags)
                return BadRequest(new { error = $"Изберете между {MinTags} и {MaxTags} тага за рецептата." });

            var tags = await _context.Tags.Where(t => tagIds.Contains(t.Id)).ToListAsync(cancellationToken);
            if (tags.Count != tagIds.Count)
                return BadRequest(new { error = "Един или повече избрани тагове не съществуват." });

            recipe.Tags.Clear();
            foreach (var t in tags)
                recipe.Tags.Add(t);
        }

        var category = await ResolveCategoryAsync(dto, cancellationToken);
        recipe.Title = dto.Title;
        recipe.Category = category.Name;
        recipe.CategoryId = category.Id;
        recipe.Ingredients = dto.Ingredients;
        recipe.Instructions = dto.Instructions;
        recipe.PrepTimeMinutes = dto.PrepTimeMinutes;
        recipe.CookTimeMinutes = dto.CookTimeMinutes;
        recipe.Servings = dto.Servings <= 0 ? recipe.Servings : dto.Servings;
        recipe.Difficulty = string.IsNullOrWhiteSpace(dto.Difficulty) ? recipe.Difficulty : dto.Difficulty;
        if (User.IsInRole("Admin"))
            recipe.IsFeatured = dto.IsFeatured;

        ApplyStructuredContent(recipe, dto, replace: true);
        await AddEnglishTranslationAsync(recipe, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        // Audit log
        var auditService = HttpContext.RequestServices.GetRequiredService<IAuditLogService>();
        await auditService.LogActionAsync(
            currentUserId,
            "Update",
            "Recipe",
            id,
            $"Рецепта '{originalTitle}' → '{recipe.Title}'"
        );

        return Ok(RecipeMapper.ToDetail(recipe, "bg", recipe.AuthorId));
    }

    // POST: api/v1/recipes/backfill-translations
    // Admin tool: generates the missing English translation for every recipe
    // that doesn't have one yet (e.g. recipes created by the database seeder,
    // which bypasses Create()/Update()).
    [HttpPost("backfill-translations")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> BackfillTranslations(CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var adminId))
            return Unauthorized();

        var auditService = HttpContext.RequestServices.GetRequiredService<IAuditLogService>();
        const int batchSize = 100;
        var totalProcessed = 0;

        // No Skip(): every processed recipe gets an "en" translation and drops out
        // of the filter by itself, so always taking the first batch is correct.
        while (true)
        {
            var recipes = await _context.Recipes
                .Include(r => r.Translations)
                .Where(r => !r.Translations.Any(t => t.Language == "en"))
                .Take(batchSize)
                .ToListAsync(cancellationToken);

            if (recipes.Count == 0) break;

            foreach (var recipe in recipes)
            {
                await AddEnglishTranslationAsync(recipe, cancellationToken);
            }

            await _context.SaveChangesAsync(cancellationToken);
            totalProcessed += recipes.Count;
        }

        // Audit log
        await auditService.LogActionAsync(
            adminId,
            "BackfillTranslations",
            "Recipe",
            null,
            $"Обновени {totalProcessed} рецепти с английски преводи"
        );

        return Ok(new { processed = totalProcessed });
    }

    [HttpPost("{id}/approve")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Approve(int id, CancellationToken cancellationToken)
    {
        var recipe = await _context.Recipes.FindAsync(new object[] { id }, cancellationToken);
        if (recipe == null) return NotFound();

        if (!TryGetUserId(out var adminId))
            return Unauthorized();

        recipe.Status = "approved";
        await _context.SaveChangesAsync(cancellationToken);

        // Audit log
        var auditService = HttpContext.RequestServices.GetRequiredService<IAuditLogService>();
        await auditService.LogActionAsync(
            adminId,
            "Approve",
            "Recipe",
            id,
            $"Одобрена рецепта '{recipe.Title}' от {recipe.AuthorId}"
        );

        return Ok(new { recipe.Id, recipe.Status });
    }

    [HttpPost("{id}/reject")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Reject(int id, CancellationToken cancellationToken)
    {
        var recipe = await _context.Recipes.FindAsync(new object[] { id }, cancellationToken);
        if (recipe == null) return NotFound();

        if (!TryGetUserId(out var adminId))
            return Unauthorized();

        recipe.Status = "rejected";
        await _context.SaveChangesAsync(cancellationToken);

        // Audit log
        var auditService = HttpContext.RequestServices.GetRequiredService<IAuditLogService>();
        await auditService.LogActionAsync(
            adminId,
            "Reject",
            "Recipe",
            id,
            $"Отхвърлена рецепта '{recipe.Title}' от {recipe.AuthorId}"
        );

        return Ok(new { recipe.Id, recipe.Status });
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var currentUserId))
            return Unauthorized();

        var recipe = await _context.Recipes.FindAsync(new object[] { id }, cancellationToken);
        if (recipe == null) return NotFound();
        if (!await CanEditWithAuditAsync(recipe, currentUserId, "Delete"))
            return Forbid();

        var recipeTitle = recipe.Title;  // Capture for logging
        var recipeAuthorId = recipe.AuthorId;

        try
        {
            if (!string.IsNullOrEmpty(recipe.ImageUrl))
                _fileStorage.DeleteFile(recipe.ImageUrl);
            if (!string.IsNullOrEmpty(recipe.ThumbnailUrl))
                _fileStorage.DeleteFile(recipe.ThumbnailUrl);

            _context.Recipes.Remove(recipe);
            await _context.SaveChangesAsync(cancellationToken);

            // Audit log
            var auditLog = HttpContext.RequestServices.GetRequiredService<IAuditLogService>();
            await auditLog.LogActionAsync(
                currentUserId,
                "Delete",
                "Recipe",
                id,
                $"Рецепта '{recipeTitle}' от потребител {recipeAuthorId}"
            );

            return Ok(new { message = "Рецептата е успешно изтрита.", recipeId = id });
        }
        catch (Exception ex)
        {
            var auditLog = HttpContext.RequestServices.GetRequiredService<IAuditLogService>();
            await auditLog.LogActionAsync(
                currentUserId,
                "Delete (FAILED)",
                "Recipe",
                id,
                $"Грешка: {ex.Message}"
            );
            throw;
        }
    }

    private IQueryable<Recipe> BaseRecipeQuery() =>
        _context.Recipes
            .Include(r => r.Translations)
            .Include(r => r.Author)
            .Include(r => r.CategoryEntity)
            .Include(r => r.Likes)
            .Include(r => r.Comments)
            .Include(r => r.Favorites)
            .Include(r => r.Ratings)
            .Include(r => r.IngredientItems)
            .Include(r => r.Steps)
            .Include(r => r.Media)
            .Include(r => r.Tags);

    private async Task<Recipe?> FindRecipeAsync(string idOrSlug, CancellationToken cancellationToken)
    {
        var query = BaseRecipeQuery().AsQueryable();
        if (int.TryParse(idOrSlug, out var id))
            return await query.FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
        return await query.FirstOrDefaultAsync(r => r.Slug == idOrSlug, cancellationToken);
    }

    private bool TryGetUserId(out int userId)
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(claim, out userId);
    }

    private bool CanEdit(Recipe recipe)
    {
        TryGetUserId(out var currentUserId);
        return recipe.AuthorId == currentUserId || User.IsInRole("Admin");
    }

    private async Task<(string? imageUrl, string? thumbnailUrl)> SaveImageAsync(IFormFile? file, CancellationToken cancellationToken)
    {
        if (file == null || file.Length == 0)
            return (null, null);
        var upload = await _fileStorage.SaveFileAsync(file, "uploads", cancellationToken);
        return (upload.MainImageUrl, upload.ThumbnailUrl);
    }

    private async Task<Category> ResolveCategoryAsync(CreateRecipeDto dto, CancellationToken cancellationToken)
    {
        Category? category = null;
        if (dto.CategoryId.HasValue)
            category = await _context.Categories.FindAsync(new object[] { dto.CategoryId.Value }, cancellationToken);
        if (category == null && !string.IsNullOrWhiteSpace(dto.Category))
        {
            category = await _context.Categories.FirstOrDefaultAsync(c =>
                c.Slug == dto.Category || c.Name == dto.Category, cancellationToken);
        }
        category ??= await _context.Categories.OrderBy(c => c.SortOrder).FirstAsync(cancellationToken);
        return category;
    }

    // overload for update DTO
    private async Task<Category> ResolveCategoryAsync(RecipeUpdateDto dto, CancellationToken cancellationToken)
    {
        Category? category = null;
        if (dto.CategoryId.HasValue)
            category = await _context.Categories.FindAsync(new object[] { dto.CategoryId.Value }, cancellationToken);
        if (category == null && !string.IsNullOrWhiteSpace(dto.Category))
        {
            category = await _context.Categories.FirstOrDefaultAsync(c =>
                c.Slug == dto.Category || c.Name == dto.Category, cancellationToken);
        }
        category ??= await _context.Categories.OrderBy(c => c.SortOrder).FirstAsync(cancellationToken);
        return category;
    }

    private static List<int> ParseTagIds(string? tagsJson)
    {
        if (string.IsNullOrWhiteSpace(tagsJson))
            return new List<int>();
        try
        {
            return JsonSerializer.Deserialize<List<int>>(tagsJson) ?? new List<int>();
        }
        catch
        {
            return new List<int>();
        }
    }

    private static void ApplyStructuredContent(Recipe recipe, CreateRecipeDto dto, bool replace = false)
    {
        var ingredientLines = ParseIngredients(dto);
        var stepLines = ParseSteps(dto);

        if (ingredientLines.Count > 0)
        {
            if (replace)
                recipe.IngredientItems.Clear();
            foreach (var item in ingredientLines)
                recipe.IngredientItems.Add(item);
            recipe.Ingredients = string.Join('\n', ingredientLines.Select(i =>
                string.IsNullOrWhiteSpace(i.Amount) ? i.Name : $"{i.Amount} {i.Name}"));
        }
        else if (!string.IsNullOrWhiteSpace(dto.Ingredients))
        {
            if (replace)
                recipe.IngredientItems.Clear();
            var lines = RecipeMapper.SplitLines(dto.Ingredients);
            for (var i = 0; i < lines.Count; i++)
            {
                var parsed = RecipeMapper.ParseIngredient(lines[i]);
                recipe.IngredientItems.Add(new RecipeIngredient
                {
                    SortOrder = i,
                    Amount = parsed.Amount,
                    Name = parsed.Name
                });
            }
        }

        if (stepLines.Count > 0)
        {
            if (replace)
                recipe.Steps.Clear();
            foreach (var step in stepLines)
                recipe.Steps.Add(step);
            recipe.Instructions = string.Join('\n', stepLines.Select(s => s.Text));
        }
        else if (!string.IsNullOrWhiteSpace(dto.Instructions))
        {
            if (replace)
                recipe.Steps.Clear();
            var lines = RecipeMapper.SplitLines(dto.Instructions);
            for (var i = 0; i < lines.Count; i++)
            {
                recipe.Steps.Add(new RecipeStep { SortOrder = i + 1, Text = lines[i] });
            }
        }
    }

    private static List<RecipeIngredient> ParseIngredients(CreateRecipeDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.IngredientsJson))
            return new List<RecipeIngredient>();
        try
        {
            var items = JsonSerializer.Deserialize<List<IngredientLineDto>>(dto.IngredientsJson, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            }) ?? new List<IngredientLineDto>();
            return items.Select((item, i) => new RecipeIngredient
            {
                SortOrder = i,
                Amount = item.Amount ?? string.Empty,
                Name = item.Name
            }).Where(i => !string.IsNullOrWhiteSpace(i.Name)).ToList();
        }
        catch
        {
            return new List<RecipeIngredient>();
        }
    }

    private static List<RecipeStep> ParseSteps(CreateRecipeDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.StepsJson))
            return new List<RecipeStep>();
        try
        {
            var items = JsonSerializer.Deserialize<List<StepLineDto>>(dto.StepsJson, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            }) ?? new List<StepLineDto>();
            return items.Select((item, i) => new RecipeStep
            {
                SortOrder = item.SortOrder == 0 ? i + 1 : item.SortOrder,
                Text = item.Text
            }).Where(s => !string.IsNullOrWhiteSpace(s.Text)).ToList();
        }
        catch
        {
            return new List<RecipeStep>();
        }
    }

    private async Task AddEnglishTranslationAsync(Recipe recipe, CancellationToken cancellationToken)
    {
        string titleEn = await _translationService.TranslateAsync(recipe.Title, "en", "bg", cancellationToken);
        string ingredientsEn = await _translationService.TranslateAsync(recipe.Ingredients, "en", "bg", cancellationToken);
        string instructionsEn = await _translationService.TranslateAsync(recipe.Instructions, "en", "bg", cancellationToken);

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
    }

    /// <summary>
    /// Проверява дали потребителят има право да редактира рецепта.
    /// Логва отказаните опити за достъп. Използване:
    /// if (!await CanEditWithAuditAsync(recipe, currentUserId, "Update")) return Forbid();
    /// </summary>
    private async Task<bool> CanEditWithAuditAsync(Recipe recipe, int currentUserId, string action)
    {
        var isAllowed = recipe.AuthorId == currentUserId || User.IsInRole("Admin");

        if (!isAllowed)
        {
            var auditService = HttpContext.RequestServices.GetRequiredService<IAuditLogService>();
            await auditService.LogActionAsync(
                currentUserId,
                $"{action} (DENIED)",
                "Recipe",
                recipe.Id,
                $"Отказан достъп - потребител {currentUserId} не е собственик на рецепта {recipe.Id}"
            );
        }

        return isAllowed;
    }
}
