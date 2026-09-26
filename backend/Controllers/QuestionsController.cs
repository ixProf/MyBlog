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
public class QuestionsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly AskRateLimitService _rateLimitService;

    public QuestionsController(AppDbContext context, AskRateLimitService rateLimitService)
    {
        _context = context;
        _rateLimitService = rateLimitService;
    }

    // Public feed: answered questions with stats and profile (matches AskProf)
    [HttpGet]
    public async Task<ActionResult> GetAnswered([FromQuery] string? sort = "recent", [FromQuery] string? search = null)
    {
        try
        {
            var query = _context.Questions.Where(q => q.Status == "answered");

            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.Trim().ToLower();
                query = query.Where(q =>
                    q.QuestionText.ToLower().Contains(s) ||
                    (q.AnswerText != null && q.AnswerText.ToLower().Contains(s)) ||
                    q.AskerName.ToLower().Contains(s));
            }

            if (sort?.ToLower() == "liked")
            {
                query = query.OrderByDescending(q => q.LikesCount).ThenByDescending(q => q.CreatedAt);
            }
            else
            {
                query = query.OrderByDescending(q => q.AnsweredAt ?? q.CreatedAt);
            }

            var questions = await query.ToListAsync();

            // Attach parent question text for follow-ups
            var parentIds = questions
                .Where(q => !string.IsNullOrEmpty(q.ParentId))
                .Select(q => q.ParentId!)
                .Distinct()
                .ToList();

            if (parentIds.Count > 0)
            {
                var parentTexts = await _context.Questions
                    .Where(q => parentIds.Contains(q.Id))
                    .ToDictionaryAsync(q => q.Id, q => q.QuestionText);

                foreach (var q in questions)
                {
                    if (!string.IsNullOrEmpty(q.ParentId) && parentTexts.TryGetValue(q.ParentId, out var pText))
                    {
                        q.ParentQuestionText = pText;
                    }
                }
            }

            // Stats calculation
            var totalAnswered = await _context.Questions.CountAsync(q => q.Status == "answered");
            var totalLikes = await _context.Questions.Where(q => q.Status == "answered").SumAsync(q => (int?)q.LikesCount) ?? 0;
            var totalPending = await _context.Questions.CountAsync(q => q.Status == "pending");

            var stats = new
            {
                total_answered = totalAnswered,
                total_likes = totalLikes,
                total_pending = totalPending
            };

            // Profile info
            var profile = await _context.Profiles.FirstOrDefaultAsync() ?? new Profile();

            return Ok(new
            {
                success = true,
                questions,
                stats,
                profile
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Questions GET Error]: {ex}");
            return StatusCode(StatusCodes.Status500InternalServerError, new { success = false, error = "Internal server error" });
        }
    }

    // Public detail: get single answered question by display_number or ID
    [HttpGet("{id}")]
    public async Task<ActionResult> GetById(string id)
    {
        try
        {
            Question? question = null;

            if (int.TryParse(id.Trim(), out int displayNumber))
            {
                question = await _context.Questions.FirstOrDefaultAsync(q => q.DisplayNumber == displayNumber && q.Status == "answered");
            }

            if (question == null)
            {
                question = await _context.Questions.FirstOrDefaultAsync(q => q.Id == id.Trim() && q.Status == "answered");
            }

            if (question == null)
            {
                return NotFound(new { success = false, error = "Question not found" });
            }

            if (!string.IsNullOrEmpty(question.ParentId))
            {
                var parent = await _context.Questions.FirstOrDefaultAsync(q => q.Id == question.ParentId);
                question.ParentQuestionText = parent?.QuestionText;
            }

            return Ok(new
            {
                success = true,
                question
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Questions GET By ID Error]: {ex}");
            return StatusCode(StatusCodes.Status500InternalServerError, new { success = false, error = "Internal server error" });
        }
    }

    // Public submission: rate-limited by IP, min 8 / max 2000 chars
    [HttpPost]
    public async Task<ActionResult> Ask([FromBody] AskQuestionRequest request)
    {
        try
        {
            string ip = GetClientIp();

            // Rate limit: 6 submissions per 10 minutes
            var rateCheck = _rateLimitService.CheckPublicSubmissionRateLimit(ip, 6, 10);
            if (!rateCheck.Allowed)
            {
                return StatusCode(StatusCodes.Status429TooManyRequests, new
                {
                    success = false,
                    error = "Rate limit exceeded. Please wait before submitting another question.",
                    resetInSeconds = rateCheck.ResetInSeconds
                });
            }

            string questionText = request.GetQuestionText().Trim();
            if (string.IsNullOrWhiteSpace(questionText) || questionText.Length < 8)
            {
                return BadRequest(new { success = false, error = "Question text must be at least 8 characters long." });
            }

            if (questionText.Length > 2000)
            {
                return BadRequest(new { success = false, error = "Question text exceeds 2000 characters limit." });
            }

            string? askerInput = request.GetAskerName()?.Trim();
            bool isAnon = request.GetIsAnonymous() ?? string.IsNullOrWhiteSpace(askerInput);
            string askerName = isAnon || string.IsNullOrWhiteSpace(askerInput) ? "Anonymous" : askerInput;

            // Validate parent_id if provided
            string? parentId = request.GetParentId();
            if (!string.IsNullOrEmpty(parentId))
            {
                bool parentExists = await _context.Questions.AnyAsync(q => q.Id == parentId);
                if (!parentExists)
                {
                    parentId = null;
                }
            }

            string id = $"q-{Guid.NewGuid():N}"[..14];

            var q = new Question
            {
                Id = id,
                QuestionText = questionText,
                AnswerText = null,
                Status = "pending",
                IsAnonymous = isAnon,
                AskerName = askerName,
                LikesCount = 0,
                ParentId = parentId,
                CreatedAt = DateTime.UtcNow,
                AnsweredAt = null,
                DisplayNumber = null
            };

            _context.Questions.Add(q);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Question submitted successfully.",
                data = new
                {
                    id = q.Id,
                    created_at = q.CreatedAt,
                    status = q.Status
                }
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Questions POST Error]: {ex}");
            return StatusCode(StatusCodes.Status500InternalServerError, new { success = false, error = "Failed to submit question" });
        }
    }

    // Public like: atomically increments likes_count and returns updated count
    [HttpPost("{id}/like")]
    public async Task<ActionResult> Like(string id)
    {
        try
        {
            var q = await _context.Questions.FirstOrDefaultAsync(x => x.Id == id && x.Status == "answered");
            if (q == null)
            {
                return NotFound(new { success = false, error = "Question not found or not eligible for likes" });
            }

            q.LikesCount += 1;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                likes_count = q.LikesCount
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Questions LIKE Error]: {ex}");
            return StatusCode(StatusCodes.Status500InternalServerError, new { success = false, error = "Failed to like question" });
        }
    }

    // Public stats & profile endpoint
    [HttpGet("stats")]
    public async Task<ActionResult> GetStats()
    {
        try
        {
            var totalAnswered = await _context.Questions.CountAsync(q => q.Status == "answered");
            var totalLikes = await _context.Questions.Where(q => q.Status == "answered").SumAsync(q => (int?)q.LikesCount) ?? 0;
            var totalPending = await _context.Questions.CountAsync(q => q.Status == "pending");

            var stats = new
            {
                total_answered = totalAnswered,
                total_likes = totalLikes,
                total_pending = totalPending
            };

            var profile = await _context.Profiles.FirstOrDefaultAsync() ?? new Profile();

            return Ok(new
            {
                success = true,
                stats,
                profile
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Questions STATS Error]: {ex}");
            return StatusCode(StatusCodes.Status500InternalServerError, new { success = false, error = "Internal server error" });
        }
    }

    // Compatibility inbox for existing JWT-authenticated admin if used
    [HttpGet("inbox")]
    [Authorize]
    public async Task<ActionResult> GetInbox([FromQuery] bool? pendingOnly)
    {
        var query = _context.Questions.AsQueryable();

        if (pendingOnly == true)
        {
            query = query.Where(q => q.Status != "answered");
        }

        var list = await query.OrderByDescending(q => q.CreatedAt).ToListAsync();
        return Ok(list);
    }

    // Compatibility answer for existing JWT-authenticated admin if used
    [HttpPut("{id}/answer")]
    [Authorize]
    public async Task<ActionResult<Question>> Answer(string id, [FromBody] AnswerQuestionRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.AnswerText))
        {
            return BadRequest(new { message = "Answer text cannot be empty." });
        }

        var q = await _context.Questions.FindAsync(id);
        if (q == null) return NotFound(new { message = "Question not found." });

        q.AnswerText = request.AnswerText.Trim();
        q.Status = "answered";
        q.AnsweredAt = DateTime.UtcNow;

        if (q.DisplayNumber == null || q.DisplayNumber <= 0)
        {
            q.DisplayNumber = (await _context.Questions.MaxAsync(x => (int?)x.DisplayNumber) ?? 0) + 1;
        }

        await _context.SaveChangesAsync();
        return Ok(q);
    }

    // Compatibility delete for existing JWT-authenticated admin if used
    [HttpDelete("{id}")]
    [Authorize]
    public async Task<ActionResult> Delete(string id)
    {
        var q = await _context.Questions.FindAsync(id);
        if (q == null) return NotFound(new { message = "Question not found." });

        _context.Questions.Remove(q);
        await _context.SaveChangesAsync();
        return NoContent();
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