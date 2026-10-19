using System.Security.Cryptography;
using CulinaryBlog.Data;
using CulinaryBlog.DTOs;
using CulinaryBlog.Models;
using CulinaryBlog.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace CulinaryBlog.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class AuthController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _config;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IFileStorageService _fileStorage;

    public AuthController(
        ApplicationDbContext context,
        IConfiguration config,
        IServiceScopeFactory scopeFactory,
        IFileStorageService fileStorage)
    {
        _context = context;
        _config = config;
        _scopeFactory = scopeFactory;
        _fileStorage = fileStorage;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
            return BadRequest(new { error = "Потребител с този имейл вече съществува." });

        var displayName = string.IsNullOrWhiteSpace(dto.DisplayName)
            ? dto.Email.Split('@')[0]
            : dto.DisplayName.Trim();

        var user = new User
        {
            Email = dto.Email,
            DisplayName = displayName,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            EmailConfirmed = false,
            EmailConfirmationToken = GenerateToken(),
            EmailConfirmationTokenExpiresAt = DateTime.UtcNow.AddDays(2)
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var frontendBaseUrl = _config["Frontend:BaseUrl"] ?? "http://localhost:5173";
        var confirmUrl = $"{frontendBaseUrl}/confirm-email?token={user.EmailConfirmationToken}";
        QueueEmail(email => email.SendEmailConfirmationAsync(user.Email, user.DisplayName, confirmUrl));

        var token = GenerateJwtToken(user);
        return Ok(ToAuthResponse(user, token));
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
        if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            return Unauthorized(new { error = "Невалиден имейл или парола." });

        if (string.IsNullOrWhiteSpace(user.DisplayName))
        {
            user.DisplayName = user.Email.Split('@')[0];
            await _context.SaveChangesAsync();
        }

        var token = GenerateJwtToken(user);
        return Ok(ToAuthResponse(user, token));
    }

    // GET: api/v1/auth/confirm-email?token=...
    [HttpGet("confirm-email")]
    public async Task<IActionResult> ConfirmEmail([FromQuery] string token)
    {
        if (string.IsNullOrWhiteSpace(token))
            return BadRequest(new { error = "Липсва токен за потвърждение." });

        var user = await _context.Users.FirstOrDefaultAsync(u => u.EmailConfirmationToken == token);
        if (user == null)
            return BadRequest(new { error = "Невалиден или вече използван линк за потвърждение." });

        if (user.EmailConfirmationTokenExpiresAt == null || user.EmailConfirmationTokenExpiresAt < DateTime.UtcNow)
            return BadRequest(new { error = "Линкът за потвърждение е изтекъл. Поискайте нов." });

        user.EmailConfirmed = true;
        user.EmailConfirmationToken = null;
        user.EmailConfirmationTokenExpiresAt = null;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Имейлът е потвърден успешно." });
    }

    // POST: api/v1/auth/resend-confirmation
    [HttpPost("resend-confirmation")]
    public async Task<IActionResult> ResendConfirmation([FromBody] ForgotPasswordDto dto)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);

        // Същият генеричен отговор независимо дали имейлът съществува или вече е потвърден —
        // за да не разкриваме кои имейли са регистрирани.
        if (user != null && !user.EmailConfirmed)
        {
            user.EmailConfirmationToken = GenerateToken();
            user.EmailConfirmationTokenExpiresAt = DateTime.UtcNow.AddDays(2);
            await _context.SaveChangesAsync();

            var frontendBaseUrl = _config["Frontend:BaseUrl"] ?? "http://localhost:5173";
            var confirmUrl = $"{frontendBaseUrl}/confirm-email?token={user.EmailConfirmationToken}";
            QueueEmail(email => email.SendEmailConfirmationAsync(user.Email, user.DisplayName, confirmUrl));
        }

        return Ok(new { message = "Ако имейлът съществува и не е потвърден, изпратихме нов линк." });
    }

    // POST: api/v1/auth/forgot-password
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);

        // Генеричен отговор дори ако имейлът не съществува — не разкриваме кои имейли са регистрирани.
        if (user != null)
        {
            user.PasswordResetToken = GenerateToken();
            user.PasswordResetTokenExpiresAt = DateTime.UtcNow.AddHours(1);
            await _context.SaveChangesAsync();

            var frontendBaseUrl = _config["Frontend:BaseUrl"] ?? "http://localhost:5173";
            var resetUrl = $"{frontendBaseUrl}/reset-password?token={user.PasswordResetToken}";
            QueueEmail(email => email.SendPasswordResetAsync(user.Email, user.DisplayName, resetUrl));
        }

        return Ok(new { message = "Ако имейлът съществува, изпратихме линк за възстановяване на паролата." });
    }

    // POST: api/v1/auth/reset-password
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.PasswordResetToken == dto.Token);
        if (user == null)
            return BadRequest(new { error = "Невалиден или вече използван линк за възстановяване." });

        if (user.PasswordResetTokenExpiresAt == null || user.PasswordResetTokenExpiresAt < DateTime.UtcNow)
            return BadRequest(new { error = "Линкът е изтекъл. Поискайте нов." });

        if (string.IsNullOrWhiteSpace(dto.NewPassword) || dto.NewPassword.Length < 8)
            return BadRequest(new { error = "Паролата трябва да е поне 8 символа." });

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        user.PasswordResetToken = null;
        user.PasswordResetTokenExpiresAt = null;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Паролата е сменена успешно. Вече можете да влезете." });
    }

    [Authorize]
    [HttpDelete("delete-account")]
    public async Task<IActionResult> DeleteAccount()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdClaim, out var userId))
            return Unauthorized();

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null)
            return NotFound();

        var recipes = await _context.Recipes.Where(r => r.AuthorId == userId).ToListAsync();
        foreach (var recipe in recipes)
        {
            if (!string.IsNullOrEmpty(recipe.ImageUrl))
                _fileStorage.DeleteFile(recipe.ImageUrl);
            if (!string.IsNullOrEmpty(recipe.ThumbnailUrl))
                _fileStorage.DeleteFile(recipe.ThumbnailUrl);
        }

        _context.Recipes.RemoveRange(recipes);
        _context.Comments.RemoveRange(_context.Comments.Where(c => c.UserId == userId));
        _context.Likes.RemoveRange(_context.Likes.Where(l => l.UserId == userId));
        _context.Favorites.RemoveRange(_context.Favorites.Where(f => f.UserId == userId));
        _context.Ratings.RemoveRange(_context.Ratings.Where(r => r.UserId == userId));
        _context.Users.Remove(user);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private static AuthResponseDto ToAuthResponse(User user, string token) =>
        new(token, user.Id, user.Email, user.DisplayName, user.Role, user.EmailConfirmed);

    private void QueueEmail(Func<IEmailService, Task> send)
    {
        _ = Task.Run(async () =>
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var email = scope.ServiceProvider.GetRequiredService<IEmailService>();
                await send(email);
            }
            catch
            {
                // EmailService already logs failures; never fail the HTTP request.
            }
        });
    }

    private static string GenerateToken() =>
        Convert.ToHexString(RandomNumberGenerator.GetBytes(32));

    private string GenerateJwtToken(User user)
    {
        var jwtSettings = _config.GetSection("Jwt");
        var key = Encoding.UTF8.GetBytes(jwtSettings["Key"]!);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.DisplayName),
            new Claim(ClaimTypes.Role, user.Role)
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddDays(30),
            Issuer = jwtSettings["Issuer"],
            Audience = jwtSettings["Audience"],
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }
}