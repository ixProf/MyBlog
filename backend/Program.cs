using System.Text;
using Backend.Data;
using Backend.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// ---------- Reverse Proxy & Forwarded Headers ----------
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownIPNetworks.Clear();
    options.KnownProxies.Clear();
});

// ---------- Port (Render / SnapDeploy provides PORT) ----------
var port = Environment.GetEnvironmentVariable("PORT") ?? "10000";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

// ---------- Startup Configuration Validation ----------
var validatedConfig = StartupValidator.Validate(builder.Configuration);
var connectionString = validatedConfig.ConnectionString;
var jwtKey = validatedConfig.JwtKey;

// ---------- Database (PostgreSQL) ----------
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// ---------- Dependency Injection ----------
builder.Services.AddHttpClient();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<ISupabaseStorageService, SupabaseStorageService>();
builder.Services.AddSingleton<AskAuthService>();
builder.Services.AddSingleton<AskRateLimitService>();

/*
 * ==============================================================================================
 * AUTHENTICATION SCHEMES NOTE:
 * The application operates two distinct authentication schemes:
 * 1. JWT Bearer Authentication (TokenService):
 *    - Used by the Obsidian Admin Editor (/editor) for creating/editing blog posts and academic notes.
 *    - Validates Bearer token from the 'Authorization' header using 'Jwt:Key'.
 * 2. HMAC-SHA256 Signed Cookie Authentication (AskAuthService):
 *    - Used by the Ask Moderation Dashboard (/ask/login) for moderating visitor questions.
 *    - Issues an HttpOnly, Secure, SameSite=None cookie ('prof_vault_token') validated with 'SESSION_SECRET'.
 * ==============================================================================================
 */

var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "CallMeProf";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "CallMeProfApp";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// ---------- CORS ----------
var allowedOrigins = new List<string>
{
    "http://localhost:4200",
    "http://127.0.0.1:4200"
};

var frontendUrl = builder.Configuration["FRONTEND_URL"] ?? Environment.GetEnvironmentVariable("FRONTEND_URL");
if (!string.IsNullOrWhiteSpace(frontendUrl))
{
    allowedOrigins.AddRange(
        frontendUrl.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                   .Select(u => u.TrimEnd('/')));
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(allowedOrigins.Distinct().ToArray())
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddControllers();
builder.Services.AddOpenApi();

var app = builder.Build();

app.UseForwardedHeaders();

// ---------- Public Health Endpoint (Zero DB overhead) ----------
app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }));

// ---------- Migrations & Seed ----------
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

    try
    {
        await context.Database.MigrateAsync();
        logger.LogInformation("Database migrations applied successfully.");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Database migration failed.");
    }

    await DbInitializer.SeedAsync(context);
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

public partial class Program { }