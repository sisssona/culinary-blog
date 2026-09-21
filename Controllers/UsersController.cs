using CulinaryBlog.Data;
using CulinaryBlog.DTOs;
using CulinaryBlog.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace CulinaryBlog.Controllers;

[ApiController]
[Route("api/v1/users")]
public class UsersController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public UsersController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetCook(int id, [FromQuery] string lang = "bg")
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound();

        var recipes = await _context.Recipes
            .Include(r => r.Translations)
            .Include(r => r.Author)
            .Include(r => r.CategoryEntity)
            .Include(r => r.Likes)
            .Include(r => r.Comments)
            .Include(r => r.Favorites)
            .Include(r => r.Ratings)
            .Where(r => r.AuthorId == id && r.Status == "approved")
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        return Ok(new
        {
            user.Id,
            user.DisplayName,
            user.Bio,
            RecipeCount = recipes.Count,
            Recipes = recipes.Select(r => RecipeMapper.ToCard(r, lang))
        });
    }

    [Authorize]
    [HttpPut("me")]
    public async Task<IActionResult> UpdateMe([FromBody] UpdateProfileDto dto)
    {
        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
            return Unauthorized();

        var user = await _context.Users.FindAsync(userId);
        if (user == null) return NotFound();

        user.DisplayName = dto.DisplayName.Trim();
        user.Bio = dto.Bio?.Trim() ?? "";
        await _context.SaveChangesAsync();

        return Ok(new { user.Id, user.Email, user.DisplayName, user.Bio, user.Role });
    }
}
