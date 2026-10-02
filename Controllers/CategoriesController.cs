using CulinaryBlog.Data;
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
    // Returns top-level categories, each with its subcategories nested under "subCategories".
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
    // Returns every category (parents and subcategories) as a single flat list.
    // Useful for admin screens (e.g. a "parent category" dropdown when creating one).
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
                RecipeCount = c.Recipes.Count(r => r.Status == "approved")
            })
            .ToListAsync();

        return Ok(categories);
    }
}