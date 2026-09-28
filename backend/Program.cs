using System.Text;
using Backend.Data;
using Backend.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// ---------- Port (Render provides PORT) ----------
var port = Environment.GetEnvironmentVariable("PORT") ?? "10000";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

// ---------- Database (Supabase Postgres) ----------
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? Environment.GetEnvironmentVariable("SUPABASE_CONNECTION_STRING")
    ?? throw new InvalidOperationException("No database connection string configured.");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// ---------- Dependency Injection ----------
builder.Services.AddHttpClient();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<ISupabaseStorageService, SupabaseStorageService>();
builder.Services.AddSingleton<AskAuthService>();
builder.Services.AddSingleton<AskRateLimitService>();

// ---------- JWT ----------
// In Production the key MUST come from configuration (Render env var: Jwt__Key).
var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey))
{
    if (builder.Environment.IsDevelopment())
        jwtKey = "dev-only-key-change-me-dev-only-key-change-me-123456";
    else
        throw new InvalidOperationException("Jwt:Key is not configured.");
}
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
// Set FRONTEND_URL in Render, e.g. https://your-app.vercel.app
// (multiple origins can be separated by commas)
var allowedOrigins = new List<string>
{
    "http://localhost:4200",
    "http://127.0.0.1:4200"
};

var frontendUrl = Environment.GetEnvironmentVariable("FRONTEND_URL");
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
        policy.WithOrigins(allowedOrigins.ToArray())
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddControllers();
builder.Services.AddOpenApi();

var app = builder.Build();

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
        // Logged as an error so it is visible in Render logs.
        logger.LogError(ex, "Database migration failed.");
    }

    await DbInitializer.SeedAsync(context);
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// ---------- Static files ----------
// NOTE: Render's filesystem is ephemeral. Files saved in wwwroot/uploads
// are lost on every deploy/restart. Use Supabase Storage for real uploads.
var uploadsDir = Path.Combine(app.Environment.ContentRootPath, "wwwroot", "uploads");
Directory.CreateDirectory(uploadsDir);

app.UseStaticFiles();
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(uploadsDir),
    RequestPath = "/uploads"
});

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();