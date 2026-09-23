using System;
using System.Threading;
using System.Threading.Channels;
using System.Threading.Tasks;

namespace CulinaryBlog.Services;

public interface IRecipeMediaProcessingQueue
{
    ValueTask EnqueueRecipeAsync(int recipeId, CancellationToken cancellationToken = default);
    ValueTask<int> DequeueAsync(CancellationToken cancellationToken = default);
}

public sealed class RecipeMediaProcessingQueue : IRecipeMediaProcessingQueue, IDisposable
{
    private readonly Channel<int> _channel;

    public RecipeMediaProcessingQueue(int capacity = 100)
    {
        var options = new BoundedChannelOptions(capacity)
        {
            FullMode = BoundedChannelFullMode.DropOldest,
            SingleReader = true,
            SingleWriter = false
        };
        _channel = Channel.CreateBounded<int>(options);
    }

    public async ValueTask EnqueueRecipeAsync(int recipeId, CancellationToken cancellationToken = default)
    {
        await _channel.Writer.WriteAsync(recipeId, cancellationToken);
    }

    public async ValueTask<int> DequeueAsync(CancellationToken cancellationToken = default)
    {
        return await _channel.Reader.ReadAsync(cancellationToken);
    }

    public void Dispose()
    {
        _channel.Writer.TryComplete();
    }
}