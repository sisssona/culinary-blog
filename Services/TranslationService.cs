using System.Net.Http.Json;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;

namespace CulinaryBlog.Services;

public class TranslationService
{
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

        try
        {
            var url = $"https://api.mymemory.translated.net/get?q={Uri.EscapeDataString(text)}&langpair={sourceLanguage}|{targetLanguage}";

            // Предаваме токена на HttpClient
            var response = await _httpClient.GetAsync(url, cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                return text;
            }

            var jsonResult = await response.Content.ReadFromJsonAsync<MyMemoryResponse>(cancellationToken: cancellationToken);
            var translated = jsonResult?.ResponseData?.TranslatedText;

            if (!string.IsNullOrWhiteSpace(translated) && !translated.StartsWith("MYMEMORY WARNING"))
            {
                return translated;
            }

            return text;
        }
        catch
        {
            return text;
        }
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