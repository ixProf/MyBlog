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
using Xunit;

namespace Backend.Tests;

public class LiteratureTests
{
    private static async Task<(AppDbContext context, Microsoft.Data.Sqlite.SqliteConnection connection)> CreateSqliteContextAsync()
    {
        var connection = new Microsoft.Data.Sqlite.SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(connection)
            .Options;
        var context = new AppDbContext(options);
        await context.Database.EnsureCreatedAsync();
        return (context, connection);
    }


    [Fact]
    public void LiteratureController_MutatingEndpoints_HaveAuthorizeAttribute()
    {
        var createMethod = typeof(LiteratureController).GetMethod(nameof(LiteratureController.Create));
        Assert.NotNull(createMethod);
        Assert.NotNull(createMethod.GetCustomAttribute<AuthorizeAttribute>(true));

        var updateMethod = typeof(LiteratureController).GetMethod(nameof(LiteratureController.Update));
        Assert.NotNull(updateMethod);
        Assert.NotNull(updateMethod.GetCustomAttribute<AuthorizeAttribute>(true));

        var deleteMethod = typeof(LiteratureController).GetMethod(nameof(LiteratureController.Delete));
        Assert.NotNull(deleteMethod);
        Assert.NotNull(deleteMethod.GetCustomAttribute<AuthorizeAttribute>(true));
    }

    [Fact]
    public async Task Create_AssignsDisplayNumber_IndependentlyPerType()
    {
        var (context, connection) = await CreateSqliteContextAsync();
        using var _conn = connection;
        using var _ctx = context;
        var rateService = new AskRateLimitService();
        var controller = new LiteratureController(context, rateService);

        // 1. Create first poem -> DisplayNumber should be 1
        var poem1Result = await controller.Create(new CreateLiteraryPieceRequest("poem", "Poem 1", "صدر | عجز"));
        var createdPoem1 = Assert.IsType<CreatedAtActionResult>(poem1Result.Result);
        var piecePoem1 = Assert.IsType<LiteraryPiece>(createdPoem1.Value);
        Assert.Equal(1, piecePoem1.DisplayNumber);
        Assert.Equal("poem", piecePoem1.Type);

        // 2. Create first prose -> DisplayNumber should independently be 1
        var prose1Result = await controller.Create(new CreateLiteraryPieceRequest("prose", "Prose 1", "نص نثري جميل"));
        var createdProse1 = Assert.IsType<CreatedAtActionResult>(prose1Result.Result);
        var pieceProse1 = Assert.IsType<LiteraryPiece>(createdProse1.Value);
        Assert.Equal(1, pieceProse1.DisplayNumber);
        Assert.Equal("prose", pieceProse1.Type);

        // 3. Create second poem -> DisplayNumber should be 2
        var poem2Result = await controller.Create(new CreateLiteraryPieceRequest("poem", "Poem 2", "صدر ثان | عجز ثان"));
        var createdPoem2 = Assert.IsType<CreatedAtActionResult>(poem2Result.Result);
        var piecePoem2 = Assert.IsType<LiteraryPiece>(createdPoem2.Value);
        Assert.Equal(2, piecePoem2.DisplayNumber);

        // 4. Create second prose -> DisplayNumber should be 2
        var prose2Result = await controller.Create(new CreateLiteraryPieceRequest("prose", "Prose 2", "نص نثري ثان"));
        var createdProse2 = Assert.IsType<CreatedAtActionResult>(prose2Result.Result);
        var pieceProse2 = Assert.IsType<LiteraryPiece>(createdProse2.Value);
        Assert.Equal(2, pieceProse2.DisplayNumber);
    }

