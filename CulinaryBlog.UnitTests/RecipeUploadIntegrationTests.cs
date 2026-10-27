using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Threading.Tasks;
using CulinaryBlog.Data;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace CulinaryBlog.UnitTests
{
    [Collection("CulinaryIntegration")]
    public class RecipeUploadIntegrationTests : IAsyncLifetime
    {
        private readonly HttpClient _client;
        private readonly CustomWebApplicationFactory _factory;

        // Валиден 1x1 PNG. ImageMagick отхвърля отрязан JPEG и middleware връща 400.
        private static readonly byte[] ValidPngBytes = Convert.FromBase64String(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==");

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
            using var formData = await CreateRecipeFormAsync("Интеграционна Рецепта", "Супи");
            AddImage(formData, "test-photo.png");

            var response = await _client.PostAsync("/api/v1/recipes", formData);
            var body = await response.Content.ReadAsStringAsync();

            Assert.True(response.StatusCode == HttpStatusCode.Created, body);

            using var document = JsonDocument.Parse(body);
            var root = document.RootElement;

            Assert.True(root.TryGetProperty("imageUrl", out var imageUrl));
            Assert.True(root.TryGetProperty("thumbnailUrl", out var thumbnailUrl));
            Assert.Contains("/uploads/", imageUrl.GetString());
            Assert.False(string.IsNullOrWhiteSpace(thumbnailUrl.GetString()));
        }

        [Fact]
        public async Task UploadRecipe_WithInvalidFileType_ShouldBeCaughtByExceptionMiddleware()
        {
            using var formData = await CreateRecipeFormAsync("Тест с лош файл", "Десерти");

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
            using var formData = await CreateRecipeFormAsync("Рецепта за статичен тест", "Основни");
            AddImage(formData, "static-test.png");

            var uploadResponse = await _client.PostAsync("/api/v1/recipes", formData);
            var jsonString = await uploadResponse.Content.ReadAsStringAsync();
            Assert.True(uploadResponse.StatusCode == HttpStatusCode.Created, jsonString);

            using var doc = JsonDocument.Parse(jsonString);
            var relativeImageUrl = doc.RootElement.GetProperty("imageUrl").GetString();

            var fileResponse = await _client.GetAsync(relativeImageUrl);
            Assert.Equal(HttpStatusCode.OK, fileResponse.StatusCode);
        }

        [Fact]
        public async Task UploadRecipe_WithoutAuthentication_ShouldReturn401Unauthorized()
        {
            _client.DefaultRequestHeaders.Authorization = null;

            using var formData = await CreateRecipeFormAsync("Неоторизирана Рецепта", "Супи");
            var response = await _client.PostAsync("/api/v1/recipes", formData);

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);

            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Test");
        }

        [Fact]
        public async Task UploadRecipe_WithMissingRequiredFields_ShouldReturn400BadRequest()
        {
            using var formData = new MultipartFormDataContent();
            formData.Add(new StringContent("Супи"), "Category");
            formData.Add(new StringContent("Продукти..."), "Ingredients");
            formData.Add(new StringContent("Инструкции..."), "Instructions");
            formData.Add(new StringContent("true"), "AgreedToTerms");
            formData.Add(new StringContent(await TagIdsJsonAsync()), "TagsJson");

            var response = await _client.PostAsync("/api/v1/recipes", formData);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task UploadRecipe_WithoutConfirmedEmail_ShouldReturn400()
        {
            using var formData = await CreateRecipeFormAsync("Непотвърдена рецепта", "Супи");
            var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/recipes") { Content = formData };
            request.Headers.Authorization = new AuthenticationHeaderValue("Test");
            request.Headers.Add(CustomWebApplicationFactory.TestUserHeader, CustomWebApplicationFactory.UnconfirmedUserId.ToString());

            var response = await _client.SendAsync(request);
            var body = await response.Content.ReadAsStringAsync();

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            Assert.Contains("потвърдите имейла", body);
        }

        [Fact]
        public async Task UploadRecipe_WithoutAgreedTerms_ShouldReturn400()
        {
            using var formData = await CreateRecipeFormAsync("Без условия", "Супи", agreedToTerms: false);
            var response = await _client.PostAsync("/api/v1/recipes", formData);
            var body = await response.Content.ReadAsStringAsync();

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            Assert.Contains("условията", body);
        }

        [Fact]
        public async Task UploadRecipe_WithTooManyTags_ShouldReturn400()
        {
            using var formData = await CreateRecipeFormAsync("Много тагове", "Супи", tagsJson: "[1,2,3,4]");
            var response = await _client.PostAsync("/api/v1/recipes", formData);
            var body = await response.Content.ReadAsStringAsync();

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            Assert.Contains("тага", body);
        }

        private async Task<MultipartFormDataContent> CreateRecipeFormAsync(
            string title,
            string category,
            bool agreedToTerms = true,
            string? tagsJson = null)
        {
            var form = new MultipartFormDataContent();
            form.Add(new StringContent(title), "Title");
            form.Add(new StringContent(category), "Category");
            form.Add(new StringContent("Продукти..."), "Ingredients");
            form.Add(new StringContent("Инструкции..."), "Instructions");
            form.Add(new StringContent(tagsJson ?? await TagIdsJsonAsync()), "TagsJson");
            if (agreedToTerms)
                form.Add(new StringContent("true"), "AgreedToTerms");
            return form;
        }

        private static void AddImage(MultipartFormDataContent form, string fileName)
        {
            var imageContent = new ByteArrayContent(ValidPngBytes);
            imageContent.Headers.ContentType = MediaTypeHeaderValue.Parse("image/png");
            form.Add(imageContent, "ImageFile", fileName);
        }

        private async Task<List<int>> TagIdsAsync()
        {
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            return await db.Tags.OrderBy(t => t.Id).Select(t => t.Id).Take(3).ToListAsync();
        }

        private async Task<string> TagIdsJsonAsync()
        {
            var ids = await TagIdsAsync();
            return "[" + string.Join(',', ids) + "]";
        }
    }
}