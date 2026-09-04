using System.ComponentModel.DataAnnotations;
using System.Linq;
using Microsoft.AspNetCore.Http;

namespace CulinaryBlog.Attributes;

public class AllowedExtensionsAttribute : ValidationAttribute
{
    private readonly string[] _extensions;

    public AllowedExtensionsAttribute(params string[] extensions)
    {
        _extensions = extensions.Select(ext => ext.ToLowerInvariant()).ToArray();
        ErrorMessage = $"Позволени са само следните формати: {string.Join(", ", _extensions)}";
    }

    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
        if (value is IFormFile file)
        {
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();

            if (string.IsNullOrEmpty(extension) || !_extensions.Contains(extension))
            {
                return new ValidationResult(ErrorMessage);
            }
        }

        return ValidationResult.Success;
    }
}