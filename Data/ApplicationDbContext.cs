using CulinaryBlog.Models;
using Microsoft.EntityFrameworkCore;

namespace CulinaryBlog.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Recipe> Recipes => Set<Recipe>();
    public DbSet<RecipeTranslation> RecipeTranslations => Set<RecipeTranslation>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<RecipeTranslation>()
            .HasIndex(t => new { t.RecipeId, t.Language })
            .IsUnique();
    }
}