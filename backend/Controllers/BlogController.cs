using System.Text.RegularExpressions;
using Backend.Data;
using Backend.DTOs;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BlogController : ControllerBase
{
    private readonly AppDbContext _context;

    public BlogController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<BlogPost>>> GetAll([FromQuery] string? tag, [FromQuery] string? search)
    {
        var query = _context.BlogPosts.AsQueryable();

        if (!string.IsNullOrWhiteSpace(tag))
        {
            query = query.Where(b => b.Tags.ToLower().Contains(tag.ToLower()));
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(b => b.Title.ToLower().Contains(s) || b.Excerpt.ToLower().Contains(s) || b.Content.ToLower().Contains(s));
        }

        var posts = await query.OrderByDescending(b => b.PublishedAt).ToListAsync();
        return Ok(posts);
    }

    [HttpGet("{slug}")]
    public async Task<ActionResult<BlogPost>> GetBySlug(string slug)
    {
        var post = await _context.BlogPosts.FirstOrDefaultAsync(b => b.Slug == slug);
        if (post == null)
        {
            // Fallback: check if slug is integer Id
            if (int.TryParse(slug, out int id))
            {
                post = await _context.BlogPosts.FindAsync(id);
            }
        }

        if (post == null) return NotFound(new { message = "Blog post not found." });
        return Ok(post);
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<BlogPost>> Create([FromBody] CreateBlogPostRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.Content))
        {
            return BadRequest(new { message = "Title and content are required." });
        }

        var slug = GenerateSlug(request.Title);
        // Ensure unique slug
        if (await _context.BlogPosts.AnyAsync(b => b.Slug == slug))
        {
            slug = $"{slug}-{DateTime.UtcNow.Ticks % 10000}";
        }

        var post = new BlogPost
        {
            Title = request.Title.Trim(),
            Slug = slug,
            Excerpt = string.IsNullOrWhiteSpace(request.Excerpt) 
                ? (request.Content.Length > 160 ? request.Content.Substring(0, 160) + "..." : request.Content) 
                : request.Excerpt.Trim(),
            Content = request.Content,
            Tags = request.Tags ?? string.Empty,
            RelatedPostIds = request.RelatedPostIds ?? string.Empty,
            ReadTimeMinutes = request.ReadTimeMinutes <= 0 ? Math.Max(1, request.Content.Split(' ', StringSplitOptions.RemoveEmptyEntries).Length / 200) : request.ReadTimeMinutes,
            PublishedAt = DateTime.UtcNow
        };

        _context.BlogPosts.Add(post);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetBySlug), new { slug = post.Slug }, post);
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<ActionResult<BlogPost>> Update(int id, [FromBody] UpdateBlogPostRequest request)
    {
        var post = await _context.BlogPosts.FindAsync(id);
        if (post == null) return NotFound(new { message = "Blog post not found." });

        post.Title = request.Title.Trim();
        post.Excerpt = request.Excerpt.Trim();
        post.Content = request.Content;
        post.Tags = request.Tags ?? string.Empty;
        post.RelatedPostIds = request.RelatedPostIds ?? string.Empty;
        post.ReadTimeMinutes = request.ReadTimeMinutes;
        post.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(post);
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<ActionResult> Delete(int id)
    {
        var post = await _context.BlogPosts.FindAsync(id);
        if (post == null) return NotFound(new { message = "Blog post not found." });

        _context.BlogPosts.Remove(post);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    private static string GenerateSlug(string title)
    {
        var str = title.ToLowerInvariant();
        str = Regex.Replace(str, @"[^a-z0-9\s-]", "");
        str = Regex.Replace(str, @"\s+", " ").Trim();
        str = Regex.Replace(str, @"\s", "-");
        return string.IsNullOrEmpty(str) ? "post-" + Guid.NewGuid().ToString("N")[..8] : str;
    }
}
