using System.Security.Cryptography;
using System.Text;

namespace Backend.Services;

public class AskAuthService
{
    public const string CookieName = "prof_vault_token";
    private readonly IConfiguration _config;

    public AskAuthService(IConfiguration config)
    {
        _config = config;
    }

    public string GetAdminPassword()
    {
        return Environment.GetEnvironmentVariable("ADMIN_PASSWORD")
            ?? _config["Admin:Password"]
            ?? "Prof442005";
    }

    public string GetSessionSecret()
    {
        return Environment.GetEnvironmentVariable("SESSION_SECRET")
            ?? _config["Admin:SessionSecret"]
            ?? "vault-mastermind-secret-key-salt-999";
    }

    public string CreateSessionToken()
    {
        // Matches AskProf: `admin_auth_${Math.floor(Date.now() / (1000 * 60 * 60 * 24))}`
        long currentDayTimestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds() / 86400;
        string payload = $"admin_auth_{currentDayTimestamp}";
        string signature = ComputeHmac(payload, GetSessionSecret());
        return $"{payload}.{signature}";
    }

    public bool VerifySessionToken(string? token)
    {
        if (string.IsNullOrWhiteSpace(token)) return false;
        var parts = token.Split('.');
        if (parts.Length != 2) return false;

        string payload = parts[0];
        string signature = parts[1];

        string expectedSig = ComputeHmac(payload, GetSessionSecret());

        byte[] sigBytes = Encoding.UTF8.GetBytes(signature.Trim().ToLowerInvariant());
        byte[] expectedBytes = Encoding.UTF8.GetBytes(expectedSig.Trim().ToLowerInvariant());

        if (sigBytes.Length != expectedBytes.Length) return false;
        return CryptographicOperations.FixedTimeEquals(sigBytes, expectedBytes);
    }

    public bool CheckAdminPassword(string? password)
    {
        if (string.IsNullOrEmpty(password)) return false;
        string expected = GetAdminPassword().Trim();
        byte[] inputBytes = Encoding.UTF8.GetBytes(password.Trim());
        byte[] expectedBytes = Encoding.UTF8.GetBytes(expected);

        if (inputBytes.Length != expectedBytes.Length) return false;
        return CryptographicOperations.FixedTimeEquals(inputBytes, expectedBytes);
    }

    private static string ComputeHmac(string payload, string secret)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        byte[] hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
        return Convert.ToHexString(hash).ToLowerInvariant();
    }
}
