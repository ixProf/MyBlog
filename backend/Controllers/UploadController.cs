using Backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UploadController : ControllerBase
{
    private readonly ISupabaseStorageService _storageService;
    private readonly ILogger<UploadController> _logger;

    private static readonly HashSet<string> AllowedMimeTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/gif",
        "image/svg+xml"
    };

    public UploadController(ISupabaseStorageService storageService, ILogger<UploadController> logger)
    {
        _storageService = storageService;
        _logger = logger;
    }

    [HttpPost("image")]
    [RequestSizeLimit(15 * 1024 * 1024)] // 15 MB limit
    public async Task<IActionResult> UploadImage(IFormFile? file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "No image file was provided." });
        }

        var contentType = file.ContentType;
        if (string.IsNullOrWhiteSpace(contentType) || !AllowedMimeTypes.Contains(contentType))
        {
            // Check extension as fallback
            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            contentType = ext switch
            {
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".webp" => "image/webp",
                ".gif" => "image/gif",
                ".svg" => "image/svg+xml",
                _ => null
            };

            if (contentType == null)
            {
                return BadRequest(new { message = "Unsupported file format. Please upload a WebP, JPEG, PNG, or GIF image." });
            }
        }

        try
        {
            await using var stream = file.OpenReadStream();
            var publicUrl = await _storageService.UploadImageAsync(stream, file.FileName, contentType);

            return Ok(new
            {
                url = publicUrl,
                fileName = file.FileName,
                size = file.Length,
                contentType
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing image upload: {FileName}", file.FileName);
            return StatusCode(500, new { message = "Failed to upload image. Please try again." });
        }
    }
}
