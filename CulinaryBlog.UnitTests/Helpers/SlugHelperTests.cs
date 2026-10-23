using CulinaryBlog.Helpers;

namespace CulinaryBlog.UnitTests.Helpers;

public class SlugHelperTests
{
    [Theory]
    [InlineData("Шопска салата", "shopska-salata")]
    [InlineData("Banana Bread", "banana-bread")]
    [InlineData("   ", "item")]
    public void GenerateSlug_MatchesSlugify(string input, string expected)
    {
        Assert.Equal(expected, SlugHelper.Slugify(input));
        Assert.Equal(expected, SlugHelper.GenerateSlug(input));
    }

    [Fact]
    public void Unique_AppendsSuffixUntilSlugIsFree()
    {
        var taken = new HashSet<string> { "shopska-salata", "shopska-salata-2" };

        var unique = SlugHelper.Unique("shopska-salata", taken.Contains);

        Assert.Equal("shopska-salata-3", unique);
    }
}
