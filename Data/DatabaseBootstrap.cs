using System.Data;
using System.Data.Common;
using Microsoft.EntityFrameworkCore;

namespace CulinaryBlog.Data;

public static class DatabaseBootstrap
{
    public static void ApplyMigrations(ApplicationDbContext context)
    {
        var connection = context.Database.GetDbConnection();
        var openedHere = connection.State != ConnectionState.Open;
        if (openedHere)
            connection.Open();

        var needsBaseline = false;
        try
        {
            needsBaseline = !TableExists(connection, "__EFMigrationsHistory") && TableExists(connection, "Users");
        }
        finally
        {
            if (openedHere)
                connection.Close();
        }

        if (needsBaseline)
            BaselineExistingDatabase(context);

        context.Database.Migrate();
    }

    private static void BaselineExistingDatabase(ApplicationDbContext context)
    {
        context.Database.ExecuteSqlRaw("""
            CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
                "MigrationId" character varying(150) NOT NULL,
                "ProductVersion" character varying(32) NOT NULL,
                CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
            );
            """);

        foreach (var migrationId in context.Database.GetMigrations())
        {
            context.Database.ExecuteSqlRaw(
                """
                INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
                VALUES ({0}, {1})
                ON CONFLICT ("MigrationId") DO NOTHING;
                """,
                migrationId,
                "8.0.0");
        }
    }

    private static bool TableExists(DbConnection connection, string tableName)
    {
        using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT EXISTS (
                SELECT 1
                FROM information_schema.tables
                WHERE table_schema = 'public' AND table_name = @name
            );
            """;
        var parameter = command.CreateParameter();
        parameter.ParameterName = "name";
        parameter.Value = tableName;
        command.Parameters.Add(parameter);
        return command.ExecuteScalar() is true;
    }
}
