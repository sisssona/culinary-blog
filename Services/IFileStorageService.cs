using Microsoft.AspNetCore.Http;
using System.Threading;
using System.Threading.Tasks;

namespace CulinaryBlog.Services;

public record ImageUploadResult(string MainImageUrl, string ThumbnailUrl);

public interface IFileStorageService
{
    Task<ImageUploadResult> SaveFileAsync(IFormFile file, string folderName, CancellationToken cancellationToken = default);
    void DeleteFile(string? relativePath);
}