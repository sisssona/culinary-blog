using System.ComponentModel.DataAnnotations;

namespace CulinaryBlog.Models;

public record RegisterDto(
    [Required][EmailAddress] string Email,
    [Required][MinLength(8)] string Password,
    string? DisplayName,
    bool IsSubscribed,
    string? PreferredLanguage
);

public record LoginDto(
    [Required][EmailAddress] string Email,
    [Required] string Password
);

public record AuthResponseDto(
    string Token,
    int UserId,
    string Email,
    string DisplayName,
    string Role,
    bool EmailConfirmed
);

public record ForgotPasswordDto(
    [Required][EmailAddress] string Email
);

public record ResetPasswordDto(
    [Required] string Token,
    [Required][MinLength(8)] string NewPassword
);
