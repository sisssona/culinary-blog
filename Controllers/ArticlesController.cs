using CulinaryBlog.Data;
using CulinaryBlog.Helpers;
using CulinaryBlog.Models;
using CulinaryBlog.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace CulinaryBlog.Controllers;

[ApiController]
[Route("api/v1/articles")]
public class ArticlesController : ControllerBase
{
    private const long MaxImageBytes = 8 * 1024 * 1024;
    private static readonly string[] ImageExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

    private readonly ApplicationDbContext _context;
    private readonly IFileStorageService _files;
    private readonly ContentTranslator _translator;

    public ArticlesController(ApplicationDbContext context, IFileStorageService files, ContentTranslator translator)
    {
        _context = context;
        _files = files;
        _translator = translator;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        await EnsureArticlesAsync(cancellationToken);

        var articles = await _context.Articles
            .Include(a => a.Author)
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new
            {
                a.Id,
                a.Title,
                a.TitleEn,
                a.Slug,
                a.Excerpt,
                a.ExcerptEn,
                a.ImageUrl,
                a.CreatedAt,
                AuthorId = a.AuthorId,
                AuthorName = a.Author != null ? a.Author.DisplayName : "Кулинарен екип"
            })
            .ToListAsync(cancellationToken);

        return Ok(articles);
    }

    [HttpGet("{slug}")]
    public async Task<IActionResult> GetBySlug(string slug, CancellationToken cancellationToken)
    {
        var article = await _context.Articles.Include(a => a.Author)
            .FirstOrDefaultAsync(a => a.Slug == slug, cancellationToken);
        if (article == null) return NotFound();

        if (article.TitleEn == null || article.ExcerptEn == null || article.BodyEn == null)
        {
            if (await _translator.ApplyArticleAsync(article, cancellationToken))
                await _context.SaveChangesAsync(cancellationToken);
        }

        return Ok(new
        {
            article.Id,
            article.Title,
            article.TitleEn,
            article.Slug,
            article.Excerpt,
            article.ExcerptEn,
            article.Body,
            article.BodyEn,
            article.ImageUrl,
            article.CreatedAt,
            article.AuthorId,
            AuthorName = article.Author?.DisplayName ?? "Кулинарен екип"
        });
    }

    public class ArticleWriteForm
    {
        public string Title { get; set; } = "";
        public string? Excerpt { get; set; }
        public string Body { get; set; } = "";
        public IFormFile? Image { get; set; }
        public bool RemoveImage { get; set; }
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    [RequestSizeLimit(52_428_800)]
    public async Task<IActionResult> Create([FromForm] ArticleWriteForm form, CancellationToken cancellationToken)
    {
        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
            return Unauthorized();
        if (string.IsNullOrWhiteSpace(form.Title) || string.IsNullOrWhiteSpace(form.Body))
            return BadRequest(new { error = "Заглавие и текст са задължителни." });

        var body = form.Body.Trim();
        var article = new Article
        {
            Title = form.Title.Trim(),
            Excerpt = string.IsNullOrWhiteSpace(form.Excerpt) ? MakeExcerpt(body) : form.Excerpt.Trim(),
            Body = body,
            AuthorId = userId,
            CreatedAt = DateTime.UtcNow
        };
        article.Slug = SlugHelper.Unique(
            SlugHelper.Slugify(article.Title),
            s => _context.Articles.Any(a => a.Slug == s));

        var imageError = await ApplyImageAsync(article, form, cancellationToken);
        if (imageError != null) return imageError;

        await _translator.ApplyArticleAsync(article, cancellationToken);
        _context.Articles.Add(article);
        await _context.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(GetBySlug), new { slug = article.Slug }, ToDto(article));
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:int}")]
    [RequestSizeLimit(52_428_800)]
    public async Task<IActionResult> Update(int id, [FromForm] ArticleWriteForm form, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(form.Title) || string.IsNullOrWhiteSpace(form.Body))
            return BadRequest(new { error = "Заглавие и текст са задължителни." });

        var article = await _context.Articles.FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
        if (article == null) return NotFound();

        var body = form.Body.Trim();
        article.Title = form.Title.Trim();
        article.Body = body;
        article.Excerpt = string.IsNullOrWhiteSpace(form.Excerpt) ? MakeExcerpt(body) : form.Excerpt.Trim();

        article.TitleEn = null;
        article.ExcerptEn = null;
        article.BodyEn = null;

        var imageError = await ApplyImageAsync(article, form, cancellationToken);
        if (imageError != null) return imageError;

        await _translator.ApplyArticleAsync(article, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return Ok(ToDto(article));
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var article = await _context.Articles.FirstOrDefaultAsync(a => a.Id == id);
        if (article == null) return NotFound();

        _files.DeleteFile(article.ImageUrl);
        _context.Articles.Remove(article);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    private async Task<IActionResult?> ApplyImageAsync(Article article, ArticleWriteForm form, CancellationToken cancellationToken)
    {
        var image = form.Image;
        if (image != null && image.Length > 0)
        {
            var extension = Path.GetExtension(image.FileName).ToLowerInvariant();
            if (!ImageExtensions.Contains(extension) || image.Length > MaxImageBytes)
                return BadRequest(new { error = "Снимката трябва да е JPG, PNG, WEBP или GIF и да е до 8 MB." });

            var previous = article.ImageUrl;
            var upload = await _files.SaveFileAsync(image, "uploads", cancellationToken);
            _files.DeleteFile(upload.ThumbnailUrl);
            article.ImageUrl = upload.MainImageUrl;
            if (!string.IsNullOrEmpty(previous))
                _files.DeleteFile(previous);
            return null;
        }

        if (form.RemoveImage && !string.IsNullOrEmpty(article.ImageUrl))
        {
            _files.DeleteFile(article.ImageUrl);
            article.ImageUrl = null;
        }

        return null;
    }

    private static object ToDto(Article article) => new
    {
        article.Id,
        article.Title,
        article.TitleEn,
        article.Slug,
        article.Excerpt,
        article.ExcerptEn,
        article.Body,
        article.BodyEn,
        article.ImageUrl,
        article.CreatedAt,
        article.AuthorId
    };

    private async Task EnsureArticlesAsync(CancellationToken cancellationToken)
    {
        var pending = await _context.Articles
            .Where(a => a.TitleEn == null || a.ExcerptEn == null || a.BodyEn == null)
            .ToListAsync(cancellationToken);
        var changed = false;
        foreach (var article in pending)
        {
            if (await _translator.ApplyArticleAsync(article, cancellationToken))
                changed = true;
        }

        if (changed)
            await _context.SaveChangesAsync(cancellationToken);
    }

    private static string MakeExcerpt(string body)
    {
        var flat = string.Join(' ', body.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries));
        if (flat.Length <= 180) return flat;
        return flat[..177].TrimEnd() + "...";
    }
}
