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

    [Authorize(Roles = "Admin")]
    [HttpGet("admin")]
    public async Task<IActionResult> ListForAdmin()
    {
        var users = await _context.Users
            .OrderBy(u => u.Email)
            .Select(u => new
            {
                u.Id,
                u.Email,
                u.DisplayName,
                u.Role,
                u.EmailConfirmed,
                u.CreatedAt
            })
            .ToListAsync();

        return Ok(users);
    }

    public record SetRoleDto(string Role);

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:int}/role")]
    public async Task<IActionResult> SetRole(int id, [FromBody] SetRoleDto dto)
    {
        var role = dto.Role?.Trim();
        if (role is not ("Admin" or "User"))
            return BadRequest(new { error = "Невалидна роля." });

        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound();

        if (!string.Equals(user.Role, role, StringComparison.Ordinal))
        {
            if (string.Equals(user.Role, "Admin", StringComparison.Ordinal) && role == "User")
            {
                var adminCount = await _context.Users.CountAsync(u => u.Role == "Admin");
                if (adminCount <= 1)
                    return BadRequest(new { error = "Трябва да остане поне един администратор." });
            }

            user.Role = role;
            await _context.SaveChangesAsync();
        }

        return Ok(new { user.Id, user.Email, user.DisplayName, user.Role });
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
