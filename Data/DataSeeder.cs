using CulinaryBlog.Helpers;
using CulinaryBlog.Models;

namespace CulinaryBlog.Data;

public static class DataSeeder
{
    public static void SeedData(ApplicationDbContext context)
    {
        SeedCategories(context);

        if (!context.Users.Any())
        {
            var admin = new User
            {
                Email = "admin@culinaryblog.com",
                DisplayName = "Редакция",
                Bio = "Екипът на кулинарния блог.",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
                Role = "Admin",
                CreatedAt = DateTime.UtcNow
            };
            var cook = new User
            {
                Email = "iva@culinaryblog.com",
                DisplayName = "Ива Петрова",
                Bio = "Домашна кухня, сезонни салати и яхнии.",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Cook123!"),
                Role = "User",
                CreatedAt = DateTime.UtcNow
            };
            context.Users.AddRange(admin, cook);
            context.SaveChanges();
        }

        foreach (var user in context.Users.Where(u => string.IsNullOrWhiteSpace(u.DisplayName)))
        {
            user.DisplayName = user.Email.Split('@')[0];
        }
        context.SaveChanges();

        if (!context.Recipes.Any())
        {
            var admin = context.Users.First(u => u.Role == "Admin");
            var cook = context.Users.FirstOrDefault(u => u.Role != "Admin") ?? admin;
            var salads = FindCategory(context, "salati");
            var mains = FindCategory(context, "osnovni-yastiya");
            var desserts = FindCategory(context, "deserti");
            var soups = FindCategory(context, "supi");

            AddRecipe(context, cook, salads, "Табуле със зелена чушка и киноа",
                "Салата с киноа, магданоз и лимон — лека и свежа.",
                ["1 ч.ч. киноа", "1 зелена чушка", "1 връзка магданоз", "прясна мента", "зехтин", "лимон"],
                ["Сварете киноата и я оставете да изстине.", "Нарежете зеленчуците и магданоза на ситно.", "Смесете с мента, зехтин и лимонов сок."],
                15, 15, 4, "easy", true, "approved");

            AddRecipe(context, admin, soups, "Домашна пилешка супа с фиде",
                "Класическа супа за всеки ден.",
                ["500 г пилешко", "1 морков", "1 лук", "фиде", "магданоз", "сол"],
                ["Сварете пилето в подсолена вода и обелете бульона.", "Добавете нарязаните зеленчуци.", "Накрая сложете фидето и поръсете с магданоз."],
                20, 50, 6, "easy", true, "approved");

            AddRecipe(context, cook, mains, "Свинска яхния с патладжан и картофи",
                "Бавна яхния с чушки и патладжан.",
                ["800 г свинско", "2 патладжана", "3 картофа", "2 чушки", "лук", "домати"],
                ["Запържете месото до златисто.", "Добавете зеленчуците и доматите.", "Задушете на тих огън около 50 минути."],
                25, 60, 5, "medium", false, "approved");

            AddRecipe(context, admin, desserts, "Мраморен шоколадов чийзкейк",
                "Крем чийзкейк с тъмен шоколад.",
                ["400 г крема сирене", "150 г шоколад", "3 яйца", "бисквитена основа", "захар"],
                ["Пригответе основата от бисквити.", "Разбъркайте крема и разтопения шоколад.", "Печете на водна баня до стегнат крем."],
                30, 70, 8, "hard", true, "approved");

            AddRecipe(context, cook, salads, "Салата с кускус, яйца и сирене",
                "Балансирана салата за обяд.",
                ["1 ч.ч. кускус", "2 яйца", "сирене", "краставица", "маслини", "зехтин"],
                ["Залейте кускуса с гореща вода.", "Нарежете зеленчуците и яйцата.", "Смесете и овкусете със зехтин."],
                10, 10, 2, "easy", false, "approved");

            context.SaveChanges();
        }
        else
        {
            foreach (var recipe in context.Recipes.Where(r => string.IsNullOrWhiteSpace(r.Slug)))
            {
                recipe.Slug = SlugHelper.Unique(SlugHelper.Slugify(recipe.Title), s => context.Recipes.Any(x => x.Slug == s && x.Id != recipe.Id));
            }

            if (context.Recipes.Any(r => r.CategoryId == null) && context.Categories.Any())
            {
                var fallback = context.Categories.OrderBy(c => c.SortOrder).First();
                foreach (var recipe in context.Recipes.Where(r => r.CategoryId == null))
                {
                    var match = context.Categories.FirstOrDefault(c =>
                        c.Name.Equals(recipe.Category, StringComparison.OrdinalIgnoreCase));
                    recipe.CategoryId = match?.Id ?? fallback.Id;
                    if (string.IsNullOrWhiteSpace(recipe.Category))
                        recipe.Category = match?.Name ?? fallback.Name;
                    if (string.Equals(recipe.Status, "pending", StringComparison.OrdinalIgnoreCase)
                        && recipe.IsFeatured)
                        recipe.Status = "approved";
                }
            }
            context.SaveChanges();
        }

        if (!context.Articles.Any() && context.Users.Any())
        {
            var author = context.Users.First(u => u.Role == "Admin");
            context.Articles.AddRange(
                new Article
                {
                    Title = "Как да съхраняваме листните салати свежи",
                    Slug = "kak-da-sahranyavame-salati",
                    Excerpt = "Прости навици, с които айсбергът и марулята издържат по-дълго в хладилника.",
                    Body = "Измийте листата, подсушете ги добре и ги приберете в кутия с кухненска хартия. Сменяйте хартията на всеки два дни. Не режете салатата предварително, ако няма да я консумирате веднага.",
                    AuthorId = author.Id,
                    CreatedAt = DateTime.UtcNow.AddDays(-2)
                },
                new Article
                {
                    Title = "Тайната на сочното свинско печено",
                    Slug = "taynata-na-sochnoto-svinsko-pecheno",
                    Excerpt = "Температура, почивка на месото и марината — трите стъпки, които променят печеното.",
                    Body = "Мариновайте месото поне 4 часа. Печете първо на по-висока температура за коричка, после намалете. Оставете печеното да почине 10 минути преди нарязване, за да се върнат соковете.",
                    AuthorId = author.Id,
                    CreatedAt = DateTime.UtcNow.AddDays(-1)
                },
                new Article
                {
                    Title = "Домашен хляб без millи за тесто",
                    Slug = "domashen-hlyab-bez-mili",
                    Excerpt = "Рецепта с малко месене и дълга ферментация.",
                    Body = "Смесете брашно, вода, сол и мая. Оставете тестото да втаса бавно в хладилник. Печете в гореща тенджера с капак за хрупкава кора.",
                    AuthorId = author.Id,
                    CreatedAt = DateTime.UtcNow
                }
            );
            context.SaveChanges();
        }
    }

