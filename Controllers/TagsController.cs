using CulinaryBlog.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CulinaryBlog.Controllers;

[ApiController]
[Route("api/v1/tags")]
public class TagsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public TagsController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/v1/tags
    // Returns every tag, grouped (time/occasion/diet/difficulty/method) — used to
    // render the full tag picker in AddRecipePage.
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var tags = await _context.Tags
            .OrderBy(t => t.Group)
            .ThenBy(t => t.Name)
            .Select(t => new { t.Id, t.Name, t.NameEn, t.Slug, t.Group })
            .ToListAsync();

        return Ok(tags);
    }

    // GET: api/v1/tags/search?q=без
    // Autosuggest: matches tag names (BG or EN) containing the query, case-insensitive.
    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string q = "")
    {
        if (string.IsNullOrWhiteSpace(q))
            return Ok(Array.Empty<object>());

        var term = q.Trim();
        var tags = await _context.Tags
            .Where(t => EF.Functions.ILike(t.Name, $"%{term}%") || EF.Functions.ILike(t.NameEn, $"%{term}%"))
            .OrderBy(t => t.Name)
            .Take(10)
            .Select(t => new { t.Id, t.Name, t.NameEn, t.Slug, t.Group })
            .ToListAsync();

        return Ok(tags);
    }
}