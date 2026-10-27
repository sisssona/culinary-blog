using System.Globalization;
using CulinaryBlog.Data;
using CulinaryBlog.Models;
using CulinaryBlog.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace CulinaryBlog.Controllers;

[ApiController]
[Route("api/v1/products")]
public class ProductsController : ControllerBase
{
    private const long MaxImageBytes = 8 * 1024 * 1024;
    private static readonly string[] ImageExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

    private readonly ApplicationDbContext _context;
    private readonly IFileStorageService _files;
    private readonly IAuditLogService _audit;
    private readonly ContentTranslator _translator;

    public ProductsController(ApplicationDbContext context, IFileStorageService files, IAuditLogService audit, ContentTranslator translator)
    {
        _context = context;
        _files = files;
        _audit = audit;
        _translator = translator;
    }

    public class ProductWriteForm
    {
        public string Name { get; set; } = "";
        public string? Description { get; set; }
        public string Price { get; set; } = "";
        public string? Stock { get; set; }
        public string? Kind { get; set; }
        public string? ExternalUrl { get; set; }
        public bool IsPublished { get; set; } = true;
        public IFormFile? Image { get; set; }
        public bool RemoveImage { get; set; }
        public IFormFile? File { get; set; }
        public bool RemoveFile { get; set; }
    }

