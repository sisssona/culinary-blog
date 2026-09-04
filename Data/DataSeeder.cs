using CulinaryBlog.Models;

namespace CulinaryBlog.Data;

public static class DataSeeder
{
    public static void SeedData(ApplicationDbContext context)
    {
        // Проверяваме дали вече има потребители в базата
        if (!context.Users.Any())
        {
            var defaultUser = new User
            {
                Email = "admin@culinaryblog.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
                Role = "Admin",
                CreatedAt = DateTime.UtcNow
            };

            context.Users.Add(defaultUser);
            context.SaveChanges();

            // Добавяме начална примерна рецепта
            if (!context.Recipes.Any())
            {
                var sampleRecipe = new Recipe
                {
                    Title = "Табуле със зелена чушка и киноа",
                    Category = "Салати",
                    Ingredients = "1 ч.ч. киноа, 1 зелена чушка, 1 връзка магданоз, прясна мента, зехтин, лимон",
                    Instructions = "Сварете киноата и я оставете да изстине. Нарежете зеленчуците и магданоза на ситно. Смесете всичко с пресните листа мента, зехтина и лимоновия сок.",
                    Status = "approved",
                    CreatedAt = DateTime.UtcNow,
                    AuthorId = defaultUser.Id
                };

                context.Recipes.Add(sampleRecipe);
                context.SaveChanges();
            }
        }
    }
}