using System;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Text.Encodings.Web;
using System.Threading.Tasks;
using CulinaryBlog.Data;
using CulinaryBlog.Models;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Testcontainers.PostgreSql;
using Xunit;

namespace CulinaryBlog.UnitTests
{
    public class CustomWebApplicationFactory : WebApplicationFactory<Program>, IAsyncLifetime
    {
        private readonly PostgreSqlContainer _dbContainer = new PostgreSqlBuilder()
            .WithImage("postgres:15-alpine")
            .WithDatabase("culinary_blog_test")
            .WithUsername("postgres")
            .WithPassword("postgres")
            .Build();

        public async Task InitializeAsync()
        {
            await _dbContainer.StartAsync();
        }

        public new async Task DisposeAsync()
        {
            await _dbContainer.DisposeAsync();
            CleanupUploadedFiles();
            await base.DisposeAsync();
        }

        private void CleanupUploadedFiles()
        {
            var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
            if (Directory.Exists(uploadsPath))
            {
                try
                {
                    Directory.Delete(uploadsPath, recursive: true);
                }
                catch
                {
                    // Игнорираме заключени файлове при изтриване
                }
            }
        }

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            // Указваме на хоста, че се намираме в тестова среда
            builder.UseEnvironment("Testing");

            builder.ConfigureServices(services =>
            {
                var descriptor = services.SingleOrDefault(
                    d => d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>));

                if (descriptor != null)
                {
                    services.Remove(descriptor);
                }

                services.AddDbContext<ApplicationDbContext>(options =>
                {
                    options.UseNpgsql(_dbContainer.GetConnectionString());
                });

                services.AddAuthentication("Test")
                    .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>("Test", options => { });

                var sp = services.BuildServiceProvider();
                using var scope = sp.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                db.Database.EnsureCreated();

                // Сийдване на нужен тест потребител с Id = 1, за да могат рецептите да се записват успешно
                if (!db.Users.Any(u => u.Id == 1))
                {
                    db.Users.Add(new User
                    {
                        Id = 1,
                        Email = "test@culinary.com",
                        PasswordHash = "dummy_hash",
                        Role = "User",
                        CreatedAt = DateTime.UtcNow
                    });
                    db.SaveChanges();
                }
            });
        }
    }

    public class TestAuthHandler : AuthenticationHandler<AuthenticationSchemeOptions>
    {
        public TestAuthHandler(
            IOptionsMonitor<AuthenticationSchemeOptions> options,
            ILoggerFactory logger,
            UrlEncoder encoder,
            Microsoft.AspNetCore.Authentication.ISystemClock clock) : base(options, logger, encoder, clock) { }

        protected override Task<AuthenticateResult> HandleAuthenticateAsync()
        {
            // Проверяваме дали в заявката има Authorization хедър
            if (!Context.Request.Headers.ContainsKey("Authorization"))
            {
                return Task.FromResult(AuthenticateResult.NoResult());
            }

            var claims = new[] { new Claim(ClaimTypes.NameIdentifier, "1"), new Claim(ClaimTypes.Name, "TestUser") };
            var identity = new ClaimsIdentity(claims, "Test");
            var principal = new ClaimsPrincipal(identity);
            var ticket = new AuthenticationTicket(principal, "Test");

            return Task.FromResult(AuthenticateResult.Success(ticket));
        }
    }
}