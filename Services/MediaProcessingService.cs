using CulinaryBlog.Data;
using CulinaryBlog.Models;
using ImageMagick;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace CulinaryBlog.Services;

public class MediaProcessingService : IMediaProcessingService
{
    private readonly ApplicationDbContext _db;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<MediaProcessingService> _logger;

    public MediaProcessingService(ApplicationDbContext db, IWebHostEnvironment env, ILogger<MediaProcessingService> logger)
    {
        _db = db;
        _env = env;
        _logger = logger;
    }

    public async Task ProcessRecipeMediaAsync(int recipeId, CancellationToken cancellationToken = default)
    {
        var medias = await _db.RecipeMedia
            .Where(m => m.RecipeId == recipeId && m.State == "processing")
            .ToListAsync(cancellationToken);

        if (!medias.Any()) return;

        var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var finalFolder = Path.Combine(webRoot, "uploads", "recipes", recipeId.ToString());
        Directory.CreateDirectory(finalFolder);

        foreach (var m in medias.OrderBy(m => m.SortOrder))
        {
            if (cancellationToken.IsCancellationRequested) break;

            try
            {
                var tempRelative = (m.Url ?? string.Empty).TrimStart('/', '\\');
                var tempFull = Path.Combine(webRoot, tempRelative);
                if (!File.Exists(tempFull))
                {
                    m.State = "failed";
                    m.FailureReason = "Temporary file not found";
                    _logger.LogWarning("Temp file not found for media {MediaId}: {Path}", m.Id, tempFull);
                    await _db.SaveChangesAsync(cancellationToken);
                    continue;
                }

                if (m.MediaType == "image")
                {
                    var guid = Path.GetFileNameWithoutExtension(Guid.NewGuid().ToString("N"));
                    var mainName = $"{guid}.webp";
                    var thumbName = $"{guid}_thumb.webp";
                    var mainPath = Path.Combine(finalFolder, mainName);
                    var thumbPath = Path.Combine(finalFolder, thumbName);

                    using (var img = new MagickImage(tempFull))
                    {
                        img.AutoOrient();
                        if (img.Width > 1200 || img.Height > 1200)
                            img.Resize(new MagickGeometry(1200, 1200) { IgnoreAspectRatio = false });
                        img.Format = MagickFormat.WebP;
                        img.Quality = 80;
                        await img.WriteAsync(mainPath, cancellationToken);
                    }

                    using (var img = new MagickImage(tempFull))
                    {
                        img.AutoOrient();
                        img.Resize(new MagickGeometry(300, 300) { FillArea = true });
                        img.Crop(300, 300, Gravity.Center);
                        img.Format = MagickFormat.WebP;
                        img.Quality = 80;
                        await img.WriteAsync(thumbPath, cancellationToken);
                    }

                    m.Url = $"/uploads/recipes/{recipeId}/{mainName}";
                    m.ThumbnailUrl = $"/uploads/recipes/{recipeId}/{thumbName}";
                    m.State = "ready";

                    try { File.Delete(tempFull); } catch (Exception ex) { _logger.LogDebug(ex, "Failed to delete temp image {Path}", tempFull); }
                }
                else if (m.MediaType == "video")
                {
                    var finalGuid = Path.GetFileNameWithoutExtension(Guid.NewGuid().ToString("N"));
                    var outName = $"{finalGuid}.mp4";
                    var posterName = $"{finalGuid}_poster.jpg";
                    var outPath = Path.Combine(finalFolder, outName);
                    var posterPath = Path.Combine(finalFolder, posterName);

                    var ffmpeg = "ffmpeg"; // ensure ffmpeg is on PATH on the host
                    var args = $"-y -i \"{tempFull}\" -c:v libx264 -preset veryfast -crf 25 -c:a aac -movflags +faststart \"{outPath}\"";
                    var psi = new ProcessStartInfo(ffmpeg, args)
                    {
                        RedirectStandardOutput = true,
                        RedirectStandardError = true,
                        UseShellExecute = false,
                        CreateNoWindow = true
                    };

                    var process = Process.Start(psi);
                    if (process != null)
                    {
                        await process.WaitForExitAsync(cancellationToken);
                        if (process.ExitCode != 0)
                        {
                            var err = await process.StandardError.ReadToEndAsync();
                            m.State = "failed";
                            m.FailureReason = "ffmpeg failed: " + err;
                            _logger.LogError("ffmpeg failed for media {MediaId}: {Err}", m.Id, err);
                            await _db.SaveChangesAsync(cancellationToken);
                            continue;
                        }
                    }
                    else
                    {
                        m.State = "failed";
                        m.FailureReason = "ffmpeg not available";
                        _logger.LogError("ffmpeg process could not be started for media {MediaId}", m.Id);
                        await _db.SaveChangesAsync(cancellationToken);
                        continue;
                    }

                    var posterArgs = $"-y -i \"{outPath}\" -ss 00:00:01.000 -vframes 1 \"{posterPath}\"";
                    var posterPsi = new ProcessStartInfo(ffmpeg, posterArgs)
                    {
                        RedirectStandardOutput = true,
                        RedirectStandardError = true,
                        UseShellExecute = false,
                        CreateNoWindow = true
                    };
                    var posterProc = Process.Start(posterPsi);
                    if (posterProc != null)
                    {
                        await posterProc.WaitForExitAsync(cancellationToken);
                    }

                    m.Url = $"/uploads/recipes/{recipeId}/{outName}";
                    m.ThumbnailUrl = File.Exists(posterPath) ? $"/uploads/recipes/{recipeId}/{posterName}" : null;
                    m.State = "ready";

                    try { File.Delete(tempFull); } catch (Exception ex) { _logger.LogDebug(ex, "Failed to delete temp video {Path}", tempFull); }
                }
                else
                {
                    m.State = "failed";
                    m.FailureReason = "Unknown media type";
                }

                await _db.SaveChangesAsync(cancellationToken);
            }
            catch (MagickException mex)
            {
                m.State = "failed";
                m.FailureReason = "Image processing error";
                _logger.LogError(mex, "ImageMagick error processing media {MediaId}", m.Id);
                await _db.SaveChangesAsync(cancellationToken);
            }
            catch (Exception ex)
            {
                m.State = "failed";
                m.FailureReason = ex.Message;
                _logger.LogError(ex, "Error processing media {MediaId}", m.Id);
                await _db.SaveChangesAsync(cancellationToken);
            }
        }

        // Optional: set recipe.ImageUrl/ThumbnailUrl to first ready media if not set
        try
        {
            var recipe = await _db.Recipes.Include(r => r.Media).FirstOrDefaultAsync(r => r.Id == recipeId, cancellationToken);
            if (recipe != null && string.IsNullOrWhiteSpace(recipe.ImageUrl))
            {
                var firstImage = recipe.Media.FirstOrDefault(m => m.MediaType == "image" && m.State == "ready");
                if (firstImage != null)
                {
                    recipe.ImageUrl = firstImage.Url;
                    recipe.ThumbnailUrl = firstImage.ThumbnailUrl;
                    await _db.SaveChangesAsync(cancellationToken);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Failed to update recipe main image for recipe {RecipeId}", recipeId);
        }
    }
}