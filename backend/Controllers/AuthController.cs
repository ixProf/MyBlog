using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Backend.Data;
using Backend.DTOs;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly ITokenService _tokenService;
    private readonly IConfiguration _config;
    private readonly AppDbContext _context;
    private readonly AskRateLimitService _rateLimitService;

    public AuthController(
        ITokenService tokenService,
        IConfiguration config,
        AppDbContext context,
        AskRateLimitService rateLimitService)
    {
        _tokenService = tokenService;
        _config = config;
        _context = context;
        _rateLimitService = rateLimitService;
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
    {
        string ip = GetClientIp();

        // 1. Check if IP is locked out
        var rateCheck = await _rateLimitService.CheckAdminLoginRateLimitAsync(ip, _context);
        if (!rateCheck.Allowed)
        {
            return StatusCode(StatusCodes.Status429TooManyRequests, new
            {
                message = "Too many failed login attempts. Access temporarily locked for security.",
                resetInSeconds = rateCheck.ResetInSeconds
            });
        }

        if (string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "Password is required." });
        }

        var configuredPassword = Environment.GetEnvironmentVariable("ADMIN_EDITOR_PASSWORD")
            ?? _config["ADMIN_EDITOR_PASSWORD"]
            ?? _config["Admin:EditorPassword"]
            ?? _config["Admin__EditorPassword"];

        if (string.IsNullOrWhiteSpace(configuredPassword))
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "ADMIN_EDITOR_PASSWORD is not configured on the server." });
        }

        byte[] inputBytes = Encoding.UTF8.GetBytes(request.Password.Trim());
        byte[] expectedBytes = Encoding.UTF8.GetBytes(configuredPassword.Trim());

        if (inputBytes.Length != expectedBytes.Length || !CryptographicOperations.FixedTimeEquals(inputBytes, expectedBytes))
        {
            var failState = await _rateLimitService.RecordAdminLoginFailureAsync(ip, _context);
            if (!failState.Allowed)
            {
                return StatusCode(StatusCodes.Status429TooManyRequests, new
                {
                    message = "Too many failed login attempts. Access temporarily locked for security.",
                    resetInSeconds = failState.ResetInSeconds
                });
            }

            return Unauthorized(new
            {
                message = "Invalid credentials. Only Prof can access the editor.",
                remainingAttempts = failState.Remaining
            });
        }

        // 2. Successful login: reset failed attempts
        await _rateLimitService.RecordAdminLoginSuccessAsync(ip, _context);

        // 3. Issue JWT bearer token for fixed Admin identity
        var token = _tokenService.GenerateToken("Prof", "Admin", "Prof (Mahmoud Sayed Mohamed)");
        return Ok(new AuthResponse(token, "Prof", "Prof (Mahmoud Sayed Mohamed)"));
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

    [HttpGet("me")]
    [Authorize]
    public ActionResult GetCurrentUser()
    {
        var username = User.Identity?.Name ?? "Prof";
        var displayName = User.FindFirst("displayName")?.Value ?? username;
        var role = User.FindFirst(ClaimTypes.Role)?.Value ?? "Admin";

        return Ok(new { Username = username, DisplayName = displayName, Role = role });
    }
}
