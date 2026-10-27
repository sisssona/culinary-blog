using System.Security.Cryptography;
using Google.Apis.Auth;
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
            return BadRequest(new { error = "user_already_exists" });

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
            EmailConfirmationTokenExpiresAt = DateTime.UtcNow.AddDays(2),
            IsSubscribedToNewsletter = dto.IsSubscribed,
            PreferredLanguage = !string.IsNullOrWhiteSpace(dto.PreferredLanguage) ? dto.PreferredLanguage : "bg"
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var frontendBaseUrl = _config["Frontend:BaseUrl"] ?? "http://localhost:5173";
        var confirmUrl = $"{frontendBaseUrl}/confirm-email?token={user.EmailConfirmationToken}";
        QueueEmail(email => email.SendEmailConfirmationAsync(user.Email, user.DisplayName, confirmUrl, user.PreferredLanguage));

        var token = GenerateJwtToken(user);
        return Ok(ToAuthResponse(user, token));
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
        if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            return Unauthorized(new { error = "invalid_credentials" });

        if (string.IsNullOrWhiteSpace(user.DisplayName))
        {
            user.DisplayName = user.Email.Split('@')[0];
            await _context.SaveChangesAsync();
        }

        var token = GenerateJwtToken(user);
        return Ok(ToAuthResponse(user, token));
    }

    [HttpGet("google-client")]
    public IActionResult GoogleClient()
    {
        var clientId = _config["Google:ClientId"];
        return Ok(new { clientId = string.IsNullOrWhiteSpace(clientId) ? null : clientId });
    }

    [HttpPost("google")]
    public async Task<IActionResult> Google([FromBody] GoogleLoginDto dto)
    {
        var clientId = _config["Google:ClientId"];
        if (string.IsNullOrWhiteSpace(clientId))
            return StatusCode(503, new { error = "google_not_configured" });

        GoogleJsonWebSignature.Payload payload;
        try
        {
            payload = await GoogleJsonWebSignature.ValidateAsync(dto.IdToken, new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = new[] { clientId }
            });
        }
        catch
        {
            return Unauthorized(new { error = "google_invalid" });
        }

        if (payload.EmailVerified != true || string.IsNullOrWhiteSpace(payload.Email))
            return Unauthorized(new { error = "google_email_unverified" });

        var email = payload.Email.Trim();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.GoogleSubject == payload.Subject)
            ?? await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());

        if (user == null)
        {
            var name = string.IsNullOrWhiteSpace(payload.Name) ? email.Split('@')[0] : payload.Name.Trim();
            if (name.Length > 80) name = name[..80];
            user = new User
            {
                Email = email,
                DisplayName = name,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(Convert.ToHexString(RandomNumberGenerator.GetBytes(32))),
                EmailConfirmed = true,
                IsSubscribedToNewsletter = false,
                PreferredLanguage = string.IsNullOrWhiteSpace(dto.PreferredLanguage) ? "bg" : dto.PreferredLanguage,
                GoogleSubject = payload.Subject
            };
            _context.Users.Add(user);
        }
        else
        {
            if (!string.IsNullOrEmpty(user.GoogleSubject) && user.GoogleSubject != payload.Subject)
                return Conflict(new { error = "google_account_mismatch" });

            user.GoogleSubject ??= payload.Subject;
            user.EmailConfirmed = true;
            if (string.IsNullOrWhiteSpace(user.DisplayName) && !string.IsNullOrWhiteSpace(payload.Name))
            {
                var name = payload.Name.Trim();
                user.DisplayName = name.Length > 80 ? name[..80] : name;
            }
        }

        await _context.SaveChangesAsync();
        var token = GenerateJwtToken(user);
        return Ok(ToAuthResponse(user, token));
    }

    // GET: api/v1/auth/confirm-email?token=...
    [HttpGet("confirm-email")]
    public async Task<IActionResult> ConfirmEmail([FromQuery] string token)
    {
        if (string.IsNullOrWhiteSpace(token))
            return BadRequest(new { error = "missing_confirmation_token" });

        var user = await _context.Users.FirstOrDefaultAsync(u => u.EmailConfirmationToken == token);
        if (user == null)
            return BadRequest(new { error = "invalid_or_used_confirmation_link" });

        if (user.EmailConfirmationTokenExpiresAt == null || user.EmailConfirmationTokenExpiresAt < DateTime.UtcNow)
            return BadRequest(new { error = "confirmation_link_expired" });

        user.EmailConfirmed = true;
        user.EmailConfirmationToken = null;
        user.EmailConfirmationTokenExpiresAt = null;
        await _context.SaveChangesAsync();

        var frontendBaseUrl = _config["Frontend:BaseUrl"] ?? "http://localhost:5173";

        // АКО потребителят е избрал да се абонира при регистрация, го активираме в бюлетина ТУК след потвърждение
        if (user.IsSubscribedToNewsletter)
        {
            var existingSubscriber = await _context.NewsletterSubscribers
                .FirstOrDefaultAsync(s => s.Email.ToLower() == user.Email.ToLower());

            if (existingSubscriber == null)
            {
                var subscriber = new NewsletterSubscriber
                {
                    Email = user.Email.Trim(),
                    SubscribedAt = DateTime.UtcNow,
                    IsActive = true,
                    PreferredLanguage = user.PreferredLanguage
                };
                _context.NewsletterSubscribers.Add(subscriber);
                await _context.SaveChangesAsync();
            }
            else if (!existingSubscriber.IsActive)
            {
                existingSubscriber.IsActive = true;
                existingSubscriber.PreferredLanguage = user.PreferredLanguage;
                await _context.SaveChangesAsync();
            }

            // Динамични текстове спрямо езика на потребителя
            string lang = user.PreferredLanguage ?? "bg";
            var texts = EmailTemplates.GetNewsletterTexts(lang);

            string unsubscribeLink = $"{frontendBaseUrl}/unsubscribe?email={Uri.EscapeDataString(user.Email)}";
            string newsletterEmailBody = $@"
                <div style='font-family: Arial, sans-serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; background-color: #f7f4ed; padding: 30px; border-radius: 8px;'>
                    <h2 style='color: #1a1a1a;'>{texts.Title}</h2>
                    <p>{texts.Greeting}</p>
                    <br />
                    <p>{(lang == "en" ? "Thank you for confirming your registration and subscribing to our culinary blog!" : "Благодарим ви, че потвърдихте регистрацията си и се абонирахте за нашия кулинарен блог!")}</p>
                    <br />
                    <hr style='border: none; border-top: 1px solid #e3decb;' />
                    <p style='font-size: 12px; color: #786f65;'>
                        {texts.Unsubscribe} 
                        <a href='{unsubscribeLink}' style='color: #b45309;'>{(lang == "en" ? "Unsubscribe" : "Отпиши ме")}</a>
                    </p>
                </div>";

            QueueEmail(email => email.SendEmailAsync(
                user.Email,
                texts.Subject,
                newsletterEmailBody
            ));
        }

        return Ok(new { message = "email_confirmed_successfully" });
    }

    // POST: api/v1/auth/resend-confirmation
    [HttpPost("resend-confirmation")]
    public async Task<IActionResult> ResendConfirmation([FromBody] ForgotPasswordDto dto)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);

        if (user != null && !user.EmailConfirmed)
        {
            user.EmailConfirmationToken = GenerateToken();
            user.EmailConfirmationTokenExpiresAt = DateTime.UtcNow.AddDays(2);
            await _context.SaveChangesAsync();

            var frontendBaseUrl = _config["Frontend:BaseUrl"] ?? "http://localhost:5173";
            var confirmUrl = $"{frontendBaseUrl}/confirm-email?token={user.EmailConfirmationToken}";
            QueueEmail(email => email.SendEmailConfirmationAsync(user.Email, user.DisplayName, confirmUrl, user.PreferredLanguage));
        }

        return Ok(new { message = "resend_confirmation_sent" });
    }

    // POST: api/v1/auth/forgot-password
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);

        if (user != null)
        {
            user.PasswordResetToken = GenerateToken();
            user.PasswordResetTokenExpiresAt = DateTime.UtcNow.AddHours(1);
            await _context.SaveChangesAsync();

            var frontendBaseUrl = _config["Frontend:BaseUrl"] ?? "http://localhost:5173";
            var resetUrl = $"{frontendBaseUrl}/reset-password?token={user.PasswordResetToken}";
            var requested = string.IsNullOrWhiteSpace(dto.PreferredLanguage) ? user.PreferredLanguage : dto.PreferredLanguage;
            var language = requested?.StartsWith("en", StringComparison.OrdinalIgnoreCase) == true ? "en" : "bg";
            QueueEmail(email => email.SendPasswordResetAsync(user.Email, user.DisplayName, resetUrl, language));
        }

        return Ok(new { message = "password_reset_sent" });
    }

    // POST: api/v1/auth/reset-password
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.PasswordResetToken == dto.Token);
        if (user == null)
            return BadRequest(new { error = "invalid_or_used_reset_link" });

        if (user.PasswordResetTokenExpiresAt == null || user.PasswordResetTokenExpiresAt < DateTime.UtcNow)
            return BadRequest(new { error = "reset_link_expired" });

        if (string.IsNullOrWhiteSpace(dto.NewPassword) || dto.NewPassword.Length < 8)
            return BadRequest(new { error = "password_too_short" });

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        user.PasswordResetToken = null;
        user.PasswordResetTokenExpiresAt = null;
        await _context.SaveChangesAsync();

        return Ok(new { message = "password_reset_success" });
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

        if (user.Role == "Admin")
        {
            var adminCount = await _context.Users.CountAsync(u => u.Role == "Admin");
            if (adminCount <= 1)
                return BadRequest(new { error = "Трябва да остане поне един администратор." });
        }

        var recipes = await _context.Recipes
            .Include(r => r.Media)
            .Where(r => r.AuthorId == userId)
            .ToListAsync();
        foreach (var recipe in recipes)
        {
            foreach (var media in recipe.Media)
            {
                _fileStorage.DeleteFile(media.Url);
                _fileStorage.DeleteFile(media.ThumbnailUrl);
            }
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
