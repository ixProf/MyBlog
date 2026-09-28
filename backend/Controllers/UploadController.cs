using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UploadController : ControllerBase
{
    private readonly ISupabaseStorageService _storageService;
    private readonly ILogger<UploadController> _logger;

    private static readonly Dictionary<string, string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        { ".jpg", "image/jpeg" },
        { ".jpeg", "image/jpeg" },
        { ".png", "image/png" },
        { ".webp", "image/webp" },
        { ".gif", "image/gif" }
    };

    public UploadController(ISupabaseStorageService storageService, ILogger<UploadController> logger)
    {
        _storageService = storageService;
        _logger = logger;
    }

    [HttpPost("image")]
    [Authorize]
    [RequestSizeLimit(15 * 1024 * 1024)] // 15 MB limit
    public async Task<IActionResult> UploadImage(IFormFile? file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "No image file was provided." });
        }

        if (file.Length > 15 * 1024 * 1024)
        {
            return BadRequest(new { message = "File size exceeds the 15 MB limit." });
        }

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(ext) || !AllowedExtensions.TryGetValue(ext, out var expectedMime))
        {
            return BadRequest(new { message = "Unsupported file format. Please upload a WebP, JPEG, PNG, or GIF image." });
        }

        // Validate MIME type provided by client matches allowed types
        if (!string.IsNullOrWhiteSpace(file.ContentType) &&
            !file.ContentType.Equals(expectedMime, StringComparison.OrdinalIgnoreCase) &&
            !(ext is ".jpg" or ".jpeg" && file.ContentType.Equals("image/pjpeg", StringComparison.OrdinalIgnoreCase)))
        {
            return BadRequest(new { message = "Content-Type does not match the file extension." });
        }

        // Validate magic bytes (file signature check)
        await using var stream = file.OpenReadStream();
        var header = new byte[16];
        var bytesRead = await stream.ReadAsync(header.AsMemory(0, header.Length));

        if (bytesRead < 12 || !ValidateMagicBytes(header, ext))
        {
            return BadRequest(new { message = "Invalid file signature. File content does not match the expected image format." });
        }

        stream.Position = 0; // Reset stream pointer after inspection

        // Generate unpredictable randomized file name (never trust client filename)
        var randomFileName = $"{Guid.NewGuid():N}{ext}";

        try
        {
            var publicUrl = await _storageService.UploadImageAsync(stream, randomFileName, expectedMime);

            return Ok(new
            {
                url = publicUrl,
                fileName = randomFileName,
                size = file.Length,
                contentType = expectedMime
            });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "Storage configuration error during upload");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Storage service is not properly configured." });
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Supabase storage error during image upload");
            return StatusCode(StatusCodes.Status502BadGateway, new { message = "Cloud storage provider failed to store the image." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error processing image upload");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Failed to upload image. Please try again." });
        }
    }

    private static bool ValidateMagicBytes(byte[] header, string extension)
    {
        if (header.Length < 12) return false;

        return extension switch
        {
            ".jpg" or ".jpeg" => header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF,
            ".png" => header[0] == 0x89 && header[1] == 0x50 && header[2] == 0x4E && header[3] == 0x47
                      && header[4] == 0x0D && header[5] == 0x0A && header[6] == 0x1A && header[7] == 0x0A,
            ".gif" => header[0] == 0x47 && header[1] == 0x49 && header[2] == 0x46 && header[3] == 0x38, // "GIF8"
            ".webp" => header[0] == 0x52 && header[1] == 0x49 && header[2] == 0x46 && header[3] == 0x46 // "RIFF"
                       && header[8] == 0x57 && header[9] == 0x45 && header[10] == 0x42 && header[11] == 0x50, // "WEBP"
            _ => false
        };
    }
}
