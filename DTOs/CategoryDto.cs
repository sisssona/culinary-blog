namespace CulinaryBlog.DTOs;

public record CategoryDto(
    string Name,
    string? NameEn,
    int SortOrder,
    int? ParentCategoryId
);
