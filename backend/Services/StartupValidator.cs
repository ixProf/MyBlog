using Microsoft.Extensions.Configuration;

namespace Backend.Services;

public record ValidatedConfig(
    string ConnectionString,
    string JwtKey,
    string AdminPassword,
    string SessionSecret,
    string AdminEditorPassword
);

public static class StartupValidator
{
    public static ValidatedConfig Validate(IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            connectionString = configuration["SUPABASE_CONNECTION_STRING"] ?? Environment.GetEnvironmentVariable("SUPABASE_CONNECTION_STRING");
        }
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException("Startup validation failed: Missing required database connection string. Set 'ConnectionStrings:DefaultConnection' or 'SUPABASE_CONNECTION_STRING'.");
        }

        var jwtKey = configuration["Jwt:Key"] ?? configuration["Jwt__Key"] ?? Environment.GetEnvironmentVariable("Jwt__Key");
        if (string.IsNullOrWhiteSpace(jwtKey))
        {
            throw new InvalidOperationException("Startup validation failed: Missing required configuration 'Jwt:Key' (or 'Jwt__Key').");
        }
        if (jwtKey.Length < 32)
        {
            throw new InvalidOperationException("Startup validation failed: 'Jwt:Key' must be at least 32 characters long for secure HMAC-SHA256 signing.");
        }

        var adminPassword = configuration["ADMIN_PASSWORD"] ?? configuration["Admin:Password"] ?? Environment.GetEnvironmentVariable("ADMIN_PASSWORD");
        if (string.IsNullOrWhiteSpace(adminPassword))
        {
            throw new InvalidOperationException("Startup validation failed: Missing required environment variable 'ADMIN_PASSWORD' (or 'Admin:Password').");
        }

        var sessionSecret = configuration["SESSION_SECRET"] ?? configuration["Admin:SessionSecret"] ?? Environment.GetEnvironmentVariable("SESSION_SECRET");
        if (string.IsNullOrWhiteSpace(sessionSecret))
        {
            throw new InvalidOperationException("Startup validation failed: Missing required environment variable 'SESSION_SECRET' (or 'Admin:SessionSecret').");
        }

        var adminEditorPassword = configuration["ADMIN_EDITOR_PASSWORD"] ?? configuration["Admin:EditorPassword"] ?? Environment.GetEnvironmentVariable("ADMIN_EDITOR_PASSWORD");
        if (string.IsNullOrWhiteSpace(adminEditorPassword))
        {
            throw new InvalidOperationException("Startup validation failed: Missing required environment variable 'ADMIN_EDITOR_PASSWORD' (or 'Admin:EditorPassword').");
        }

        return new ValidatedConfig(connectionString, jwtKey, adminPassword, sessionSecret, adminEditorPassword);
    }
}
