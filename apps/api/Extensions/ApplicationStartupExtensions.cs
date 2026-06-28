using System.Data;
using System.Net;
using Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Api.Extensions;

internal static class ApplicationStartupExtensions
{
    public static void ConfigureKnownForwarders(
        this ForwardedHeadersOptions options,
        IConfiguration configuration)
    {
        var knownNetworks = GetConfiguredValues(configuration, "ForwardedHeaders:KnownNetworks");
        var knownProxies = GetConfiguredValues(configuration, "ForwardedHeaders:KnownProxies");

        if (knownNetworks.Length == 0 && knownProxies.Length == 0)
        {
            return;
        }

        options.KnownIPNetworks.Clear();
        options.KnownProxies.Clear();

        foreach (var value in knownNetworks)
        {
            if (TryParseCidrBlock(value, out var network))
            {
                options.KnownIPNetworks.Add(network);
            }
        }

        foreach (var value in knownProxies)
        {
            if (IPAddress.TryParse(value, out var proxy))
            {
                options.KnownProxies.Add(proxy);
            }
        }
    }

    public static async Task BootstrapDatabaseAsync(this WebApplication app)
    {
        var logger = app.Services.GetRequiredService<ILoggerFactory>().CreateLogger("DatabaseBootstrap");

        await using var scope = app.Services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<StudyHubDbContext>();

        try
        {
            if (await HasExistingDatabaseTablesAsync(dbContext))
            {
                logger.LogInformation(
                    "Database bootstrap skipped because the target database already contains tables.");
                return;
            }

            var pendingMigrations = (await dbContext.Database.GetPendingMigrationsAsync()).ToArray();
            if (pendingMigrations.Length == 0)
            {
                logger.LogInformation(
                    "Database bootstrap skipped because the target database is empty but no EF Core migrations are pending.");
                return;
            }

            logger.LogInformation(
                "Database appears empty. Applying {MigrationCount} EF Core migrations: {Migrations}",
                pendingMigrations.Length,
                string.Join(", ", pendingMigrations));

            await dbContext.Database.MigrateAsync();

            logger.LogInformation("Database bootstrap completed successfully.");
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Database bootstrap failed.");
            throw;
        }
    }

    private static async Task<bool> HasExistingDatabaseTablesAsync(StudyHubDbContext dbContext)
    {
        var connection = dbContext.Database.GetDbConnection();
        var shouldCloseConnection = connection.State != ConnectionState.Open;

        if (shouldCloseConnection)
        {
            await connection.OpenAsync();
        }

        try
        {
            await using var command = connection.CreateCommand();
            command.CommandText = """
                SELECT EXISTS (
                  SELECT 1
                  FROM information_schema.tables
                  WHERE table_type = 'BASE TABLE'
                    AND table_schema NOT IN ('pg_catalog', 'information_schema')
                );
                """;

            var result = await command.ExecuteScalarAsync();
            return result is bool exists && exists;
        }
        finally
        {
            if (shouldCloseConnection)
            {
                await connection.CloseAsync();
            }
        }
    }

    private static string[] GetConfiguredValues(IConfiguration configuration, string key)
    {
        var section = configuration.GetSection(key);
        var values = new List<string>();

        foreach (var child in section.GetChildren())
        {
            AddConfiguredValue(values, child.Value);
        }

        AddConfiguredValue(values, section.Value);

        return values.Distinct(StringComparer.OrdinalIgnoreCase).ToArray();
    }

    private static void AddConfiguredValue(List<string> values, string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return;
        }

        values.AddRange(value.Split(
            [',', ';', ' '],
            StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));
    }

    private static bool TryParseCidrBlock(string value, out System.Net.IPNetwork network)
    {
        return System.Net.IPNetwork.TryParse(value, out network);
    }
}
