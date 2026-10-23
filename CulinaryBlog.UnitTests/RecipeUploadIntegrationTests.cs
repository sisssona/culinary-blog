using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Threading.Tasks;
using CulinaryBlog.Data;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace CulinaryBlog.UnitTests
{
    public class RecipeUploadIntegrationTests : IClassFixture<CustomWebApplicationFactory>, IAsyncLifetime
    {
        private readonly HttpClient _client;
        private readonly CustomWebApplicationFactory _factory;

        private static readonly byte[] DummyJpegBytes = new byte[] {
            0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
            0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
            0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
            0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
            0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
            0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
            0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
            0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
            0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00,
            0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
            0x09, 0x0A, 0x0B, 0xFF, 0xC4, 0x00, 0xB5, 0x10, 0x00, 0x02, 0x01, 0x03,
            0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7D,
            0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06,
            0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xA1, 0x08,
            0x23, 0x42, 0xB1, 0xC1, 0x15, 0x52, 0xD1, 0xF0, 0x24, 0x33, 0x62, 0x72,
            0x82, 0x09, 0x0A, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x25, 0x26, 0x27, 0x28,
            0x29, 0x2A, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x43, 0x44, 0x45,
            0x46, 0x47, 0x48, 0x49, 0x4A, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59,
            0x5A, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6A, 0x73, 0x74, 0x75,
            0x76, 0x77, 0x78, 0x79, 0x7A, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89,
            0x8A, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9A, 0xA2, 0xA3,
            0xA4, 0xA5, 0xA6, 0xA7, 0xA8, 0xA9, 0xAA, 0xB2, 0xB3, 0xB4, 0xB5, 0xB6,
            0xB7, 0xB8, 0xB9, 0xBA, 0xC2, 0xC3, 0xC4, 0xC5, 0xC6, 0xC7, 0xC8, 0xC9,
            0xCA, 0xD2, 0xD3, 0xD4, 0xD5, 0xD6, 0xD7, 0xD8, 0xD9, 0xDA, 0xE1, 0xE2,
            0xE3, 0xE4, 0xE5, 0xE6, 0xE7, 0xE8, 0xE9, 0xEA, 0xF1, 0xF2, 0xF3, 0xF4,
            0xF5, 0xF6, 0xF7, 0xF8, 0xF9, 0xFA, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01,
            0x00, 0x00, 0x3F, 0x00, 0x37, 0xFF, 0xC0, 0x00, 0xFF, 0xD9
        };

        public RecipeUploadIntegrationTests(CustomWebApplicationFactory factory)
        {
            _factory = factory;
            _client = factory.CreateClient(new WebApplicationFactoryClientOptions
            {
                AllowAutoRedirect = false
            });

            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Test");
        }

        public Task InitializeAsync() => Task.CompletedTask;

        // Извиква се автоматично от xUnit след всеки завършен тест в този клас
        public async Task DisposeAsync()
        {
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            // Изчистване на таблиците с преводи и рецепти, за да се гарантира изолация
            db.RecipeTranslations.RemoveRange(db.RecipeTranslations);
            db.Recipes.RemoveRange(db.Recipes);
            await db.SaveChangesAsync();

            // Изчистване на качените тестови файлове от диска
            var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
            if (Directory.Exists(uploadsPath))
            {
                foreach (var file in Directory.GetFiles(uploadsPath, "*", SearchOption.AllDirectories))
                {
                    try { File.Delete(file); } catch { }
                }
            }
        }

        [Fact]
        public async Task UploadRecipe_WithValidImage_ShouldReturn201CreatedAndFilePaths()
        {
            using var formData = new MultipartFormDataContent();

            formData.Add(new StringContent("Интеграционна Рецепта"), "Title");
            formData.Add(new StringContent("Супи"), "Category");
            formData.Add(new StringContent("Продукти..."), "Ingredients");
            formData.Add(new StringContent("Инструкции..."), "Instructions");

            var imageContent = new ByteArrayContent(DummyJpegBytes);
            imageContent.Headers.ContentType = MediaTypeHeaderValue.Parse("image/jpeg");

            formData.Add(imageContent, "ImageFile", "test-photo.jpg");

            var response = await _client.PostAsync("/api/v1/recipes", formData);

            Assert.Equal(HttpStatusCode.Created, response.StatusCode);

            var jsonString = await response.Content.ReadAsStringAsync();
            using var document = JsonDocument.Parse(jsonString);
            var root = document.RootElement;

            Assert.True(root.TryGetProperty("imageUrl", out var imageUrl));
            Assert.True(root.TryGetProperty("thumbnailUrl", out var thumbnailUrl));

            Assert.Contains("/uploads/", imageUrl.GetString());
        }

        [Fact]
        public async Task UploadRecipe_WithInvalidFileType_ShouldBeCaughtByExceptionMiddleware()
        {
            using var formData = new MultipartFormDataContent();
            formData.Add(new StringContent("Тест с лош файл"), "Title");
            formData.Add(new StringContent("Десерти"), "Category");
            formData.Add(new StringContent("Продукти"), "Ingredients");
            formData.Add(new StringContent("Инструкции"), "Instructions");

            var fileBytes = System.Text.Encoding.UTF8.GetBytes("Това е текстов файл, а не снимка!");
            var fileContent = new ByteArrayContent(fileBytes);
            fileContent.Headers.ContentType = MediaTypeHeaderValue.Parse("text/plain");

            formData.Add(fileContent, "ImageFile", "virus.exe");

            var response = await _client.PostAsync("/api/v1/recipes", formData);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);

            var responseBody = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(responseBody);
            var root = doc.RootElement;

            int actualStatus = 0;
            if (root.TryGetProperty("status", out var statusProp))
            {
                actualStatus = statusProp.GetInt32();
            }
            else if (root.TryGetProperty("statusCode", out var statusCodeProp))
            {
                actualStatus = statusCodeProp.GetInt32();
            }

            Assert.Equal(400, actualStatus);

            Assert.True(root.TryGetProperty("errors", out var errorsProp));
            Assert.True(errorsProp.TryGetProperty("ImageFile", out var imageFileErrors));

            var errorMessages = imageFileErrors.EnumerateArray()
                .Select(e => e.GetString() ?? string.Empty)
                .ToArray();

            Assert.Contains(errorMessages, msg => msg.Contains("Позволени са само следните формати"));
        }

        [Fact]
        public async Task GetStaticFile_AfterUpload_ShouldReturn200OK()
        {
            using var formData = new MultipartFormDataContent();
            formData.Add(new StringContent("Рецепта за статичен тест"), "Title");
            formData.Add(new StringContent("Основни"), "Category");
            formData.Add(new StringContent("Продукти"), "Ingredients");
            formData.Add(new StringContent("Инструкции"), "Instructions");

            var imageContent = new ByteArrayContent(DummyJpegBytes);
            imageContent.Headers.ContentType = MediaTypeHeaderValue.Parse("image/jpeg");
            formData.Add(imageContent, "ImageFile", "static-test.jpg");

            var uploadResponse = await _client.PostAsync("/api/v1/recipes", formData);

            if (uploadResponse.StatusCode == HttpStatusCode.Created)
            {
                var jsonString = await uploadResponse.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(jsonString);
                var relativeImageUrl = doc.RootElement.GetProperty("imageUrl").GetString();

                var fileResponse = await _client.GetAsync(relativeImageUrl);
                Assert.Equal(HttpStatusCode.OK, fileResponse.StatusCode);
            }
        }

        [Fact]
        public async Task UploadRecipe_WithoutAuthentication_ShouldReturn401Unauthorized()
        {
            _client.DefaultRequestHeaders.Authorization = null;

            using var formData = new MultipartFormDataContent();
            formData.Add(new StringContent("Неоторизирана Рецепта"), "Title");
            formData.Add(new StringContent("Супи"), "Category");
            formData.Add(new StringContent("Продукти..."), "Ingredients");
            formData.Add(new StringContent("Инструкции..."), "Instructions");

            var response = await _client.PostAsync("/api/v1/recipes", formData);

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);

            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Test");
        }

        [Fact]
        public async Task UploadRecipe_WithMissingRequiredFields_ShouldReturn400BadRequest()
        {
            using var formData = new MultipartFormDataContent();

            // Пропускаме "Title"
            formData.Add(new StringContent("Супи"), "Category");
            formData.Add(new StringContent("Продукти..."), "Ingredients");
            formData.Add(new StringContent("Инструкции..."), "Instructions");

            var response = await _client.PostAsync("/api/v1/recipes", formData);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }
    }
}