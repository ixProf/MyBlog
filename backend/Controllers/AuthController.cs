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
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ITokenService _tokenService;
    private readonly IConfiguration _config;

    public AuthController(AppDbContext context, ITokenService tokenService, IConfiguration config)
    {
        _context = context;
        _tokenService = tokenService;
        _config = config;
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "Username and password are required." });
        }

        var normalizedUsername = request.Username.Trim().ToLower();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Username.ToLower() == normalizedUsername);

        var configuredPassword = Environment.GetEnvironmentVariable("ADMIN_EDITOR_PASSWORD")
            ?? _config["ADMIN_EDITOR_PASSWORD"]
            ?? Environment.GetEnvironmentVariable("ADMIN_PASSWORD")
            ?? _config["ADMIN_PASSWORD"]
            ?? _config["Admin:Password"]
            ?? _config["Admin__Password"];

        bool isValid = false;

        // 1. Verify against database password hash if user exists
        if (user != null && !string.IsNullOrWhiteSpace(user.PasswordHash) && BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            isValid = true;
        }
        // 2. Or verify against configured ADMIN_EDITOR_PASSWORD / ADMIN_PASSWORD
        else if (!string.IsNullOrWhiteSpace(configuredPassword) && request.Password.Trim() == configuredPassword.Trim())
        {
            isValid = true;
            if (user != null)
            {
                // Synchronize database password hash with configured secret
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(configuredPassword.Trim());
                await _context.SaveChangesAsync();
            }
        }
        // 3. Or fallback to initial seeded password
        else if (request.Password.Trim() == "Prof@2026!")
        {
            isValid = true;
        }

        if (!isValid)
        {
            return Unauthorized(new { message = "Invalid credentials. Only Prof can access the admin area." });
        }

        // If user was not present in DB (e.g. fresh DB before seeding completed), provision admin user
        if (user == null && normalizedUsername == "prof")
        {
            user = new User
            {
                Username = "prof",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password.Trim()),
                Role = "Admin",
                DisplayName = "Prof (Mahmoud Sayed Mohamed)"
            };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
        }
        else if (user == null)
        {
            return Unauthorized(new { message = "Invalid credentials. Only Prof can access the admin area." });
        }

        var token = _tokenService.GenerateToken(user);
        return Ok(new AuthResponse(token, user.Username, user.DisplayName));
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult> GetCurrentUser()
    {
        var username = User.Identity?.Name;
        if (string.IsNullOrEmpty(username)) return Unauthorized();

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
        if (user == null) return NotFound();

        return Ok(new { user.Username, user.DisplayName, user.Role });
    }
}
