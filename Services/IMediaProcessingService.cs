using System.Threading;
using System.Threading.Tasks;

namespace CulinaryBlog.Services;

public interface IMediaProcessingService
{
    /// <summary>
    /// Process pending media entries for the given recipe (image conversion, video transcode, thumbnails, update DB).
    /// </summary>
    Task ProcessRecipeMediaAsync(int recipeId, CancellationToken cancellationToken = default);
}