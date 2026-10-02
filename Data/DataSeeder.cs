using CulinaryBlog.Helpers;
using CulinaryBlog.Models;

namespace CulinaryBlog.Data;

public static class DataSeeder
{
    public static void SeedData(ApplicationDbContext context)
    {
        SeedCategories(context);
        SeedCategoryTree(context);
        SeedTags(context);

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

        // Keep each recipe's denormalized Category name text in sync with its
        // linked Category row, in case a category was renamed (e.g. by SeedCategoryTree).
        foreach (var recipe in context.Recipes.Where(r => r.CategoryId != null))
        {
            var linked = context.Categories.Find(recipe.CategoryId);
            if (linked != null && recipe.Category != linked.Name)
                recipe.Category = linked.Name;
        }
        context.SaveChanges();

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
                    Excerpt = "Температура, почивка на месото и марината — трите стъпки, които променят печеното.",
                    Slug = "taynata-na-sochnoto-svinsko-pecheno",
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
            ("Десерти", "Desserts", "deserti"),
            ("Напитки", "Drinks", "napitki")
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

    // Builds/updates the category tree with subcategories.
    // Safe to run on every startup: matches existing rows by Slug and
    // updates their name/parent/order in place, only adding new rows
    // for slugs that don't exist yet. Never creates duplicates.
    private static void SeedCategoryTree(ApplicationDbContext context)
    {
        // --- Top-level categories ---
        UpsertCategory(context, "salati", "Салати и разядки", "Salads & Appetizers", null, 1);
        UpsertCategory(context, "supi", "Супи и чорби", "Soups", null, 2);
        UpsertCategory(context, "osnovni-yastiya", "Основни ястия", "Main Dishes", null, 3);
        UpsertCategory(context, "testeni-izdeliya-i-pechiva", "Тестени изделия и печива", "Pastries & Baking", null, 4);
        UpsertCategory(context, "deserti", "Десерти и сладкиши", "Desserts", null, 5);
        UpsertCategory(context, "turshii-i-zimnina", "Зимнина и консерви", "Preserves", null, 6);
        UpsertCategory(context, "sosove-marinati-i-podpravki", "Сосове, маринати и подправки", "Sauces & Marinades", null, 7);
        UpsertCategory(context, "praznichna-trapeza", "Празнична трапеза", "Holiday Table", null, 8);
        UpsertCategory(context, "predyastiya", "Предястия", "Starters", null, 9);
        UpsertCategory(context, "napitki", "Напитки", "Drinks", null, 10);

        // Save so newly-inserted top-level categories get real Ids before
        // we look them up as parents for the subcategories below.
        context.SaveChanges();

        var salati = context.Categories.First(c => c.Slug == "salati");
        UpsertCategory(context, "studeni-salati", "Студени салати", "Cold Salads", salati.Id, 1);
        UpsertCategory(context, "topli-salati", "Топли салати", "Warm Salads", salati.Id, 2);
        UpsertCategory(context, "razyadki-i-dipove", "Разядки и дипове", "Appetizers & Dips", salati.Id, 3);

        var supi = context.Categories.First(c => c.Slug == "supi");
        UpsertCategory(context, "mesni-supi", "Месни супи", "Meat Soups", supi.Id, 1);
        UpsertCategory(context, "postni-i-zelenchukovi-supi", "Постни и зеленчукови супи", "Vegetable Soups", supi.Id, 2);
        UpsertCategory(context, "studeni-supi", "Студени супи", "Cold Soups", supi.Id, 3);

        var osnovni = context.Categories.First(c => c.Slug == "osnovni-yastiya");
        UpsertCategory(context, "yastiya-s-meso", "Ястия с месо", "Meat Dishes", osnovni.Id, 1);
        UpsertCategory(context, "riba-i-morski-darove", "Риба и морски дарове", "Fish & Seafood", osnovni.Id, 2);
        UpsertCategory(context, "vegetarianski-yastiya", "Вегетариански ястия", "Vegetarian Dishes", osnovni.Id, 3);
        UpsertCategory(context, "pasta-oriz-i-rizoto", "Паста, ориз и ризото", "Pasta, Rice & Risotto", osnovni.Id, 4);

        var testeni = context.Categories.First(c => c.Slug == "testeni-izdeliya-i-pechiva");
        UpsertCategory(context, "hlyab", "Хляб", "Bread", testeni.Id, 1);
        UpsertCategory(context, "banitsi", "Баници", "Banitsa", testeni.Id, 2);
        UpsertCategory(context, "soleni-pechiva", "Солени печива", "Savory Pastries", testeni.Id, 3);
        UpsertCategory(context, "pici", "Пици", "Pizza", testeni.Id, 4);
        UpsertCategory(context, "byrzi-testeni", "Бързи тестени", "Quick Doughs", testeni.Id, 5);

        var deserti = context.Categories.First(c => c.Slug == "deserti");
        UpsertCategory(context, "torti", "Торти", "Cakes", deserti.Id, 1);
        UpsertCategory(context, "rula", "Рула", "Rolls", deserti.Id, 2);
        UpsertCategory(context, "keksove-i-sladkishi-s-plodove", "Кексове и сладкиши с плодове", "Fruit Cakes & Loaves", deserti.Id, 3);
        UpsertCategory(context, "biskviti", "Бисквитки", "Cookies", deserti.Id, 4);
        UpsertCategory(context, "myufini", "Мъфини", "Muffins", deserti.Id, 5);
        UpsertCategory(context, "deserti-bez-pechene", "Десерти без печене", "No-Bake Desserts", deserti.Id, 6);
        UpsertCategory(context, "musove-i-kremove", "Мусове и кремове", "Mousses & Creams", deserti.Id, 7);
        UpsertCategory(context, "traditsionni-balgarski-deserti", "Традиционни български десерти", "Traditional Bulgarian Desserts", deserti.Id, 8);

        var zimnina = context.Categories.First(c => c.Slug == "turshii-i-zimnina");
        UpsertCategory(context, "lyutenitsi-i-sosove-za-burkan", "Лютеници и сосове за буркан", "Lyutenitsa & Jarred Sauces", zimnina.Id, 1);
        UpsertCategory(context, "turshii", "Туршии", "Pickles", zimnina.Id, 2);
        UpsertCategory(context, "kompoti-i-konfityuri", "Компоти и конфитюри", "Compotes & Jams", zimnina.Id, 3);

        var sosove = context.Categories.First(c => c.Slug == "sosove-marinati-i-podpravki");
        UpsertCategory(context, "domashni-sosove", "Домашни сосове", "Homemade Sauces", sosove.Id, 1);
        UpsertCategory(context, "marinati", "Маринати", "Marinades", sosove.Id, 2);
        UpsertCategory(context, "domashni-podpravki", "Домашни подправки", "Homemade Spice Mixes", sosove.Id, 3);

        var praznichna = context.Categories.First(c => c.Slug == "praznichna-trapeza");
        UpsertCategory(context, "koleda-i-badni-vecher", "Коледа и Бъдни вечер", "Christmas & Christmas Eve", praznichna.Id, 1);
        UpsertCategory(context, "velikden", "Великден", "Easter", praznichna.Id, 2);
        UpsertCategory(context, "imenni-i-rozhdeni-dni", "Именни и рождени дни", "Name Days & Birthdays", praznichna.Id, 3);

        context.SaveChanges();
    }

    // Seeds the tag system: cross-cutting attributes (time, occasion, diet,
    // difficulty/budget, method) that apply across categories.
    // Safe to run on every startup — matches by Slug, never duplicates.
    private static void SeedTags(ApplicationDbContext context)
    {
        // Time / speed
        UpsertTag(context, "byrzo", "Бързо (до 30 мин)", "time");
        UpsertTag(context, "super-byrzo", "Супер бързо (до 15 мин)", "time");
        UpsertTag(context, "za-vecherya", "За вечеря", "time");
        UpsertTag(context, "za-obyad", "За обяд", "time");
        UpsertTag(context, "byrza-zakuska", "Бърза закуска", "time");
        UpsertTag(context, "podgotovka-predvaritelno", "Подготовка предварително", "time");

        // Occasion
        UpsertTag(context, "praznichno", "Празнично", "occasion");
        UpsertTag(context, "semeyna-vecherya", "Семейна вечеря", "occasion");
        UpsertTag(context, "za-parti", "За парти", "occasion");
        UpsertTag(context, "sutreshno-kafe", "Сутрешно кафе", "occasion");
        UpsertTag(context, "za-navan", "За на вън", "occasion");
        UpsertTag(context, "koleda", "Коледа", "occasion");
        UpsertTag(context, "velikden-tag", "Великден", "occasion");
        UpsertTag(context, "letni-recepti", "Летни рецепти", "occasion");
        UpsertTag(context, "zimni-recepti", "Зимни рецепти", "occasion");
        UpsertTag(context, "za-detsa", "За деца", "occasion");

        // Diet / health
        UpsertTag(context, "vegetariansko", "Вегетарианско", "diet");
        UpsertTag(context, "vegan", "Веган", "diet");
        UpsertTag(context, "postno", "Постно", "diet");
        UpsertTag(context, "keto", "Кето", "diet");
        UpsertTag(context, "niskovaglehidratno", "Нисковъглехидратно", "diet");
        UpsertTag(context, "fitness", "Фитнес", "diet");
        UpsertTag(context, "visokoproteinovo", "Високопротеиново", "diet");
        UpsertTag(context, "bez-gluten", "Без глутен", "diet");
        UpsertTag(context, "bez-laktoza", "Без лактоза", "diet");
        UpsertTag(context, "bez-zahar", "Без захар", "diet");
        UpsertTag(context, "diabetno-priyatelsko", "Диабетно приятелско", "diet");

        // Difficulty / budget
        UpsertTag(context, "lesno", "Лесно", "difficulty");
        UpsertTag(context, "slozhno", "Сложно", "difficulty");
        UpsertTag(context, "byudzhetno", "Бюджетно", "difficulty");
        UpsertTag(context, "ikonomichno", "Икономично", "difficulty");
        UpsertTag(context, "luksozno", "Луксозно", "difficulty");

        // Method / equipment
        UpsertTag(context, "na-furna", "На фурна", "method");
        UpsertTag(context, "na-skara", "На скара", "method");
        UpsertTag(context, "na-tigan", "На тиган", "method");
        UpsertTag(context, "v-multikuker", "В мултикукър", "method");
        UpsertTag(context, "v-airfryer", "В аърфрайър", "method");
        UpsertTag(context, "bez-pechene", "Без печене", "method");
        UpsertTag(context, "bavno-gotvene", "Бавно готвене", "method");

        context.SaveChanges();
    }

    // Finds an existing category by slug and updates its name/parent/order,
    // or creates it if it doesn't exist yet. Never creates a duplicate slug.
    private static Category UpsertCategory(
        ApplicationDbContext context,
        string slug,
        string name,
        string nameEn,
        int? parentId,
        int sortOrder)
    {
        var existing = context.Categories.FirstOrDefault(c => c.Slug == slug);
        if (existing != null)
        {
            existing.Name = name;
            existing.NameEn = nameEn;
            existing.ParentCategoryId = parentId;
            existing.SortOrder = sortOrder;
            return existing;
        }

        var category = new Category
        {
            Slug = slug,
            Name = name,
            NameEn = nameEn,
            ParentCategoryId = parentId,
            SortOrder = sortOrder
        };
        context.Categories.Add(category);
        return category;
    }

    // Finds an existing tag by slug and updates its name/group, or creates
    // it if it doesn't exist yet. Never creates a duplicate slug.
    private static Tag UpsertTag(ApplicationDbContext context, string slug, string name, string group)
    {
        var existing = context.Tags.FirstOrDefault(t => t.Slug == slug);
        if (existing != null)
        {
            existing.Name = name;
            existing.Group = group;
            return existing;
        }

        var tag = new Tag
        {
            Slug = slug,
            Name = name,
            Group = group
        };
        context.Tags.Add(tag);
        return tag;
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
