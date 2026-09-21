using System.ComponentModel.DataAnnotations;

namespace CulinaryBlog.Models;

public record RegisterDto(
    [Required][EmailAddress] string Email,
    [Required][MinLength(6)] string Password,
    string? DisplayName
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
    string Role
);

public record UpdateProfileDto(
    [Required][MaxLength(80)] string DisplayName,
    [MaxLength(500)] string? Bio
);
