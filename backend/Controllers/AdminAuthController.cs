using Backend.Data;
using Backend.DTOs;
using Backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/admin/auth")]
public class AdminAuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly AskAuthService _authService;
    private readonly AskRateLimitService _rateLimitService;
    private readonly IWebHostEnvironment _env;

    public AdminAuthController(
        AppDbContext context,
        AskAuthService authService,
        AskRateLimitService rateLimitService,
        IWebHostEnvironment env)
    {
        _context = context;
        _authService = authService;
        _rateLimitService = rateLimitService;
        _env = env;
    }

    [HttpGet]
    public ActionResult CheckAuth()
    {
        var token = Request.Cookies[AskAuthService.CookieName];
        bool authenticated = _authService.VerifySessionToken(token);
        return Ok(new { authenticated });
    }

    [HttpPost]
    public async Task<ActionResult> Login([FromBody] AdminAuthLoginRequest request)
    {
        try
        {
            string ip = GetClientIp();

            // 1. Check if IP is currently locked out
            var rateCheck = await _rateLimitService.CheckAdminLoginRateLimitAsync(ip, _context);
            if (!rateCheck.Allowed)
            {
                return StatusCode(StatusCodes.Status429TooManyRequests, new
                {
                    success = false,
                    error = "Too many failed login attempts. Access temporarily locked for security.",
                    resetInSeconds = rateCheck.ResetInSeconds
                });
            }

            // 2. Validate password (credentials are never logged)
            if (string.IsNullOrWhiteSpace(request.Password) || !_authService.CheckAdminPassword(request.Password))
            {
                var failState = await _rateLimitService.RecordAdminLoginFailureAsync(ip, _context);
                if (!failState.Allowed)
                {
                    return StatusCode(StatusCodes.Status429TooManyRequests, new
                    {
                        success = false,
                        error = "Too many failed login attempts. Access temporarily locked for security.",
                        resetInSeconds = failState.ResetInSeconds
                    });
                }

                return StatusCode(StatusCodes.Status401Unauthorized, new
                {
                    success = false,
                    error = "Invalid credentials.",
                    remainingAttempts = failState.Remaining
                });
            }

            // 3. Password is valid: Reset failed attempt count for this IP
            await _rateLimitService.RecordAdminLoginSuccessAsync(ip, _context);

            // 4. Issue signed session token and set httpOnly cookie
            string token = _authService.CreateSessionToken();
            Response.Cookies.Append(AskAuthService.CookieName, token, new CookieOptions
            {
                HttpOnly = true,
                Secure = _env.IsProduction(),
                SameSite = SameSiteMode.Lax,
                Path = "/",
                Expires = DateTimeOffset.UtcNow.AddDays(7)
            });

            return Ok(new
            {
                success = true,
                message = "Access granted."
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Admin Auth Error]: {ex}");
            return StatusCode(StatusCodes.Status500InternalServerError, new
            {
                success = false,
                error = "Authentication request failed"
            });
        }
    }

    [HttpDelete]
    public ActionResult Logout()
    {
        Response.Cookies.Delete(AskAuthService.CookieName, new CookieOptions
        {
            Path = "/"
        });
        return Ok(new { success = true, message = "Session closed" });
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
