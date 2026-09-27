using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace Backend.Services;

public class SupabaseStorageService : ISupabaseStorageService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<SupabaseStorageService> _logger;

    public SupabaseStorageService(
        HttpClient httpClient,
        IConfiguration configuration,
        IWebHostEnvironment env,
        ILogger<SupabaseStorageService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _env = env;
        _logger = logger;
    }

    public async Task<string> UploadImageAsync(Stream fileStream, string fileName, string contentType)
    {
        var supabaseUrl = (_configuration["Supabase:Url"] 
            ?? Environment.GetEnvironmentVariable("SUPABASE_URL") 
            ?? "https://idftairgyjnwhwwpcecc.supabase.co").TrimEnd('/');

        var bucket = _configuration["Supabase:Bucket"] 
            ?? Environment.GetEnvironmentVariable("SUPABASE_BUCKET") 
            ?? "blog-images";

        var apiKey = _configuration["Supabase:ApiKey"] 
            ?? _configuration["Supabase:ServiceKey"]
            ?? Environment.GetEnvironmentVariable("SUPABASE_SERVICE_ROLE_KEY")
            ?? Environment.GetEnvironmentVariable("SUPABASE_KEY")
            ?? Environment.GetEnvironmentVariable("SUPABASE_ANON_KEY");

        // Clean and sanitize file name
        var safeFileName = SanitizeFileName(fileName);
        var objectPath = $"{DateTime.UtcNow:yyyyMM}/{Guid.NewGuid():N}-{safeFileName}";

        // If Supabase key is configured, upload directly to Supabase Storage
        if (!string.IsNullOrWhiteSpace(apiKey))
        {
            try
            {
                using var memoryStream = new MemoryStream();
                await fileStream.CopyToAsync(memoryStream);
                var fileBytes = memoryStream.ToArray();

                var uploadUrl = $"{supabaseUrl}/storage/v1/object/{bucket}/{objectPath}";
                using var request = new HttpRequestMessage(HttpMethod.Post, uploadUrl);
                request.Headers.Add("apikey", apiKey);
                request.Headers.Add("Authorization", $"Bearer {apiKey}");
                request.Headers.Add("x-upsert", "true");
                request.Content = new ByteArrayContent(fileBytes);
                request.Content.Headers.ContentType = new MediaTypeHeaderValue(contentType);

                var response = await _httpClient.SendAsync(request);

                if (response.IsSuccessStatusCode)
                {
                    var publicUrl = $"{supabaseUrl}/storage/v1/object/public/{bucket}/{objectPath}";
                    _logger.LogInformation("Image successfully stored in Supabase Storage bucket '{Bucket}': {Url}", bucket, publicUrl);
                    return publicUrl;
                }

                // If bucket not found, attempt to create it as public
                if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
                {
                    _logger.LogWarning("Supabase bucket '{Bucket}' not found. Attempting auto-creation...", bucket);
                    var created = await TryCreateBucketAsync(supabaseUrl, bucket, apiKey);
                    if (created)
                    {
                        // Retry upload once
                        using var retryRequest = new HttpRequestMessage(HttpMethod.Post, uploadUrl);
                        retryRequest.Headers.Add("apikey", apiKey);
                        retryRequest.Headers.Add("Authorization", $"Bearer {apiKey}");
                        retryRequest.Headers.Add("x-upsert", "true");
                        retryRequest.Content = new ByteArrayContent(fileBytes);
                        retryRequest.Content.Headers.ContentType = new MediaTypeHeaderValue(contentType);

                        var retryResponse = await _httpClient.SendAsync(retryRequest);
                        if (retryResponse.IsSuccessStatusCode)
                        {
                            var publicUrl = $"{supabaseUrl}/storage/v1/object/public/{bucket}/{objectPath}";
                            return publicUrl;
                        }
                    }
                }

                var errContent = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("Supabase Storage upload returned status {StatusCode}: {Error}. Falling back to static storage.", response.StatusCode, errContent);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to upload image directly to Supabase Storage. Falling back to local static storage.");
            }
        }
        else
        {
            _logger.LogInformation("Supabase API key not specified in configuration. Using local static storage fallback for development.");
        }

        // Development fallback: Store in local wwwroot/uploads directory so images can be served without database blob storage
        return await SaveToLocalUploadsAsync(fileStream, objectPath);
    }

    private async Task<bool> TryCreateBucketAsync(string supabaseUrl, string bucket, string apiKey)
    {
        try
        {
            var createUrl = $"{supabaseUrl}/storage/v1/bucket";
            using var req = new HttpRequestMessage(HttpMethod.Post, createUrl);
            req.Headers.Add("apikey", apiKey);
            req.Headers.Add("Authorization", $"Bearer {apiKey}");
            var payload = JsonSerializer.Serialize(new { id = bucket, name = bucket, @public = true });
            req.Content = new StringContent(payload, Encoding.UTF8, "application/json");

            var res = await _httpClient.SendAsync(req);
            return res.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }

    private async Task<string> SaveToLocalUploadsAsync(Stream fileStream, string objectPath)
    {
        var webRoot = _env.WebRootPath;
        if (string.IsNullOrEmpty(webRoot))
        {
            webRoot = Path.Combine(_env.ContentRootPath, "wwwroot");
        }

        var uploadsDir = Path.Combine(webRoot, "uploads", Path.GetDirectoryName(objectPath) ?? "");
        Directory.CreateDirectory(uploadsDir);

        var fullFilePath = Path.Combine(webRoot, "uploads", objectPath);
        if (fileStream.CanSeek)
        {
            fileStream.Position = 0;
        }

        using (var dest = new FileStream(fullFilePath, FileMode.Create))
        {
            await fileStream.CopyToAsync(dest);
        }

        var normalizedPath = objectPath.Replace('\\', '/');
        return $"http://localhost:5000/uploads/{normalizedPath}";
    }

    private static string SanitizeFileName(string fileName)
    {
        var name = Path.GetFileNameWithoutExtension(fileName);
        var ext = Path.GetExtension(fileName).ToLowerInvariant();
        if (string.IsNullOrEmpty(ext)) ext = ".webp";

        var clean = new StringBuilder();
        foreach (var c in name.ToLowerInvariant())
        {
            if (char.IsLetterOrDigit(c) || c == '-' || c == '_')
            {
                clean.Append(c);
            }
            else if (clean.Length > 0 && clean[^1] != '-')
            {
                clean.Append('-');
            }
        }

        var safeName = clean.ToString().Trim('-');
        if (string.IsNullOrEmpty(safeName)) safeName = "image";
        return $"{safeName}{ext}";
    }
}