    private static void SeedCategories(ApplicationDbContext context)
    {
        if (context.Categories.Any()) return;

        var items = new (string Name, string NameEn, string Slug)[]
        {
            ("Салати", "Salads", "salati"),
            ("Предястия", "Starters", "predyastiya"),
            ("Супи", "Soups", "supi"),
            ("Основни ястия", "Main dishes", "osnovni-yastiya"),
            ("Ястия с месо", "Meat dishes", "yastiya-s-meso"),
            ("Паста", "Pasta", "pasta"),
            ("Морски дарове", "Seafood", "morski-darove"),
            ("Пица", "Pizza", "pica"),
            ("Зеленчукови ястия", "Vegetable dishes", "zelenchukovi-yastiya"),
            ("Закуски и печива", "Breakfast & baking", "zakuski-i-pechiva"),
            ("Десерти", "Desserts", "deserti"),
            ("Сосове", "Sauces", "sosove"),
            ("Напитки", "Drinks", "napitki"),
            ("Туршии и зимнина", "Preserves", "turshii-i-zimnina"),
            ("Рецепти за здраве", "Healthy recipes", "recepti-za-zdrave")
        };

        var order = 1;
        foreach (var (name, nameEn, slug) in items)
        {
            context.Categories.Add(new Category
            {
                Name = name,
                NameEn = nameEn,
                Slug = slug,
                SortOrder = order++
            });
        }
        context.SaveChanges();
    }

    private static Category FindCategory(ApplicationDbContext context, string slug) =>
        context.Categories.First(c => c.Slug == slug);

    private static void AddRecipe(
        ApplicationDbContext context,
        User author,
        Category category,
        string title,
        string summaryUnused,
        string[] ingredients,
        string[] steps,
        int prep,
        int cook,
        int servings,
        string difficulty,
        bool featured,
        string status)
    {
        _ = summaryUnused;
        var recipe = new Recipe
        {
            Title = title,
            Slug = SlugHelper.Unique(SlugHelper.Slugify(title), s => context.Recipes.Local.Any(r => r.Slug == s) || context.Recipes.Any(r => r.Slug == s)),
            Category = category.Name,
            CategoryId = category.Id,
            Ingredients = string.Join('\n', ingredients),
            Instructions = string.Join('\n', steps),
            Status = status,
            IsFeatured = featured,
            PrepTimeMinutes = prep,
            CookTimeMinutes = cook,
            Servings = servings,
            Difficulty = difficulty,
            CreatedAt = DateTime.UtcNow,
            AuthorId = author.Id
        };

        for (var i = 0; i < ingredients.Length; i++)
        {
            var parsed = RecipeMapper.ParseIngredient(ingredients[i]);
            recipe.IngredientItems.Add(new RecipeIngredient
            {
                SortOrder = i,
                Amount = parsed.Amount,
                Name = parsed.Name
            });
        }

        for (var i = 0; i < steps.Length; i++)
        {
            recipe.Steps.Add(new RecipeStep { SortOrder = i + 1, Text = steps[i] });
        }

        context.Recipes.Add(recipe);
    }
}
