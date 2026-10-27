using System.ComponentModel.DataAnnotations;
using System.IO.Compression;
using CulinaryBlog.Data;
using CulinaryBlog.Models;
using CulinaryBlog.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CulinaryBlog.Controllers;

[ApiController]
[Route("api/v1/orders")]
public class ShopOrdersController : ControllerBase
{
    private static readonly string[] Statuses = ["awaiting_payment", "new", "confirmed", "sent", "done", "cancelled"];
    private static readonly string[] PaidStatuses = ["confirmed", "sent", "done"];
    private static readonly string[] Payments = ["cod", "contact", "bank"];

    private readonly ApplicationDbContext _context;
    private readonly IEmailService _email;
    private readonly IFileStorageService _files;
    private readonly IConfiguration _config;
    private readonly ILogger<ShopOrdersController> _logger;

    public ShopOrdersController(
        ApplicationDbContext context,
        IEmailService email,
        IFileStorageService files,
        IConfiguration config,
        ILogger<ShopOrdersController> logger)
    {
        _context = context;
        _email = email;
        _files = files;
        _config = config;
        _logger = logger;
    }

    public class OrderItemRequest
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
    }

    public class CreateOrderRequest
    {
        [Required]
        public string CustomerName { get; set; } = "";
        [Required]
        public string Phone { get; set; } = "";
        public string? Email { get; set; }
        public string? City { get; set; }
        public string? Address { get; set; }
        public string? Note { get; set; }
        public string PaymentMethod { get; set; } = "cod";
        public List<OrderItemRequest> Items { get; set; } = new();
    }

    public class StatusRequest
    {
        public string Status { get; set; } = "";
    }

    [Authorize(Roles = "Admin")]
    [HttpGet]
    public async Task<IActionResult> List()
    {
        var orders = await _context.ShopOrders
            .AsNoTracking()
            .Include(o => o.Items)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();
        return Ok(orders.Select(ToDto));
    }

    [HttpGet("download/{token}")]
    public async Task<IActionResult> Download(string token)
    {
        if (string.IsNullOrWhiteSpace(token)) return NotFound();
        var order = await _context.ShopOrders.Include(o => o.Items).FirstOrDefaultAsync(o => o.DownloadToken == token);
        if (order == null || !PaidStatuses.Contains(order.Status)) return NotFound();

        var files = order.Items
            .Where(i => i.Kind == "digital" && !string.IsNullOrEmpty(i.FileKey))
            .Select(i => new { Path = _files.PrivateFilePath(i.FileKey), Name = string.IsNullOrWhiteSpace(i.FileName) ? "file" : i.FileName })
            .Where(i => i.Path != null)
            .ToList();
        if (files.Count == 0) return NotFound();
        if (files.Count == 1)
            return PhysicalFile(files[0].Path!, ContentType(files[0].Name), files[0].Name);

        var memory = new MemoryStream();
        using (var zip = new ZipArchive(memory, ZipArchiveMode.Create, leaveOpen: true))
        {
            var used = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            foreach (var file in files)
            {
                var name = file.Name;
                if (!used.Add(name)) name = $"{used.Count}-{name}";
                var entry = zip.CreateEntry(name, CompressionLevel.Fastest);
                await using var entryStream = entry.Open();
                await using var source = System.IO.File.OpenRead(file.Path!);
                await source.CopyToAsync(entryStream);
            }
        }

        memory.Position = 0;
        return File(memory, "application/zip", $"order-{order.Id}.zip");
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateOrderRequest request)
    {
        var name = request.CustomerName?.Trim() ?? "";
        var phone = request.Phone?.Trim() ?? "";
        var address = request.Address?.Trim() ?? "";
        var email = request.Email?.Trim() ?? "";
        if (name.Length == 0 || phone.Length == 0)
            return BadRequest(new { error = "Име и телефон са задължителни." });
        if (!Payments.Contains(request.PaymentMethod))
            return BadRequest(new { error = "Избери начин на плащане." });
        if (request.Items == null || request.Items.Count == 0)
            return BadRequest(new { error = "Количката е празна." });

        var grouped = request.Items
            .GroupBy(i => i.ProductId)
            .Select(g => new { ProductId = g.Key, Quantity = g.Sum(x => x.Quantity) })
            .ToList();
        if (grouped.Any(i => i.Quantity < 1 || i.Quantity > 20))
            return BadRequest(new { error = "Количеството трябва да е между 1 и 20." });

        var ids = grouped.Select(i => i.ProductId).ToList();
        var products = await _context.Products.Where(p => ids.Contains(p.Id)).ToListAsync();
        if (products.Count != ids.Count || products.Any(p => !p.IsPublished))
            return BadRequest(new { error = "Някой продукт вече не се продава." });
        if (products.Any(p => p.Kind == "external"))
            return BadRequest(new { error = "Външната връзка не се поръчва оттук." });

        var needsAddress = products.Any(p => p.Kind is "stock" or "printful");
        var hasDigital = products.Any(p => p.Kind == "digital");
        var codAllowed = products.All(p => p.Kind == "stock");
        if (needsAddress && address.Length == 0)
            return BadRequest(new { error = "Адресът е задължителен за физическа стока." });
        if (hasDigital && email.Length == 0)
            return BadRequest(new { error = "Имейлът е задължителен, за да изпратим файла." });
        if (request.PaymentMethod == "cod" && !codAllowed)
            return BadRequest(new { error = "Наложеният платеж е само за стока, която вече е налична." });

        var order = new ShopOrder
        {
            CustomerName = Trim(name, 120),
            Phone = Trim(phone, 40),
            Email = Trim(email, 160),
            City = Trim(request.City?.Trim() ?? "", 80),
            Address = Trim(address, 300),
            Note = Trim(request.Note?.Trim() ?? "", 500),
            PaymentMethod = request.PaymentMethod,
            Status = request.PaymentMethod == "bank" ? "awaiting_payment" : "new",
            DownloadToken = Guid.NewGuid().ToString("N"),
            CreatedAt = DateTime.UtcNow
        };

        foreach (var item in grouped)
        {
            var product = products.First(p => p.Id == item.ProductId);
            var quantity = product.Kind == "digital" ? 1 : item.Quantity;
            if (product.Kind == "stock" && product.Stock is int stock && stock < quantity)
                return BadRequest(new { error = $"„{product.Name}“ няма достатъчна наличност." });
            if (product.Kind == "digital" && string.IsNullOrEmpty(product.FileKey))
                return BadRequest(new { error = $"„{product.Name}“ още няма файл." });

            if (product.Kind == "stock" && product.Stock is int current)
                product.Stock = current - quantity;

            order.Items.Add(new ShopOrderItem
            {
                ProductId = product.Id,
                ProductName = product.Name,
                UnitPrice = product.Price,
                Quantity = quantity,
                Kind = product.Kind,
                FileKey = product.Kind == "digital" ? product.FileKey : null,
                FileName = product.Kind == "digital" ? product.FileName : null
            });
        }

        order.Total = order.Items.Sum(i => i.UnitPrice * i.Quantity);
        _context.ShopOrders.Add(order);
        await _context.SaveChangesAsync();

        var bank = request.PaymentMethod == "bank" ? await BankDtoAsync() : null;
        return Ok(new
        {
            order.Id,
            order.Total,
            order.Status,
            order.PaymentMethod,
            bank,
            hasDigital = order.Items.Any(i => i.Kind == "digital"),
            hasPrintful = order.Items.Any(i => i.Kind == "printful")
        });
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:int}/status")]
    public async Task<IActionResult> SetStatus(int id, [FromBody] StatusRequest request)
    {
        var next = request.Status?.Trim() ?? "";
        if (!Statuses.Contains(next))
            return BadRequest(new { error = "Непознат статус." });

        var order = await _context.ShopOrders.Include(o => o.Items).FirstOrDefaultAsync(o => o.Id == id);
        if (order == null) return NotFound();

        var wasCancelled = order.Status == "cancelled";
        var willCancel = next == "cancelled";
        if (wasCancelled != willCancel)
        {
            var productIds = order.Items.Where(i => i.ProductId != null).Select(i => i.ProductId!.Value).ToList();
            var products = await _context.Products.Where(p => productIds.Contains(p.Id)).ToListAsync();
            foreach (var item in order.Items.Where(i => i.Kind == "stock"))
            {
                var product = products.FirstOrDefault(p => p.Id == item.ProductId);
                if (product?.Stock is not int stock) continue;
                if (willCancel)
                    product.Stock = stock + item.Quantity;
                else if (stock < item.Quantity)
                    return BadRequest(new { error = $"„{product.Name}“ няма достатъчна наличност, за да върнеш поръчката." });
                else
                    product.Stock = stock - item.Quantity;
            }
        }

        var becamePaid = !PaidStatuses.Contains(order.Status) && PaidStatuses.Contains(next);
        order.Status = next;
        await _context.SaveChangesAsync();

        if (becamePaid && !order.FileSent && order.Items.Any(i => i.Kind == "digital") && !string.IsNullOrWhiteSpace(order.Email))
        {
            try
            {
                var baseUrl = (_config["Frontend:BaseUrl"] ?? "http://localhost:5173").TrimEnd('/');
                var url = $"{baseUrl}/api/v1/orders/download/{order.DownloadToken}";
                var body = $@"
                    <div style=""font-family: sans-serif; max-width: 480px; margin: 0 auto;"">
                        <h2>Здравейте, {System.Net.WebUtility.HtmlEncode(order.CustomerName)}!</h2>
                        <p>Плащането по поръчка #{order.Id} е получено. Файлът се сваля оттук:</p>
                        <p><a href=""{url}"">{url}</a></p>
                        <p>Hello! Payment for order #{order.Id} is in. Download the file here:</p>
                        <p><a href=""{url}"">{url}</a></p>
                    </div>";
                await _email.SendEmailAsync(order.Email, $"Поръчка #{order.Id} — файл / Your file", body);
                order.FileSent = true;
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Файлът за поръчка {OrderId} не можа да се изпрати по имейл.", order.Id);
            }
        }

        return Ok(ToDto(order));
    }

    private async Task<object> BankDtoAsync()
    {
        var setting = await _context.ShopSettings.AsNoTracking().FirstOrDefaultAsync();
        return new
        {
            accountName = setting?.AccountName ?? "",
            iban = setting?.Iban ?? "",
            bankName = setting?.BankName ?? "",
            paymentNote = setting?.PaymentNote ?? ""
        };
    }

    private static string ContentType(string fileName)
    {
        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        return extension switch
        {
            ".pdf" => "application/pdf",
            ".epub" => "application/epub+zip",
            ".zip" => "application/zip",
            _ => "application/octet-stream"
        };
    }

    private static string Trim(string value, int max) => value.Length <= max ? value : value[..max];

    private object ToDto(ShopOrder order) => new
    {
        order.Id,
        order.CustomerName,
        order.Phone,
        order.Email,
        order.City,
        order.Address,
        order.Note,
        order.PaymentMethod,
        order.Status,
        order.Total,
        order.CreatedAt,
        order.FileSent,
        DownloadUrl = string.IsNullOrEmpty(order.DownloadToken) || !order.Items.Any(i => i.Kind == "digital")
            ? null
            : $"{(_config["Frontend:BaseUrl"] ?? "http://localhost:5173").TrimEnd('/')}/api/v1/orders/download/{order.DownloadToken}",
        Items = order.Items.Select(i => new
        {
            i.ProductId,
            i.ProductName,
            i.UnitPrice,
            i.Quantity,
            i.Kind
        })
    };
}