    [Fact]
    public async Task Heart_AddAndRemove_UpdatesCountAtomically()
    {
        var (context, connection) = await CreateSqliteContextAsync();
        using var _conn = connection;
        using var _ctx = context;
        var rateService = new AskRateLimitService();
        var controller = new LiteratureController(context, rateService)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            }
        };

        // Seed a piece
        var piece = new LiteraryPiece
        {
            Type = "poem",
            Title = "Test Poem",
            Slug = "test-poem",
            Content = "شطر أول | شطر ثان",
            DisplayNumber = 1,
            HeartsCount = 5
        };
        context.LiteraryPieces.Add(piece);
        await context.SaveChangesAsync();

        // 1. Add heart
        var addResult = await controller.Heart(piece.Id, new HeartLiteratureRequest { Action = "add" });
        var okAdd = Assert.IsType<OkObjectResult>(addResult);
        var addJson = System.Text.Json.JsonSerializer.Serialize(okAdd.Value);
        using var docAdd = System.Text.Json.JsonDocument.Parse(addJson);
        Assert.Equal(6, docAdd.RootElement.GetProperty("hearts_count").GetInt32());

        // 2. Remove heart
        var removeResult = await controller.Heart(piece.Id, new HeartLiteratureRequest { Action = "remove" });
        var okRemove = Assert.IsType<OkObjectResult>(removeResult);
        var removeJson = System.Text.Json.JsonSerializer.Serialize(okRemove.Value);
        using var docRemove = System.Text.Json.JsonDocument.Parse(removeJson);
        Assert.Equal(5, docRemove.RootElement.GetProperty("hearts_count").GetInt32());

        // 3. Remove down to zero doesn't go negative
        piece.HeartsCount = 0;
        await context.SaveChangesAsync();

        var zeroRemoveResult = await controller.Heart(piece.Id, new HeartLiteratureRequest { Action = "remove" });
        var okZero = Assert.IsType<OkObjectResult>(zeroRemoveResult);
        var zeroJson = System.Text.Json.JsonSerializer.Serialize(okZero.Value);
        using var docZero = System.Text.Json.JsonDocument.Parse(zeroJson);
        Assert.Equal(0, docZero.RootElement.GetProperty("hearts_count").GetInt32());
    }

    [Fact]
    public async Task Heart_NonexistentPiece_ReturnsNotFound()
    {
        var (context, connection) = await CreateSqliteContextAsync();
        using var _conn = connection;
        using var _ctx = context;
        var rateService = new AskRateLimitService();
        var controller = new LiteratureController(context, rateService)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            }
        };

        var result = await controller.Heart(9999, new HeartLiteratureRequest { Action = "add" });
        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task Heart_RateLimitExceeded_Returns429()
    {
        var (context, connection) = await CreateSqliteContextAsync();
        using var _conn = connection;
        using var _ctx = context;
        var rateService = new AskRateLimitService();
        var httpContext = new DefaultHttpContext();
        httpContext.Connection.RemoteIpAddress = System.Net.IPAddress.Parse("198.51.100.42");

        var controller = new LiteratureController(context, rateService)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = httpContext
            }
        };

        var piece = new LiteraryPiece
        {
            Type = "prose",
            Title = "Rate Limited Piece",
            Slug = "rate-limited-piece",
            Content = "محتوى",
            DisplayNumber = 1,
            HeartsCount = 0
        };
        context.LiteraryPieces.Add(piece);
        await context.SaveChangesAsync();

        // CheckHeartRateLimit has limit = 30 per 1 minute
        ActionResult? lastResult = null;
        for (int i = 0; i < 35; i++)
        {
            lastResult = await controller.Heart(piece.Id, new HeartLiteratureRequest { Action = "add" });
        }

        var statusResult = Assert.IsType<ObjectResult>(lastResult);
        Assert.Equal(StatusCodes.Status429TooManyRequests, statusResult.StatusCode);
    }

    [Fact]
    public async Task GetAll_SupportsLimitParameter()
    {
        var (context, connection) = await CreateSqliteContextAsync();
        using var _conn = connection;
        using var _ctx = context;
        var rateService = new AskRateLimitService();
        var controller = new LiteratureController(context, rateService);

        // Seed 5 pieces
        for (int i = 1; i <= 5; i++)
        {
            context.LiteraryPieces.Add(new LiteraryPiece
            {
                Type = "poem",
                Title = $"Poem {i}",
                Slug = $"poem-{i}",
                Content = $"صدر {i} | عجز {i}",
                DisplayNumber = i,
                PublishedAt = DateTime.UtcNow.AddMinutes(i)
            });
        }
        await context.SaveChangesAsync();

        // 1. Request with limit = 2
        var limitedResult = await controller.GetAll(type: null, search: null, tag: null, limit: 2);
        var okLimited = Assert.IsType<OkObjectResult>(limitedResult.Result);
        var piecesLimited = Assert.IsAssignableFrom<IEnumerable<LiteraryPiece>>(okLimited.Value).ToList();
        Assert.Equal(2, piecesLimited.Count);

        // 2. Request without limit -> all 5
        var allResult = await controller.GetAll(type: null, search: null, tag: null, limit: null);
        var okAll = Assert.IsType<OkObjectResult>(allResult.Result);
        var piecesAll = Assert.IsAssignableFrom<IEnumerable<LiteraryPiece>>(okAll.Value).ToList();
        Assert.Equal(5, piecesAll.Count);
    }
}

