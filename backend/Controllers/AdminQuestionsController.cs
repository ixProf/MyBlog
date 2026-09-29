using Backend.Data;
using Backend.DTOs;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/admin/questions")]
public class AdminQuestionsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly AskAuthService _authService;

    public AdminQuestionsController(AppDbContext context, AskAuthService authService)
    {
        _context = context;
        _authService = authService;
    }

    private bool IsAdminAuthenticated()
    {
        var token = Request.Cookies[AskAuthService.CookieName];
        return _authService.VerifySessionToken(token);
    }

    [HttpGet]
    public async Task<ActionResult> GetAll()
    {
        if (!IsAdminAuthenticated())
        {
            return StatusCode(StatusCodes.Status401Unauthorized, new { success = false, error = "Unauthorized" });
        }

        try
        {
            var all = await _context.Questions
                .OrderByDescending(q => q.CreatedAt)
                .ToListAsync();

            // Populate parent question text
            var parentIds = all
                .Where(q => !string.IsNullOrEmpty(q.ParentId))
                .Select(q => q.ParentId!)
                .Distinct()
                .ToList();

            if (parentIds.Count > 0)
            {
                var parentTexts = await _context.Questions
                    .Where(q => parentIds.Contains(q.Id))
                    .ToDictionaryAsync(q => q.Id, q => q.QuestionText);

                foreach (var q in all)
                {
                    if (!string.IsNullOrEmpty(q.ParentId) && parentTexts.TryGetValue(q.ParentId, out var pText))
                    {
                        q.ParentQuestionText = pText;
                    }
                }
            }

            var pending = all
                .Where(q => q.Status == "pending")
                .OrderByDescending(q => q.CreatedAt)
                .ToList();

            var answered = all
                .Where(q => q.Status == "answered")
                .OrderByDescending(q => q.AnsweredAt ?? q.CreatedAt)
                .ToList();

            return Ok(new
            {
                success = true,
                pending,
                answered
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Admin Questions GET Error]: {ex}");
            return StatusCode(StatusCodes.Status500InternalServerError, new { success = false, error = "Internal server error" });
        }
    }

    [HttpPatch("{id}")]
    [HttpPut("{id}")]
    public async Task<ActionResult> AnswerAndPublish(string id, [FromBody] AdminAnswerQuestionRequest request)
    {
        if (!IsAdminAuthenticated())
        {
            return StatusCode(StatusCodes.Status401Unauthorized, new { success = false, error = "Unauthorized" });
        }

        var answer = request.GetAnswerText().Trim();
        if (string.IsNullOrWhiteSpace(answer))
        {
            return BadRequest(new { success = false, error = "Answer text is required to publish." });
        }

        var q = await _context.Questions.FirstOrDefaultAsync(x => x.Id == id);
        if (q == null)
        {
            return NotFound(new { success = false, error = "Question not found" });
        }

        q.AnswerText = answer;
        q.Status = "answered";
        q.AnsweredAt ??= DateTime.UtcNow;

        if (q.DisplayNumber == null || q.DisplayNumber <= 0)
        {
            var maxDisplay = await _context.Questions.MaxAsync(x => (int?)x.DisplayNumber) ?? 0;
            q.DisplayNumber = maxDisplay + 1;
        }

        await _context.SaveChangesAsync();

        if (!string.IsNullOrEmpty(q.ParentId))
        {
            var parent = await _context.Questions.FirstOrDefaultAsync(x => x.Id == q.ParentId);
            q.ParentQuestionText = parent?.QuestionText;
        }

        return Ok(new { success = true, question = q });
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(string id)
    {
        if (!IsAdminAuthenticated())
        {
            return StatusCode(StatusCodes.Status401Unauthorized, new { success = false, error = "Unauthorized" });
        }

        var q = await _context.Questions.FirstOrDefaultAsync(x => x.Id == id);
        if (q == null)
        {
            return NotFound(new { success = false, error = "Question not found" });
        }

        _context.Questions.Remove(q);
        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = "Question dismissed and purged." });
    }
}
