using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace Backend.Services;

public class SupabaseStorageService : ISupabaseStorageService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<SupabaseStorageService> _logger;

    public SupabaseStorageService(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<SupabaseStorageService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<string> UploadImageAsync(Stream fileStream, string fileName, string contentType)
    {
        var supabaseUrl = (_configuration["Supabase:Url"] 
            ?? Environment.GetEnvironmentVariable("SUPABASE_URL"))?.TrimEnd('/');

        var bucket = _configuration["Supabase:Bucket"] 
            ?? Environment.GetEnvironmentVariable("SUPABASE_BUCKET") 
            ?? "blog-images";

        var apiKey = _configuration["Supabase:ApiKey"] 
            ?? _configuration["Supabase:ServiceKey"]
            ?? Environment.GetEnvironmentVariable("SUPABASE_SERVICE_ROLE_KEY")
            ?? Environment.GetEnvironmentVariable("SUPABASE_KEY");

        if (string.IsNullOrWhiteSpace(supabaseUrl) || string.IsNullOrWhiteSpace(apiKey))
        {
            throw new InvalidOperationException("Supabase storage is not configured. Required environment variables: SUPABASE_URL, SUPABASE_BUCKET, SUPABASE_SERVICE_ROLE_KEY.");
        }

        var objectPath = $"{DateTime.UtcNow:yyyyMM}/{fileName}";

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
                    _logger.LogInformation("Image stored in newly created Supabase bucket '{Bucket}': {Url}", bucket, publicUrl);
                    return publicUrl;
                }
            }
        }

        var errContent = await response.Content.ReadAsStringAsync();
        _logger.LogError("Supabase Storage upload failed with status {StatusCode}: {Error}", response.StatusCode, errContent);
        throw new HttpRequestException($"Supabase storage upload failed with status {response.StatusCode}: {errContent}");
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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to auto-create Supabase bucket '{Bucket}'", bucket);
            return false;
        }
    }
}
