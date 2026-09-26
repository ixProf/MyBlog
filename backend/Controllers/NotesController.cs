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
public class NotesController : ControllerBase
{
    private readonly AppDbContext _context;

    public NotesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult> GetAll([FromQuery] string? subject, [FromQuery] string? search)
    {
        var query = _context.AcademicNotes.AsQueryable();

        if (!string.IsNullOrWhiteSpace(subject))
        {
            query = query.Where(n => n.Subject.ToLower() == subject.ToLower());
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(n => n.Title.ToLower().Contains(s) || n.Content.ToLower().Contains(s) || n.Subject.ToLower().Contains(s));
        }

        var notes = await query.OrderBy(n => n.Subject).ThenBy(n => n.Order).ThenBy(n => n.Title).ToListAsync();
        
        // Retrieve all known subjects from both Subjects table and AcademicNotes table
        var registeredSubjects = await _context.Subjects.OrderBy(s => s.Name).Select(s => s.Name).ToListAsync();
        var noteSubjects = await _context.AcademicNotes.Select(n => n.Subject).Distinct().ToListAsync();
        var allSubjectNames = registeredSubjects.Union(noteSubjects, StringComparer.OrdinalIgnoreCase).OrderBy(s => s).ToList();

        // Group notes by subject, and ensure empty subjects are also included when no search/subject filter is active
        var notesBySubject = notes
            .GroupBy(n => n.Subject, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(g => g.Key, g => g.ToList(), StringComparer.OrdinalIgnoreCase);

        var subjectsToInclude = !string.IsNullOrWhiteSpace(subject) 
            ? allSubjectNames.Where(s => s.Equals(subject, StringComparison.OrdinalIgnoreCase))
            : !string.IsNullOrWhiteSpace(search)
                ? notesBySubject.Keys
                : allSubjectNames;

        var grouped = subjectsToInclude.Select(s =>
        {
            var items = notesBySubject.TryGetValue(s, out var list) ? list : new List<AcademicNote>();
            return new
            {
                Subject = s,
                Count = items.Count,
                Notes = items.OrderBy(n => n.Order).ThenBy(n => n.Title).Select(n => new
                {
                    n.Id,
                    n.Subject,
                    n.Title,
                    n.Slug,
                    n.Order,
                    n.UpdatedAt
                })
            };
        }).OrderBy(g => g.Subject);

        return Ok(new { allNotes = notes, groupedBySubject = grouped, subjects = allSubjectNames });
    }

    [HttpGet("subjects")]
    public async Task<ActionResult<List<string>>> GetSubjects()
    {
        var registered = await _context.Subjects.Select(s => s.Name).ToListAsync();
        var fromNotes = await _context.AcademicNotes.Select(n => n.Subject).Distinct().ToListAsync();
        var all = registered.Union(fromNotes, StringComparer.OrdinalIgnoreCase).OrderBy(s => s).ToList();
        return Ok(all);
    }

    [HttpPost("subjects")]
    [Authorize]
    public async Task<ActionResult> CreateSubject([FromBody] CreateSubjectRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest(new { message = "Subject name is required." });
        }

        var trimmed = request.Name.Trim();
        var exists = await _context.Subjects.AnyAsync(s => s.Name.ToLower() == trimmed.ToLower())
                     || await _context.AcademicNotes.AnyAsync(n => n.Subject.ToLower() == trimmed.ToLower());

        if (exists)
        {
            return Ok(new { name = trimmed, message = "Subject already exists." });
        }

        var subject = new Subject
        {
            Name = trimmed,
            CreatedAt = DateTime.UtcNow
        };

        _context.Subjects.Add(subject);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetSubjects), new { name = subject.Name }, subject);
    }

    [HttpDelete("subjects/{name}")]
    [Authorize]
    public async Task<ActionResult> DeleteSubject(string name)
    {
        var trimmed = name.Trim();
        var subj = await _context.Subjects.FirstOrDefaultAsync(s => s.Name.ToLower() == trimmed.ToLower());
        var notes = await _context.AcademicNotes.Where(n => n.Subject.ToLower() == trimmed.ToLower()).ToListAsync();

        if (notes.Count > 0)
        {
            _context.AcademicNotes.RemoveRange(notes);
        }

        if (subj != null)
        {
            _context.Subjects.Remove(subj);
        }

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("{slug}")]
    public async Task<ActionResult<AcademicNote>> GetBySlug(string slug)
    {
        var note = await _context.AcademicNotes.FirstOrDefaultAsync(n => n.Slug == slug);
        if (note == null && int.TryParse(slug, out int id))
        {
            note = await _context.AcademicNotes.FindAsync(id);
        }

        if (note == null) return NotFound(new { message = "Academic note not found." });
        return Ok(note);
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<AcademicNote>> Create([FromBody] CreateAcademicNoteRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.Content) || string.IsNullOrWhiteSpace(request.Subject))
        {
            return BadRequest(new { message = "Subject, title, and content are required." });
        }

        var subjectName = request.Subject.Trim();
        if (!await _context.Subjects.AnyAsync(s => s.Name.ToLower() == subjectName.ToLower()))
        {
            _context.Subjects.Add(new Subject { Name = subjectName, CreatedAt = DateTime.UtcNow });
        }

        var slug = GenerateSlug($"{subjectName}-{request.Title}");
        if (await _context.AcademicNotes.AnyAsync(n => n.Slug == slug))
        {
            slug = $"{slug}-{DateTime.UtcNow.Ticks % 10000}";
        }

        var note = new AcademicNote
        {
            Subject = subjectName,
            Title = request.Title.Trim(),
            Slug = slug,
            Content = request.Content,
            Order = request.Order <= 0 ? 1 : request.Order,
            UpdatedAt = DateTime.UtcNow
        };

        _context.AcademicNotes.Add(note);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetBySlug), new { slug = note.Slug }, note);
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<ActionResult<AcademicNote>> Update(int id, [FromBody] UpdateAcademicNoteRequest request)
    {
        var note = await _context.AcademicNotes.FindAsync(id);
        if (note == null) return NotFound(new { message = "Academic note not found." });

        var subjectName = request.Subject.Trim();
        if (!await _context.Subjects.AnyAsync(s => s.Name.ToLower() == subjectName.ToLower()))
        {
            _context.Subjects.Add(new Subject { Name = subjectName, CreatedAt = DateTime.UtcNow });
        }

        note.Subject = subjectName;
        note.Title = request.Title.Trim();
        note.Content = request.Content;
        note.Order = request.Order;
        note.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(note);
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<ActionResult> Delete(int id)
    {
        var note = await _context.AcademicNotes.FindAsync(id);
        if (note == null) return NotFound(new { message = "Academic note not found." });

        _context.AcademicNotes.Remove(note);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    private static string GenerateSlug(string text)
    {
        var str = text.ToLowerInvariant();
        str = Regex.Replace(str, @"[^a-z0-9\s-]", "");
        str = Regex.Replace(str, @"\s+", " ").Trim();
        str = Regex.Replace(str, @"\s", "-");
        return string.IsNullOrEmpty(str) ? "note-" + Guid.NewGuid().ToString("N")[..8] : str;
    }
}
