using System.Text;
using Backend.Data;
using Backend.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

if (args.Contains("--probe-supabase"))
{
    var regions = new[] {
        "eu-central-1", "eu-west-1", "eu-west-2", "eu-west-3", "me-central-1",
        "us-east-1", "us-east-2", "us-west-1", "us-west-2",
        "af-south-1", "ap-southeast-1", "ap-southeast-2", "ap-northeast-1", "ap-northeast-2", "ap-south-1", "ca-central-1", "sa-east-1"
    };

    foreach (var r in regions)
    {
        var host = $"aws-0-{r}.pooler.supabase.com";
        var testConn = $"Host={host};Port=6543;Database=postgres;Username=postgres.idftairgyjnwhwwpcecc;Password=PROF_PASSWORD_442005;SSL Mode=Require;Trust Server Certificate=true;Timeout=4";
        try
        {
            await using var conn = new Npgsql.NpgsqlConnection(testConn);
            await conn.OpenAsync();
            Console.WriteLine($"[FOUND REGION]: {r} -> {host}");
            return;
        }
        catch (Exception ex)
        {
            if (!ex.Message.Contains("Tenant or user not found"))
            {
                Console.WriteLine($"[DEBUG {r}]: {ex.Message}");
            }
        }
    }
    Console.WriteLine("[NOT FOUND IN TESTED REGIONS]");
    return;
}

if (args.Contains("--check-tables"))
{
    var connStr = "Host=ep-twilight-cherry-aesrsmsd-pooler.c-2.us-east-2.aws.neon.tech;Port=5432;Database=neondb;Username=neondb_owner;Password=npg_TQFjd7BP0gAG;SSL Mode=Require;Trust Server Certificate=true;ChannelBinding=Require";
    await using var conn = new Npgsql.NpgsqlConnection(connStr);
    await conn.OpenAsync();
    await using var cmd = new Npgsql.NpgsqlCommand("SELECT table_name FROM information_schema.tables WHERE table_schema='public';", conn);
    await using var reader = await cmd.ExecuteReaderAsync();
    while (await reader.ReadAsync())
    {
        Console.WriteLine($"[EXISTING TABLE]: {reader.GetString(0)}");
    }
    return;
}

var builder = WebApplication.CreateBuilder(args);

// Add Database Context (Supabase Postgres)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? Environment.GetEnvironmentVariable("SUPABASE_CONNECTION_STRING")
    ?? throw new InvalidOperationException("No database connection string configured.");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// Add Dependency Injection
builder.Services.AddHttpClient();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<ISupabaseStorageService, SupabaseStorageService>();
builder.Services.AddSingleton<AskAuthService>();
builder.Services.AddSingleton<AskRateLimitService>();

// Add JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"] ?? "CallMeProfSuperSecretSecurityKey2026!LongEnoughForHmacSha256";
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

// Configure CORS for Angular Frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:4200", "http://127.0.0.1:4200", "http://localhost:5000", "https://localhost:5001")
              .SetIsOriginAllowed(_ => true)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddControllers();
builder.Services.AddOpenApi();

var app = builder.Build();

// Apply pending migrations safely
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try
    {
        await context.Database.MigrateAsync();
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[DB Note]: Database already populated or migration skipped: {ex.Message}");
    }
    await DbInitializer.SeedAsync(context);
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

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