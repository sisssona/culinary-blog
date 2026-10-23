using System.Security.Claims;
using System.Text.Encodings.Web;
using CulinaryBlog.Data;
using CulinaryBlog.Models;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Testcontainers.PostgreSql;

namespace CulinaryBlog.UnitTests;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    public const int AuthorUserId = 1;
    public const int OtherUserId = 2;
    public const int UnconfirmedUserId = 3;
    public const int AdminUserId = 4;

    public const string TestUserHeader = "X-Test-User";
    public const string TestRoleHeader = "X-Test-Role";

    private readonly PostgreSqlContainer _dbContainer = new PostgreSqlBuilder("postgres:15-alpine")
        .WithDatabase("culinary_blog_test")
        .WithUsername("postgres")
        .WithPassword("postgres")
        .Build();

    public CustomWebApplicationFactory()
    {
        // Program.cs чете Jwt:Key още при стартиране, преди ConfigureAppConfiguration.
        Environment.SetEnvironmentVariable("Jwt__Key", "test-signing-key-0123456789abcdef");
        Environment.SetEnvironmentVariable("Jwt__Issuer", "CulinaryBlog");
        Environment.SetEnvironmentVariable("Jwt__Audience", "CulinaryBlogUsers");
    }

    public async Task InitializeAsync()
    {
        await _dbContainer.StartAsync();
    }

    public new async Task DisposeAsync()
    {
        await _dbContainer.DisposeAsync();
        await base.DisposeAsync();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"] = "test-signing-key-0123456789abcdef",
                ["Jwt:Issuer"] = "CulinaryBlog",
                ["Jwt:Audience"] = "CulinaryBlogUsers",
                ["ConnectionStrings:DefaultConnection"] = "Host=localhost;Database=culinary_blog_test;Username=postgres;Password=postgres"
            });
        });

        builder.ConfigureServices(services =>
        {
            var descriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>));

            if (descriptor != null)
                services.Remove(descriptor);

            services.AddDbContext<ApplicationDbContext>(options =>
            {
                options.UseNpgsql(_dbContainer.GetConnectionString());
            });

            services.AddAuthentication("Test")
                .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>("Test", _ => { });

            services.PostConfigure<AuthenticationOptions>(options =>
            {
                options.DefaultAuthenticateScheme = "Test";
                options.DefaultChallengeScheme = "Test";
                options.DefaultForbidScheme = "Test";
            });

            var sp = services.BuildServiceProvider();
            using var scope = sp.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            db.Database.EnsureCreated();
            Seed(db);
        });
    }

    private static void Seed(ApplicationDbContext db)
    {
        if (!db.Users.Any())
        {
            db.Users.AddRange(
                User(AuthorUserId, "author@culinary.test", "Author", "User", emailConfirmed: true),
                User(OtherUserId, "other@culinary.test", "Other", "User", emailConfirmed: true),
                User(UnconfirmedUserId, "unconfirmed@culinary.test", "Unconfirmed", "User", emailConfirmed: false),
                User(AdminUserId, "admin@culinary.test", "Admin", "Admin", emailConfirmed: true));
            db.SaveChanges();
            db.Database.ExecuteSqlRaw(
                """SELECT setval(pg_get_serial_sequence('"Users"', 'Id'), (SELECT MAX("Id") FROM "Users"));""");
        }

        if (!db.Categories.Any())
        {
            db.Categories.AddRange(
                new Category { Name = "Супи", NameEn = "Soups", Slug = "supi", SortOrder = 1 },
                new Category { Name = "Десерти", NameEn = "Desserts", Slug = "deserti", SortOrder = 2 },
                new Category { Name = "Основни", NameEn = "Mains", Slug = "osnovni", SortOrder = 3 });
            db.SaveChanges();
        }

        if (!db.Tags.Any())
        {
            db.Tags.AddRange(
                new Tag { Name = "Бързо", NameEn = "Quick", Slug = "barzo", Group = "time" },
                new Tag { Name = "Обяд", NameEn = "Lunch", Slug = "obyad", Group = "occasion" },
                new Tag { Name = "Веган", NameEn = "Vegan", Slug = "vegan", Group = "diet" });
            db.SaveChanges();
        }
    }

    private static User User(int id, string email, string name, string role, bool emailConfirmed) => new()
    {
        Id = id,
        Email = email,
        DisplayName = name,
        PasswordHash = "dummy_hash",
        Role = role,
        EmailConfirmed = emailConfirmed,
        CreatedAt = DateTime.UtcNow
    };
}

public class TestAuthHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public TestAuthHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder) : base(options, logger, encoder)
    {
    }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (!Request.Headers.ContainsKey("Authorization"))
            return Task.FromResult(AuthenticateResult.NoResult());

        var userId = Request.Headers.TryGetValue(CustomWebApplicationFactory.TestUserHeader, out var userHeader)
            ? userHeader.ToString()
            : CustomWebApplicationFactory.AuthorUserId.ToString();

        var role = Request.Headers.TryGetValue(CustomWebApplicationFactory.TestRoleHeader, out var roleHeader)
            ? roleHeader.ToString()
            : "User";

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId),
            new Claim(ClaimTypes.Name, "TestUser"),
            new Claim(ClaimTypes.Role, role)
        };
        var identity = new ClaimsIdentity(claims, "Test");
        var ticket = new AuthenticationTicket(new ClaimsPrincipal(identity), "Test");
        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}

[CollectionDefinition("CulinaryIntegration")]
public class CulinaryIntegrationCollection : ICollectionFixture<CustomWebApplicationFactory>;
