using CulinaryBlog.Data;
using CulinaryBlog.DTOs;
using CulinaryBlog.Models;
using CulinaryBlog.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CulinaryBlog.Controllers;

[ApiController]
[Route("api/v1/categories")]
public class CategoriesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public CategoriesController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/v1/categories
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var categories = await _context.Categories
            .Include(c => c.SubCategories)
            .Where(c => c.ParentCategoryId == null)
            .OrderBy(c => c.SortOrder)
            .Select(c => new
            {
                c.Id,
                c.Name,
                c.NameEn,
                c.Slug,
                RecipeCount = c.Recipes.Count(r => r.Status == "approved"),
                SubCategories = c.SubCategories
                    .OrderBy(sc => sc.SortOrder)
                    .Select(sc => new
                    {
                        sc.Id,
                        sc.Name,
                        sc.NameEn,
                        sc.Slug,
                        RecipeCount = sc.Recipes.Count(r => r.Status == "approved")
                    })
            })
            .ToListAsync();

        return Ok(categories);
    }

    // GET: api/v1/categories/flat
    [HttpGet("flat")]
    public async Task<IActionResult> GetAllFlat()
    {
        var categories = await _context.Categories
            .OrderBy(c => c.SortOrder)
            .Select(c => new
            {
                c.Id,
                c.Name,
                c.NameEn,
                c.Slug,
                c.ParentCategoryId,
                c.SortOrder,
                RecipeCount = c.Recipes.Count(r => r.Status == "approved")
            })
            .ToListAsync();

        return Ok(categories);
    }

    // POST: api/v1/categories
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CategoryDto dto)
    {
        var category = new Category
        {
            Name = dto.Name,
            NameEn = dto.NameEn,
            Slug = SlugHelper.GenerateSlug(dto.NameEn ?? dto.Name),
            SortOrder = dto.SortOrder,
            ParentCategoryId = dto.ParentCategoryId
        };

        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        return Ok(category);
    }

    // PUT: api/v1/categories/{id}
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] CategoryDto dto)
    {
        var category = await _context.Categories.FindAsync(id);
        if (category == null) return NotFound(new { message = "Категорията не е намерена." });

        category.Name = dto.Name;
        category.NameEn = dto.NameEn;
        category.SortOrder = dto.SortOrder;
        category.ParentCategoryId = dto.ParentCategoryId;

        if (!string.IsNullOrWhiteSpace(dto.NameEn || dto.Name))
        {
            category.Slug = SlugHelper.GenerateSlug(dto.NameEn ?? dto.Name);
        }

        await _context.SaveChangesAsync();
        return Ok(category);
    }

    // DELETE: api/v1/categories/{id}
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var category = await _context.Categories
            .Include(c => c.Recipes)
            .Include(c => c.SubCategories)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (category == null) return NotFound(new { message = "Категорията не е намерена." });

        if (category.Recipes.Any() || category.SubCategories.Any())
        {
            return BadRequest(new { message = "Не може да изтриете категория, която съдържа рецепти или подкатегории." });
        }

        _context.Categories.Remove(category);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Категорията беше изтрита успешно." });
    }
}