    [HttpGet]
    public async Task<IActionResult> GetPublished(CancellationToken cancellationToken)
    {
        await EnsureProductsAsync(cancellationToken);
        var products = await _context.Products
            .AsNoTracking()
            .Where(p => p.IsPublished)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync(cancellationToken);
        return Ok(products.Select(ToDto));
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("manage")]
    public async Task<IActionResult> Manage()
    {
        var products = await _context.Products
            .AsNoTracking()
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
        return Ok(products.Select(ToDto));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetOne(int id, CancellationToken cancellationToken)
    {
        var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        if (product == null || !product.IsPublished) return NotFound();
        if (product.NameEn == null || product.DescriptionEn == null)
        {
            if (await _translator.ApplyProductAsync(product, cancellationToken))
                await _context.SaveChangesAsync(cancellationToken);
        }
        return Ok(ToDto(product));
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    [RequestSizeLimit(52_428_800)]
    public async Task<IActionResult> Create([FromForm] ProductWriteForm form, CancellationToken cancellationToken)
    {
        var parsed = Parse(form);
        if (parsed.Error != null) return BadRequest(new { error = parsed.Error });

        var product = new Product
        {
            Name = parsed.Name,
            Description = parsed.Description,
            Price = parsed.Price,
            Stock = parsed.Stock,
            Kind = parsed.Kind,
            ExternalUrl = parsed.ExternalUrl,
            IsPublished = form.IsPublished,
            CreatedAt = DateTime.UtcNow
        };
        var imageError = await ApplyImageAsync(product, form, cancellationToken);
        if (imageError != null) return imageError;
        var fileError = await ApplyFileAsync(product, form, cancellationToken);
        if (fileError != null) return fileError;

        await _translator.ApplyProductAsync(product, cancellationToken);
        _context.Products.Add(product);
        await _context.SaveChangesAsync(cancellationToken);
        return Ok(ToDto(product));
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:int}")]
    [RequestSizeLimit(52_428_800)]
    public async Task<IActionResult> Update(int id, [FromForm] ProductWriteForm form, CancellationToken cancellationToken)
    {
        var parsed = Parse(form);
        if (parsed.Error != null) return BadRequest(new { error = parsed.Error });

        var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        if (product == null) return NotFound();

        product.Name = parsed.Name;
        product.Description = parsed.Description;
        product.NameEn = null;
        product.DescriptionEn = null;
        product.Price = parsed.Price;
        product.Stock = parsed.Stock;
        product.Kind = parsed.Kind;
        product.ExternalUrl = parsed.ExternalUrl;
        product.IsPublished = form.IsPublished;

        var imageError = await ApplyImageAsync(product, form, cancellationToken);
        if (imageError != null) return imageError;
        var fileError = await ApplyFileAsync(product, form, cancellationToken);
        if (fileError != null) return fileError;

        await _translator.ApplyProductAsync(product, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return Ok(ToDto(product));
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
            return Unauthorized();

        var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == id);
        if (product == null) return NotFound();

        _files.DeleteFile(product.ImageUrl);
        if (!string.IsNullOrEmpty(product.FileKey))
        {
            var used = await _context.ShopOrderItems.AnyAsync(i => i.FileKey == product.FileKey);
            if (!used) _files.DeletePrivateFile(product.FileKey);
        }
        _context.Products.Remove(product);
        await _context.SaveChangesAsync();
        await _audit.LogActionAsync(userId, "Delete", "Product", id, product.Name);
        return NoContent();
    }

    private static readonly string[] Kinds = ["stock", "printful", "digital", "external"];

    private static (string Name, string Description, decimal Price, int? Stock, string Kind, string? ExternalUrl, string? Error) Parse(ProductWriteForm form)
    {
        var name = form.Name?.Trim() ?? "";
        if (name.Length == 0) return ("", "", 0, null, "stock", null, "Името е задължително.");
        if (name.Length > 160) name = name[..160];

        var kind = (form.Kind ?? "stock").Trim().ToLowerInvariant();
        if (!Kinds.Contains(kind)) return ("", "", 0, null, "stock", null, "Избери вид на продукта.");

        if (!decimal.TryParse((form.Price ?? "").Trim().Replace(',', '.'), NumberStyles.Number, CultureInfo.InvariantCulture, out var price)
            || price < 0 || price > 99999 || (kind != "external" && price <= 0))
            return ("", "", 0, null, kind, null, "Цената трябва да е число, по-голямо от 0.");

        int? stock = null;
        if (kind == "stock" && !string.IsNullOrWhiteSpace(form.Stock))
        {
            if (!int.TryParse(form.Stock.Trim(), out var parsedStock) || parsedStock < 0)
                return ("", "", 0, null, kind, null, "Наличността трябва да е цяло число.");
            stock = parsedStock;
        }

        string? externalUrl = null;
        if (kind == "external")
        {
            externalUrl = (form.ExternalUrl ?? "").Trim();
            if (externalUrl.Length == 0 || externalUrl.Length > 500
                || !(externalUrl.StartsWith("https://", StringComparison.OrdinalIgnoreCase) || externalUrl.StartsWith("http://", StringComparison.OrdinalIgnoreCase)))
                return ("", "", 0, null, kind, null, "Външната връзка трябва да започва с http:// или https://.");
        }

        var description = (form.Description ?? "").Trim();
        return (name, description, decimal.Round(price, 2), stock, kind, externalUrl, null);
    }

    private async Task<IActionResult?> ApplyImageAsync(Product product, ProductWriteForm form, CancellationToken cancellationToken)
    {
        var image = form.Image;
        if (image != null && image.Length > 0)
        {
            var extension = Path.GetExtension(image.FileName).ToLowerInvariant();
            if (!ImageExtensions.Contains(extension) || image.Length > MaxImageBytes)
                return BadRequest(new { error = "Снимката трябва да е JPG, PNG, WEBP или GIF и да е до 8 MB." });

            var previous = product.ImageUrl;
            var upload = await _files.SaveFileAsync(image, "uploads", cancellationToken);
            _files.DeleteFile(upload.ThumbnailUrl);
            product.ImageUrl = upload.MainImageUrl;
            if (!string.IsNullOrEmpty(previous))
                _files.DeleteFile(previous);
            return null;
        }

        if (form.RemoveImage && !string.IsNullOrEmpty(product.ImageUrl))
        {
            _files.DeleteFile(product.ImageUrl);
            product.ImageUrl = null;
        }

        return null;
    }

    private async Task<IActionResult?> ApplyFileAsync(Product product, ProductWriteForm form, CancellationToken cancellationToken)
    {
        if (product.Kind != "digital")
        {
            if (!string.IsNullOrEmpty(product.FileKey))
            {
                var used = await _context.ShopOrderItems.AnyAsync(i => i.FileKey == product.FileKey, cancellationToken);
                if (!used) _files.DeletePrivateFile(product.FileKey);
                product.FileKey = null;
                product.FileName = null;
            }
            return null;
        }

        var file = form.File;
        if (file != null && file.Length > 0)
        {
            var previous = product.FileKey;
            try
            {
                product.FileKey = await _files.SavePrivateFileAsync(file, cancellationToken);
                product.FileName = Path.GetFileName(file.FileName);
                if (!string.IsNullOrEmpty(product.FileName) && product.FileName.Length > 200)
                    product.FileName = product.FileName[..200];
            }
            catch (BadHttpRequestException ex)
            {
                return BadRequest(new { error = ex.Message });
            }

            if (!string.IsNullOrEmpty(previous))
            {
                var used = await _context.ShopOrderItems.AnyAsync(i => i.FileKey == previous, cancellationToken);
                if (!used) _files.DeletePrivateFile(previous);
            }
            return null;
        }

        if (form.RemoveFile && !string.IsNullOrEmpty(product.FileKey))
        {
            var used = await _context.ShopOrderItems.AnyAsync(i => i.FileKey == product.FileKey, cancellationToken);
            if (!used) _files.DeletePrivateFile(product.FileKey);
            product.FileKey = null;
            product.FileName = null;
        }

        if (string.IsNullOrEmpty(product.FileKey))
            return BadRequest(new { error = "Качи PDF, EPUB или ZIP за този файл." });
        return null;
    }

    private async Task EnsureProductsAsync(CancellationToken cancellationToken)
    {
        var pending = await _context.Products
            .Where(p => p.NameEn == null || p.DescriptionEn == null)
            .ToListAsync(cancellationToken);
        var changed = false;
        foreach (var product in pending)
        {
            if (await _translator.ApplyProductAsync(product, cancellationToken))
                changed = true;
        }

        if (changed)
            await _context.SaveChangesAsync(cancellationToken);
    }

    private static object ToDto(Product product) => new
    {
        product.Id,
        product.Name,
        product.NameEn,
        product.Description,
        product.DescriptionEn,
        product.Price,
        product.Stock,
        product.ImageUrl,
        product.Kind,
        product.ExternalUrl,
        product.FileName,
        HasFile = !string.IsNullOrEmpty(product.FileKey),
        product.IsPublished,
        product.CreatedAt
    };
}
