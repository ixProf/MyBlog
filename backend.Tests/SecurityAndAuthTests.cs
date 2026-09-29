using System.Reflection;
using Backend.Controllers;
using Backend.Data;
using Backend.DTOs;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace Backend.Tests;

public class SecurityAndAuthTests
{
    [Fact]
    public void UploadImage_Has_AuthorizeAttribute()
    {
        var method = typeof(UploadController).GetMethod(nameof(UploadController.UploadImage));
        Assert.NotNull(method);
        var attr = method.GetCustomAttribute<AuthorizeAttribute>(true);
        Assert.NotNull(attr);
    }

    [Fact]
    public void BlogController_Create_Has_AuthorizeAttribute()
    {
        var method = typeof(BlogController).GetMethod(nameof(BlogController.Create));
        Assert.NotNull(method);
        var attr = method.GetCustomAttribute<AuthorizeAttribute>(true);
        Assert.NotNull(attr);
    }

    [Fact]
    public void NotesController_Create_Has_AuthorizeAttribute()
    {
        var method = typeof(NotesController).GetMethod(nameof(NotesController.Create));
        Assert.NotNull(method);
        var attr = method.GetCustomAttribute<AuthorizeAttribute>(true);
        Assert.NotNull(attr);
    }

    [Fact]
    public async Task AdminQuestionsController_WithoutValidCookie_ReturnsUnauthorized()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite("Data Source=:memory:")
            .Options;
        using var context = new AppDbContext(options);

        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            { "Admin:Password", "SecureTestPassword123!" },
            { "Admin:SessionSecret", "TestSecretKeyLongEnoughForHmac123" }
        }).Build();

        var authService = new AskAuthService(config);
        var controller = new AdminQuestionsController(context, authService);

        // ControllerContext with no cookies
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };

        var result = await controller.GetAll();
        var statusResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(StatusCodes.Status401Unauthorized, statusResult.StatusCode);
    }

    [Fact]
    public void StartupValidation_Throws_When_DatabaseConnection_Missing()
    {
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            { "Jwt:Key", "ValidJwtKeyAtLeast32CharsLong12345" },
            { "Admin:Password", "ValidAdminPassword123!" },
            { "Admin:EditorPassword", "ValidEditorPassword123!" },
            { "Admin:SessionSecret", "ValidSessionSecretKey1234567890" }
        }).Build();

        var ex = Assert.Throws<InvalidOperationException>(() => StartupValidator.Validate(config));
        Assert.Contains("database connection string", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void StartupValidation_Throws_When_JwtKey_TooShort()
    {
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            { "ConnectionStrings:DefaultConnection", "Host=localhost;Database=test" },
            { "Jwt:Key", "short" },
            { "Admin:Password", "ValidAdminPassword123!" },
            { "Admin:EditorPassword", "ValidEditorPassword123!" },
            { "Admin:SessionSecret", "ValidSessionSecretKey1234567890" }
        }).Build();

        var ex = Assert.Throws<InvalidOperationException>(() => StartupValidator.Validate(config));
        Assert.Contains("Jwt:Key", ex.Message, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("at least 32 characters", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void StartupValidation_Throws_When_AdminPassword_Missing()
    {
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            { "ConnectionStrings:DefaultConnection", "Host=localhost;Database=test" },
            { "Jwt:Key", "ValidJwtKeyAtLeast32CharsLong12345" },
            { "Admin:EditorPassword", "ValidEditorPassword123!" },
            { "Admin:SessionSecret", "ValidSessionSecretKey1234567890" }
        }).Build();

        var ex = Assert.Throws<InvalidOperationException>(() => StartupValidator.Validate(config));
        Assert.Contains("ADMIN_PASSWORD", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void StartupValidation_Throws_When_SessionSecret_Missing()
    {
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            { "ConnectionStrings:DefaultConnection", "Host=localhost;Database=test" },
            { "Jwt:Key", "ValidJwtKeyAtLeast32CharsLong12345" },
            { "Admin:Password", "ValidAdminPassword123!" },
            { "Admin:EditorPassword", "ValidEditorPassword123!" }
        }).Build();

        var ex = Assert.Throws<InvalidOperationException>(() => StartupValidator.Validate(config));
        Assert.Contains("SESSION_SECRET", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void StartupValidation_Throws_When_AdminEditorPassword_Missing()
    {
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            { "ConnectionStrings:DefaultConnection", "Host=localhost;Database=test" },
            { "Jwt:Key", "ValidJwtKeyAtLeast32CharsLong12345" },
            { "Admin:Password", "ValidAdminPassword123!" },
            { "Admin:SessionSecret", "ValidSessionSecretKey1234567890" }
        }).Build();

        var ex = Assert.Throws<InvalidOperationException>(() => StartupValidator.Validate(config));
        Assert.Contains("ADMIN_EDITOR_PASSWORD", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void StartupValidation_Succeeds_When_AllRequiredConfig_Provided()
    {
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            { "ConnectionStrings:DefaultConnection", "Host=localhost;Database=test" },
            { "Jwt:Key", "ValidJwtKeyAtLeast32CharsLong12345" },
            { "Admin:Password", "ValidAdminPassword123!" },
            { "Admin:EditorPassword", "ValidEditorPassword123!" },
            { "Admin:SessionSecret", "ValidSessionSecretKey1234567890" }
        }).Build();

        // Should not throw
        StartupValidator.Validate(config);
    }
}
