using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace CulinaryBlog.Attributes;

public class MaxFileSizeAttribute : ValidationAttribute
{
    private readonly int _maxFileSizeInBytes;

    public MaxFileSizeAttribute(int maxFileSizeInMegabytes)
    {
        _maxFileSizeInBytes = maxFileSizeInMegabytes * 1024 * 1024;
        ErrorMessage = $"Максималният позволен размер е {maxFileSizeInMegabytes}MB.";
    }

    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
        if (value is IFormFile file)
        {
            if (file.Length > _maxFileSizeInBytes)
            {
                return new ValidationResult(ErrorMessage);
            }
        }

        return ValidationResult.Success;
    }
}