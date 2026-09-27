namespace Backend.Services;

public interface ISupabaseStorageService
{
    Task<string> UploadImageAsync(Stream fileStream, string fileName, string contentType);
}
