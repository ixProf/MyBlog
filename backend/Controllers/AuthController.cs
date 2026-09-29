using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
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

    public AuthController(ITokenService tokenService, IConfiguration config)
    {
        _tokenService = tokenService;
        _config = config;
    }

    [HttpPost("login")]
    public ActionResult<AuthResponse> Login([FromBody] LoginRequest request)
    {
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
            return Unauthorized(new { message = "Invalid credentials. Only Prof can access the editor." });
        }

        // Issue JWT bearer token for fixed Admin identity
        var token = _tokenService.GenerateToken("Prof", "Admin", "Prof (Mahmoud Sayed Mohamed)");
        return Ok(new AuthResponse(token, "Prof", "Prof (Mahmoud Sayed Mohamed)"));
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
