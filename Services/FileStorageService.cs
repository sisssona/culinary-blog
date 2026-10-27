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
                thumbImage.Resize(new MagickGeometry(300, 300) { FillArea = true });
                thumbImage.Crop(300, 300, Gravity.Center);
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

    /// <summary>
    /// Stores a video as-is (no transcoding). Only .mp4 and .webm are accepted, and the
    /// file header must match the extension. The file always gets a random name.
    /// Returns the public relative URL.
    /// </summary>
    public async Task<string> SaveVideoAsync(IFormFile file, string folderName, CancellationToken cancellationToken = default)
    {
        if (file == null || file.Length == 0)
            throw new ArgumentException("Файлът е празен.", nameof(file));

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (ext != ".mp4" && ext != ".webm")
            throw new BadHttpRequestException("Позволени са само видео файлове във формат .mp4 или .webm.");

        var header = new byte[12];
        int read;
        await using (var probe = file.OpenReadStream())
        {
            read = await probe.ReadAtLeastAsync(header, header.Length, throwOnEndOfStream: false, cancellationToken);
        }

        if (!LooksLikeVideo(header, read, ext))
            throw new BadHttpRequestException("Файлът не изглежда като валидно видео.");

        var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var uploadsFolder = Path.Combine(webRoot, folderName);
        if (!Directory.Exists(uploadsFolder))
        {
            Directory.CreateDirectory(uploadsFolder);
        }

        var fileName = $"{Guid.NewGuid()}{ext}";
        var fullPath = Path.Combine(uploadsFolder, fileName);

        try
        {
            await using var target = new FileStream(fullPath, FileMode.CreateNew, FileAccess.Write, FileShare.None, 81920, useAsync: true);
            await file.CopyToAsync(target, cancellationToken);
        }
        catch
        {
            // Do not leave a half-written file behind (e.g. when the request is cancelled).
            if (File.Exists(fullPath))
            {
                try { File.Delete(fullPath); } catch { /* best effort */ }
            }
            throw;
        }

        return $"/{folderName}/{fileName}";
    }

    private static bool LooksLikeVideo(byte[] header, int read, string ext)
    {
        // MP4: bytes 4..7 are "ftyp". WebM: EBML header 1A 45 DF A3.
        if (ext == ".mp4")
            return read >= 12 && header[4] == (byte)'f' && header[5] == (byte)'t' && header[6] == (byte)'y' && header[7] == (byte)'p';
        if (ext == ".webm")
            return read >= 4 && header[0] == 0x1A && header[1] == 0x45 && header[2] == 0xDF && header[3] == 0xA3;
        return false;
    }

    public async Task<string> SavePrivateFileAsync(IFormFile file, CancellationToken cancellationToken = default)
    {
        if (file == null || file.Length == 0)
            throw new ArgumentException("Файлът е празен.", nameof(file));

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (extension is not ".pdf" and not ".epub" and not ".zip")
            throw new BadHttpRequestException("Файлът трябва да е PDF, EPUB или ZIP.");
        if (file.Length > 30 * 1024 * 1024)
            throw new BadHttpRequestException("Файлът трябва да е до 30 MB.");

        var folder = Path.Combine(_env.ContentRootPath, "private-shop");
        Directory.CreateDirectory(folder);
        var storedName = Guid.NewGuid().ToString("N") + extension;
        var fullPath = Path.Combine(folder, storedName);
        await using var target = new FileStream(fullPath, FileMode.CreateNew, FileAccess.Write, FileShare.None, 81920, useAsync: true);
        await file.CopyToAsync(target, cancellationToken);
        return storedName;
    }

    public string? PrivateFilePath(string? storedName)
    {
        if (string.IsNullOrWhiteSpace(storedName)) return null;
        var folder = Path.GetFullPath(Path.Combine(_env.ContentRootPath, "private-shop"));
        var path = Path.GetFullPath(Path.Combine(folder, Path.GetFileName(storedName)));
        if (!path.StartsWith(folder, StringComparison.OrdinalIgnoreCase) || !File.Exists(path))
            return null;
        return path;
    }

    public void DeletePrivateFile(string? storedName)
    {
        var path = PrivateFilePath(storedName);
        if (path == null) return;
        try { File.Delete(path); }
        catch (Exception ex) { _logger.LogError(ex, "Грешка при изтриване на частен файл {Path}", path); }
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
