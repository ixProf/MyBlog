using System.Text;
using Backend.Data;
using Backend.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;

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
 * 2. HMAC-SHA256 Signed Cookie Authentication (AskAuthService):
 *    - Used by the Admin Console for moderating visitor questions.
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
    "https://profblog.me",
    "https://www.profblog.me",
    "https://elprof-blog.vercel.app"
};

if (builder.Environment.IsDevelopment())
{
    allowedOrigins.Add("http://localhost:4200");
    allowedOrigins.Add("http://127.0.0.1:4200");
}

var frontendUrl = builder.Configuration["FRONTEND_URL"]
    ?? builder.Configuration["FrontendUrl"]
    ?? builder.Configuration["AllowedOrigins"]
    ?? Environment.GetEnvironmentVariable("FRONTEND_URL");

if (!string.IsNullOrWhiteSpace(frontendUrl))
{
    allowedOrigins.AddRange(
        frontendUrl.Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                   .Select(u => u.TrimEnd('/')));
}

var distinctOrigins = allowedOrigins.Distinct(StringComparer.OrdinalIgnoreCase).ToArray();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(distinctOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "CallMeProf API",
        Version = "v1",
        Description = "Personal Blog & Digital Workshop API"
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "JWT Authorization header using the Bearer scheme. \r\n\r\nEnter 'Bearer' [space] and then your token in the text input below.\r\n\r\nExample: \"Bearer eyJhbGciOi...\""
    });

    options.AddSecurityRequirement(_ => new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecuritySchemeReference("Bearer"),
            new List<string>()
        }
    });
});
builder.Services.AddOpenApi();

var app = builder.Build();

app.UseForwardedHeaders();

// ---------- Swagger & Swagger UI (Available in Development & Production) ----------
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "CallMeProf API v1");
    c.RoutePrefix = "swagger";
});

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

        await DbInitializer.SeedAsync(context, app.Configuration);
        logger.LogInformation("Database seeding completed successfully.");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Database migration or seeding encountered an error, continuing startup.");
    }
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseRouting();

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

public partial class Program { }