using System.Net;
using System.Net.Http.Headers;
using CulinaryBlog.Data;
using CulinaryBlog.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace CulinaryBlog.UnitTests;

[Collection("CulinaryIntegration")]
public class CommentDeletionTests : IAsyncLifetime
{
    private readonly HttpClient _client;
    private readonly CustomWebApplicationFactory _factory;

    public CommentDeletionTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        db.Comments.RemoveRange(db.Comments);
        db.Recipes.RemoveRange(db.Recipes);
        await db.SaveChangesAsync();
    }

    [Fact]
    public async Task DeleteComment_ByAuthor_Returns200()
    {
        var commentId = await SeedCommentAsync(CustomWebApplicationFactory.OtherUserId);

        var response = await SendAsync(HttpMethod.Delete, $"/api/v1/recipes/comments/{commentId}", CustomWebApplicationFactory.OtherUserId, "User");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.False(await CommentExistsAsync(commentId));
    }

    [Fact]
    public async Task DeleteComment_ByAdmin_Returns200()
    {
        var commentId = await SeedCommentAsync(CustomWebApplicationFactory.OtherUserId);

        var response = await SendAsync(HttpMethod.Delete, $"/api/v1/recipes/comments/{commentId}", CustomWebApplicationFactory.AdminUserId, "Admin");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.False(await CommentExistsAsync(commentId));
    }

    [Fact]
    public async Task DeleteComment_BySomeoneElse_Returns403()
    {
        var commentId = await SeedCommentAsync(CustomWebApplicationFactory.OtherUserId);

        var response = await SendAsync(HttpMethod.Delete, $"/api/v1/recipes/comments/{commentId}", CustomWebApplicationFactory.AuthorUserId, "User");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.True(await CommentExistsAsync(commentId));
    }

    [Fact]
    public async Task DeleteComment_WhenMissing_Returns404()
    {
        var response = await SendAsync(HttpMethod.Delete, "/api/v1/recipes/comments/999999", CustomWebApplicationFactory.AdminUserId, "Admin");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task ListCommentsForModeration_AsAdmin_ReturnsSeededComment()
    {
        var commentId = await SeedCommentAsync(CustomWebApplicationFactory.OtherUserId);

        var response = await SendAsync(HttpMethod.Get, "/api/v1/recipes/moderation/comments", CustomWebApplicationFactory.AdminUserId, "Admin");
        var body = await response.Content.ReadAsStringAsync();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Contains(commentId.ToString(), body);
        Assert.Contains("Вкусно е", body);
    }

    [Fact]
    public async Task ListCommentsForModeration_AsRegularUser_Returns403()
    {
        var response = await SendAsync(HttpMethod.Get, "/api/v1/recipes/moderation/comments", CustomWebApplicationFactory.AuthorUserId, "User");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task DeleteComment_WithoutAuthentication_Returns401()
    {
        var commentId = await SeedCommentAsync(CustomWebApplicationFactory.AuthorUserId);
        var request = new HttpRequestMessage(HttpMethod.Delete, $"/api/v1/recipes/comments/{commentId}");

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    private async Task<HttpResponseMessage> SendAsync(HttpMethod method, string url, int userId, string role)
    {
        var request = new HttpRequestMessage(method, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Test");
        request.Headers.Add(CustomWebApplicationFactory.TestUserHeader, userId.ToString());
        request.Headers.Add(CustomWebApplicationFactory.TestRoleHeader, role);
        return await _client.SendAsync(request);
    }

    private async Task<int> SeedCommentAsync(int authorId)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var recipe = new Recipe
        {
            Title = "Рецепта за коментар",
            Slug = "komentar-" + Guid.NewGuid().ToString("N"),
            Category = "Супи",
            Ingredients = "Продукти",
            Instructions = "Стъпки",
            AuthorId = CustomWebApplicationFactory.AuthorUserId,
            Status = "approved",
            CreatedAt = DateTime.UtcNow
        };
        db.Recipes.Add(recipe);
        await db.SaveChangesAsync();

        var comment = new Comment
        {
            RecipeId = recipe.Id,
            UserId = authorId,
            Content = "Вкусно е",
            CreatedAt = DateTime.UtcNow
        };
        db.Comments.Add(comment);
        await db.SaveChangesAsync();
        return comment.Id;
    }

    private async Task<bool> CommentExistsAsync(int commentId)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        return await db.Comments.AnyAsync(c => c.Id == commentId);
    }
}
