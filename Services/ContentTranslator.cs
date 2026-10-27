using CulinaryBlog.Models;

namespace CulinaryBlog.Services;

public class ContentTranslator
{
    private readonly TranslationService _translation;

    public ContentTranslator(TranslationService translation)
    {
        _translation = translation;
    }

    public async Task<bool> ApplyArticleAsync(Article article, CancellationToken cancellationToken = default)
    {
        var changed = false;
        if (article.TitleEn == null)
        {
            var title = await TranslateOrNull(article.Title, 220, cancellationToken);
            if (title == null) return changed;
            article.TitleEn = title;
            changed = true;
        }

        if (article.ExcerptEn == null)
        {
            var excerpt = await TranslateOrNull(article.Excerpt, 400, cancellationToken);
            if (excerpt == null) return changed;
            article.ExcerptEn = excerpt;
            changed = true;
        }

        if (article.BodyEn == null)
        {
            var body = await TranslateOrNull(article.Body, null, cancellationToken);
            if (body == null) return changed;
            article.BodyEn = body;
            changed = true;
        }

        return changed;
    }

    public async Task<bool> ApplyProductAsync(Product product, CancellationToken cancellationToken = default)
    {
        var changed = false;
        if (product.NameEn == null)
        {
            var name = await TranslateOrNull(product.Name, 160, cancellationToken);
            if (name == null) return changed;
            product.NameEn = name;
            changed = true;
        }

        if (product.DescriptionEn == null)
        {
            var description = await TranslateOrNull(product.Description, null, cancellationToken);
            if (description == null) return changed;
            product.DescriptionEn = description;
            changed = true;
        }

        return changed;
    }

    public async Task<bool> ApplyCommentAsync(Comment comment, CancellationToken cancellationToken = default)
    {
        if (comment.ContentEn != null) return false;
        var content = await TranslateOrNull(comment.Content, null, cancellationToken);
        if (content == null) return false;
        comment.ContentEn = content;
        return true;
    }

    private async Task<string?> TranslateOrNull(string? text, int? maxLength, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(text)) return string.Empty;

        var translated = await _translation.TranslateAsync(text, "en", "bg", cancellationToken);
        if (string.IsNullOrWhiteSpace(translated)) return null;
        if (translated.Contains("MYMEMORY WARNING", StringComparison.OrdinalIgnoreCase)) return null;
        if (translated == text && text.Any(c => c is >= '\u0400' and <= '\u04FF')) return null;
        if (maxLength is int limit && translated.Length > limit)
            translated = translated[..limit];
        return translated;
    }
}
