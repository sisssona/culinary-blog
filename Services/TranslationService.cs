using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;

namespace CulinaryBlog.Services;

public class TranslationService
{
    private const int ChunkSize = 450;
    private readonly HttpClient _httpClient;

    public TranslationService(HttpClient httpClient)
    {
        _httpClient = httpClient;
        if (!_httpClient.DefaultRequestHeaders.Contains("User-Agent"))
        {
            _httpClient.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
        }
    }

    public async Task<string> TranslateAsync(string text, string targetLanguage, string sourceLanguage = "bg", CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(text)) return string.Empty;

        var translated = new StringBuilder();
        foreach (var chunk in Chunk(text, ChunkSize))
        {
            var part = await TranslateChunkAsync(chunk, targetLanguage, sourceLanguage, cancellationToken);
            if (part == null) return text;
            translated.Append(part);
        }

        return translated.ToString();
    }

    private async Task<string?> TranslateChunkAsync(string text, string targetLanguage, string sourceLanguage, CancellationToken cancellationToken)
    {
        try
        {
            var url = $"https://api.mymemory.translated.net/get?q={Uri.EscapeDataString(text)}&langpair={sourceLanguage}|{targetLanguage}";
            var response = await _httpClient.GetAsync(url, cancellationToken);
            if (!response.IsSuccessStatusCode) return null;

            var jsonResult = await response.Content.ReadFromJsonAsync<MyMemoryResponse>(cancellationToken: cancellationToken);
            var translated = jsonResult?.ResponseData?.TranslatedText;
            if (string.IsNullOrWhiteSpace(translated) || translated.StartsWith("MYMEMORY WARNING", StringComparison.OrdinalIgnoreCase))
                return null;

            return WebUtility.HtmlDecode(translated);
        }
        catch
        {
            return null;
        }
    }

    private static IEnumerable<string> Chunk(string text, int size)
    {
        var current = new StringBuilder();
        foreach (var line in text.Replace("\r\n", "\n").Split('\n'))
        {
            if (line.Length > size)
            {
                if (current.Length > 0)
                {
                    current.Append('\n');
                    yield return current.ToString();
                    current.Clear();
                }

                for (var index = 0; index < line.Length; index += size)
                    yield return line.Substring(index, Math.Min(size, line.Length - index));
                continue;
            }

            var extra = current.Length == 0 ? line.Length : line.Length + 1;
            if (current.Length > 0 && current.Length + extra > size)
            {
                yield return current.ToString();
                current.Clear();
            }

            if (current.Length > 0) current.Append('\n');
            current.Append(line);
        }

        if (current.Length > 0) yield return current.ToString();
    }

    private class MyMemoryResponse
    {
        [JsonPropertyName("responseData")]
        public ResponseDataData? ResponseData { get; set; }
    }

    private class ResponseDataData
    {
        [JsonPropertyName("translatedText")]
        public string TranslatedText { get; set; } = string.Empty;
    }
}