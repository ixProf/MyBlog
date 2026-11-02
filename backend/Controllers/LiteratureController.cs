using System.Text.RegularExpressions;
using Backend.Data;
using Backend.DTOs;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LiteratureController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly AskRateLimitService _rateLimitService;

    public LiteratureController(AppDbContext context, AskRateLimitService rateLimitService)
    {
        _context = context;
        _rateLimitService = rateLimitService;
    }

    // GET /api/literature?type=poem&search=...&tag=...&limit=...
    [HttpGet]
    public async Task<ActionResult<IEnumerable<LiteraryPiece>>> GetAll(
        [FromQuery] string? type,
        [FromQuery] string? search,
        [FromQuery] string? tag,
        [FromQuery] int? limit)
    {
        var query = _context.LiteraryPieces.AsQueryable();

        if (!string.IsNullOrWhiteSpace(type))
        {
            var normType = NormalizeType(type);
            query = query.Where(p => p.Type == normType);
        }

        if (!string.IsNullOrWhiteSpace(tag))
        {
            var trimmedTag = tag.Trim().ToLowerInvariant();
            query = query.Where(p => p.Tags != null && p.Tags.ToLower().Contains(trimmedTag));
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLowerInvariant();
            query = query.Where(p =>
                p.Title.ToLower().Contains(s) ||
                p.Content.ToLower().Contains(s) ||
                (p.Excerpt != null && p.Excerpt.ToLower().Contains(s)));
        }

        query = query.OrderByDescending(p => p.PublishedAt)
                     .ThenByDescending(p => p.DisplayNumber);

        if (limit.HasValue && limit.Value > 0)
        {
            query = query.Take(limit.Value);
        }

        var pieces = await query.ToListAsync();

        return Ok(pieces);
    }

    // GET /api/literature/{type}/{displayNumber} (e.g. /api/literature/poetry/1 or /api/literature/prose/2)
    [HttpGet("{type}/{displayNumber:int}")]
    public async Task<ActionResult<LiteraryPiece>> GetByDisplayNumber(string type, int displayNumber)
    {
        var normType = NormalizeType(type);
        var piece = await _context.LiteraryPieces
            .FirstOrDefaultAsync(p => p.Type == normType && p.DisplayNumber == displayNumber);

        if (piece == null)
        {
            return NotFound(new { message = $"No {normType} found with display number {displayNumber}." });
        }

        return Ok(piece);
    }

    // GET /api/literature/{id:int} (helpful for admin editor by primary key ID)
    [HttpGet("{id:int}")]
    public async Task<ActionResult<LiteraryPiece>> GetById(int id)
    {
        var piece = await _context.LiteraryPieces.FindAsync(id);
        if (piece == null)
        {
            return NotFound(new { message = "Literary piece not found." });
        }

        return Ok(piece);
    }

    // POST /api/literature/{id}/heart
    [HttpPost("{id:int}/heart")]
    public async Task<ActionResult> Heart(int id, [FromBody] HeartLiteratureRequest? request)
    {
        string ip = GetClientIp();
        var rateCheck = _rateLimitService.CheckHeartRateLimit(ip);
        if (!rateCheck.Allowed)
        {
            return StatusCode(StatusCodes.Status429TooManyRequests, new
            {
                success = false,
                error = "Rate limit exceeded. Please wait a moment before reacting again.",
                resetInSeconds = rateCheck.ResetInSeconds
            });
        }

        var piece = await _context.LiteraryPieces.FindAsync(id);
        if (piece == null)
        {
            return NotFound(new { success = false, error = "Literary piece not found." });
        }

        string action = (request?.Action ?? "add").Trim().ToLowerInvariant();
        if (action == "remove")
        {
            piece.HeartsCount = Math.Max(0, piece.HeartsCount - 1);
        }
        else
        {
            piece.HeartsCount += 1;
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            id = piece.Id,
            display_number = piece.DisplayNumber,
            type = piece.Type,
            hearts_count = piece.HeartsCount
        });
    }

    // POST /api/literature
    [HttpPost]
    [Authorize]
    public async Task<ActionResult<LiteraryPiece>> Create([FromBody] CreateLiteraryPieceRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.Content))
        {
            return BadRequest(new { message = "Title and content are required." });
        }

        var normType = NormalizeType(request.Type);

        // Calculate independent sequential display_number per type
        var nextDisplayNumber = (await _context.LiteraryPieces
            .Where(p => p.Type == normType)
            .MaxAsync(p => (int?)p.DisplayNumber) ?? 0) + 1;

        var slug = GenerateSlug(request.Title);
        if (await _context.LiteraryPieces.AnyAsync(p => p.Slug == slug))
        {
            slug = $"{slug}-{DateTime.UtcNow.Ticks % 10000}";
        }

        var piece = new LiteraryPiece
        {
            Type = normType,
            Title = request.Title.Trim(),
            Slug = slug,
            Content = request.Content,
            Excerpt = string.IsNullOrWhiteSpace(request.Excerpt) ? null : request.Excerpt.Trim(),
            Tags = string.IsNullOrWhiteSpace(request.Tags) ? null : request.Tags.Trim(),
            PublishedAt = DateTime.UtcNow,
            DisplayNumber = nextDisplayNumber,
            HeartsCount = 0
        };

        _context.LiteraryPieces.Add(piece);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetByDisplayNumber), new { type = piece.Type, displayNumber = piece.DisplayNumber }, piece);
    }

    // PUT /api/literature/{id}
    [HttpPut("{id:int}")]
    [Authorize]
    public async Task<ActionResult<LiteraryPiece>> Update(int id, [FromBody] UpdateLiteraryPieceRequest request)
    {
        var piece = await _context.LiteraryPieces.FindAsync(id);
        if (piece == null)
        {
            return NotFound(new { message = "Literary piece not found." });
        }

        if (string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.Content))
        {
            return BadRequest(new { message = "Title and content are required." });
        }

        var targetType = NormalizeType(request.Type);

        // If type changed (rare), reassign display number for the new type
        if (piece.Type != targetType)
        {
            piece.Type = targetType;
            var nextDisplayNumber = (await _context.LiteraryPieces
                .Where(p => p.Type == targetType)
                .MaxAsync(p => (int?)p.DisplayNumber) ?? 0) + 1;
            piece.DisplayNumber = nextDisplayNumber;
        }

        piece.Title = request.Title.Trim();
        piece.Content = request.Content;
        piece.Excerpt = string.IsNullOrWhiteSpace(request.Excerpt) ? null : request.Excerpt.Trim();
        piece.Tags = string.IsNullOrWhiteSpace(request.Tags) ? null : request.Tags.Trim();
        piece.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(piece);
    }

    // DELETE /api/literature/{id}
    [HttpDelete("{id:int}")]
    [Authorize]
    public async Task<ActionResult> Delete(int id)
    {
        var piece = await _context.LiteraryPieces.FindAsync(id);
        if (piece == null)
        {
            return NotFound(new { message = "Literary piece not found." });
        }

        _context.LiteraryPieces.Remove(piece);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    private static string NormalizeType(string? type)
    {
        if (string.IsNullOrWhiteSpace(type)) return "poem";
        var t = type.Trim().ToLowerInvariant();
        if (t == "poetry" || t == "poem" || t == "شعر") return "poem";
        if (t == "prose" || t == "نثر") return "prose";
        return t;
    }

    private static string GenerateSlug(string title)
    {
        var str = title.Trim().ToLowerInvariant();
        // Allow Unicode letters (e.g. Arabic & Latin) and digits
        str = Regex.Replace(str, @"[^\p{L}\p{N}\s-]", "");
        str = Regex.Replace(str, @"\s+", " ").Trim();
        str = Regex.Replace(str, @"\s", "-");
        return string.IsNullOrEmpty(str) ? "piece-" + Guid.NewGuid().ToString("N")[..8] : str;
    }

    private string GetClientIp()
    {
        var forwarded = Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(forwarded))
        {
            return forwarded.Split(',')[0].Trim();
        }

        var realIp = Request.Headers["X-Real-IP"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(realIp))
        {
            return realIp.Trim();
        }

        return HttpContext.Connection.RemoteIpAddress?.ToString() ?? "local-client";
    }
}
