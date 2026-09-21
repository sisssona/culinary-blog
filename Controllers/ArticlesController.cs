using CulinaryBlog.Data;
using CulinaryBlog.Helpers;
using CulinaryBlog.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace CulinaryBlog.Controllers;

[ApiController]
[Route("api/v1/articles")]
public class ArticlesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ArticlesController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var articles = await _context.Articles
            .Include(a => a.Author)
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new
            {
                a.Id,
                a.Title,
                a.Slug,
                a.Excerpt,
                a.ImageUrl,
                a.CreatedAt,
                AuthorId = a.AuthorId,
                AuthorName = a.Author != null ? a.Author.DisplayName : "Редакция"
            })
            .ToListAsync();

        return Ok(articles);
    }

    [HttpGet("{slug}")]
    public async Task<IActionResult> GetBySlug(string slug)
    {
        var article = await _context.Articles.Include(a => a.Author)
            .FirstOrDefaultAsync(a => a.Slug == slug);
        if (article == null) return NotFound();

        return Ok(new
        {
            article.Id,
            article.Title,
            article.Slug,
            article.Excerpt,
            article.Body,
            article.ImageUrl,
            article.CreatedAt,
            article.AuthorId,
            AuthorName = article.Author?.DisplayName ?? "Редакция"
        });
    }

    public record CreateArticleDto(string Title, string Excerpt, string Body);

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateArticleDto dto)
    {
        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
            return Unauthorized();
        if (string.IsNullOrWhiteSpace(dto.Title) || string.IsNullOrWhiteSpace(dto.Body))
            return BadRequest(new { error = "Заглавие и текст са задължителни." });

        var article = new Article
        {
            Title = dto.Title.Trim(),
            Excerpt = dto.Excerpt?.Trim() ?? "",
            Body = dto.Body.Trim(),
            AuthorId = userId,
            CreatedAt = DateTime.UtcNow
        };
        article.Slug = SlugHelper.Unique(
            SlugHelper.Slugify(article.Title),
            s => _context.Articles.Any(a => a.Slug == s));

        _context.Articles.Add(article);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetBySlug), new { slug = article.Slug }, article);
    }
}
