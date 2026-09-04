using ImageMagick;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System.IO;
using System.Threading;
using System.Threading.Tasks;

namespace CulinaryBlog.Services;

public class FileStorageService : IFileStorageService
{
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<FileStorageService> _logger;

    public FileStorageService(IWebHostEnvironment env, ILogger<FileStorageService> logger)
    {
        _env = env;
        _logger = logger;
    }

    public async Task<ImageUploadResult> SaveFileAsync(IFormFile file, string folderName, CancellationToken cancellationToken = default)
    {
        if (file == null || file.Length == 0)
            throw new ArgumentException("Файлът е празен.", nameof(file));

        var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var uploadsFolder = Path.Combine(webRoot, folderName);

        if (!Directory.Exists(uploadsFolder))
        {
            Directory.CreateDirectory(uploadsFolder);
        }

        var fileGuid = Guid.NewGuid().ToString();
        var mainFileName = $"{fileGuid}.webp";
        var thumbFileName = $"{fileGuid}_thumb.webp";

        var mainFilePath = Path.Combine(uploadsFolder, mainFileName);
        var thumbFilePath = Path.Combine(uploadsFolder, thumbFileName);

        try
        {
            using var ms = new MemoryStream();
            // Предаваме токена тук, за да спрем четенето при отказ
            await file.CopyToAsync(ms, cancellationToken);
            ms.Position = 0;

            // Ако заявката е отменена по време или преди обработката, хвърляме TaskCanceledException
            cancellationToken.ThrowIfCancellationRequested();

            // 1. Обработка на основното изображение (max 1200px)
            using (var mainImage = new MagickImage(ms.ToArray()))
            {
                mainImage.AutoOrient();

                if (mainImage.Width > 1200 || mainImage.Height > 1200)
                {
                    mainImage.Resize(new MagickGeometry(1200, 1200) { IgnoreAspectRatio = false });
                }

                mainImage.Format = MagickFormat.WebP;
                mainImage.Quality = 80;
                await mainImage.WriteAsync(mainFilePath);
            }

            cancellationToken.ThrowIfCancellationRequested();

            // 2. Обработка на thumbnail (300x300 Center Crop)
            ms.Position = 0;
            using (var thumbImage = new MagickImage(ms.ToArray()))
            {
                thumbImage.AutoOrient();
                thumbImage.Crop(new MagickGeometry(300, 300), Gravity.Center);
                thumbImage.Format = MagickFormat.WebP;
                thumbImage.Quality = 80;
                await thumbImage.WriteAsync(thumbFilePath);
            }
        }
        catch (MagickException ex)
        {
            _logger.LogError(ex, "Каченият файл не е валидно изображение: {FileName}", file.FileName);
            throw new BadHttpRequestException("Файлът е повреден или не е поддържан графичен формат.");
        }

        return new ImageUploadResult(
            MainImageUrl: $"/{folderName}/{mainFileName}",
            ThumbnailUrl: $"/{folderName}/{thumbFileName}"
        );
    }

    public void DeleteFile(string? relativePath)
    {
        if (string.IsNullOrWhiteSpace(relativePath))
            return;

        var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var cleanedPath = relativePath.TrimStart('/', '\\');
        var fullPath = Path.Combine(webRoot, cleanedPath);

        var rootPath = Path.GetFullPath(webRoot);
        var targetPath = Path.GetFullPath(fullPath);

        if (!targetPath.StartsWith(rootPath, StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogWarning("Опит за неоторизирано изтриване извън директорията: {Path}", relativePath);
            return;
        }

        if (File.Exists(fullPath))
        {
            try
            {
                File.Delete(fullPath);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Грешка при изтриване на файл {FullPath}", fullPath);
            }
        }
    }
}