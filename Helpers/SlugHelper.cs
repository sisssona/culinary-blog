using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace CulinaryBlog.Helpers;

public static class SlugHelper
{
    private static readonly Dictionary<char, string> Bulgarian = new()
    {
        ['а'] = "a", ['б'] = "b", ['в'] = "v", ['г'] = "g", ['д'] = "d",
        ['е'] = "e", ['ж'] = "zh", ['з'] = "z", ['и'] = "i", ['й'] = "y",
        ['к'] = "k", ['л'] = "l", ['м'] = "m", ['н'] = "n", ['о'] = "o",
        ['п'] = "p", ['р'] = "r", ['с'] = "s", ['т'] = "t", ['у'] = "u",
        ['ф'] = "f", ['х'] = "h", ['ц'] = "ts", ['ч'] = "ch", ['ш'] = "sh",
        ['щ'] = "sht", ['ъ'] = "a", ['ь'] = "", ['ю'] = "yu", ['я'] = "ya"
    };

    public static string Slugify(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
            return "item";

        var sb = new StringBuilder();
        foreach (var c in text.Trim().ToLowerInvariant())
        {
            if (Bulgarian.TryGetValue(c, out var mapped))
                sb.Append(mapped);
            else if (c is >= 'a' and <= 'z' or >= '0' and <= '9')
                sb.Append(c);
            else if (char.IsWhiteSpace(c) || c is '-' or '_' or '.')
                sb.Append('-');
        }

        var slug = Regex.Replace(sb.ToString(), "-+", "-").Trim('-');
        return string.IsNullOrEmpty(slug) ? "item" : slug;
    }

    public static string Unique(string baseSlug, Func<string, bool> exists)
    {
        var slug = baseSlug;
        var i = 2;
        while (exists(slug))
        {
            slug = $"{baseSlug}-{i}";
            i++;
        }
        return slug;
    }
}
