using CulinaryBlog.Data;
using CulinaryBlog.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CulinaryBlog.Controllers;

[ApiController]
[Route("api/v1/shop/settings")]
public class ShopSettingsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ShopSettingsController(ApplicationDbContext context)
    {
        _context = context;
    }

    public class ShopSettingForm
    {
        public string? AccountName { get; set; }
        public string? Iban { get; set; }
        public string? BankName { get; set; }
        public string? PaymentNote { get; set; }
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var setting = await _context.ShopSettings.AsNoTracking().FirstOrDefaultAsync();
        return Ok(ToDto(setting));
    }

    [Authorize(Roles = "Admin")]
    [HttpPut]
    public async Task<IActionResult> Save([FromBody] ShopSettingForm form)
    {
        var setting = await _context.ShopSettings.FirstOrDefaultAsync();
        if (setting == null)
        {
            setting = new ShopSetting();
            _context.ShopSettings.Add(setting);
        }

        setting.AccountName = Trim(form.AccountName, 120);
        setting.Iban = Trim(form.Iban, 40).Replace(" ", "").ToUpperInvariant();
        setting.BankName = Trim(form.BankName, 80);
        setting.PaymentNote = Trim(form.PaymentNote, 1000);
        await _context.SaveChangesAsync();
        return Ok(ToDto(setting));
    }

    private static string Trim(string? value, int max)
    {
        var text = value?.Trim() ?? "";
        return text.Length <= max ? text : text[..max];
    }

    private static object ToDto(ShopSetting? setting) => new
    {
        accountName = setting?.AccountName ?? "",
        iban = setting?.Iban ?? "",
        bankName = setting?.BankName ?? "",
        paymentNote = setting?.PaymentNote ?? ""
    };
}
