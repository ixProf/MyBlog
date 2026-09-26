using System.Collections.Concurrent;
using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public class RateLimitCheckResult
{
    public bool Allowed { get; set; }
    public int Remaining { get; set; }
    public int ResetInSeconds { get; set; }
}

public class AskRateLimitService
{
    public const int MaxAdminLoginAttempts = 5;
    public static readonly TimeSpan AdminLockoutWindow = TimeSpan.FromMinutes(15); // 15 minutes

    // In-memory store for fallback and public submissions
    private readonly ConcurrentDictionary<string, (int Count, DateTime ResetAt)> _memStore = new();

    public async Task<RateLimitCheckResult> CheckAdminLoginRateLimitAsync(string ip, AppDbContext db)
    {
        var now = DateTime.UtcNow;

        try
        {
            var attempt = await db.AdminLoginAttempts.FirstOrDefaultAsync(a => a.Ip == ip);
            if (attempt != null)
            {
                // Check if currently locked out
                if (attempt.LockedUntil.HasValue && attempt.LockedUntil.Value > now)
                {
                    int resetSeconds = Math.Max(1, (int)Math.Ceiling((attempt.LockedUntil.Value - now).TotalSeconds));
                    return new RateLimitCheckResult
                    {
                        Allowed = false,
                        Remaining = 0,
                        ResetInSeconds = resetSeconds
                    };
                }

                // Check if lockout window has expired since last attempt
                if ((now - attempt.UpdatedAt) > AdminLockoutWindow)
                {
                    return new RateLimitCheckResult
                    {
                        Allowed = true,
                        Remaining = MaxAdminLoginAttempts,
                        ResetInSeconds = (int)AdminLockoutWindow.TotalSeconds
                    };
                }

                // Check if reached max attempts
                if (attempt.FailedAttempts >= MaxAdminLoginAttempts)
                {
                    int resetSeconds = Math.Max(1, (int)Math.Ceiling((attempt.UpdatedAt + AdminLockoutWindow - now).TotalSeconds));
                    return new RateLimitCheckResult
                    {
                        Allowed = false,
                        Remaining = 0,
                        ResetInSeconds = resetSeconds
                    };
                }

                int remaining = Math.Max(0, MaxAdminLoginAttempts - attempt.FailedAttempts);
                int sec = (int)Math.Ceiling((attempt.UpdatedAt + AdminLockoutWindow - now).TotalSeconds);
                return new RateLimitCheckResult
                {
                    Allowed = true,
                    Remaining = remaining,
                    ResetInSeconds = Math.Max(1, sec)
                };
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[RateLimit DB check fallback]: {ex.Message}");
        }

        // In-memory fallback
        string memKey = $"admin_login_{ip}";
        if (_memStore.TryGetValue(memKey, out var rec))
        {
            if (now > rec.ResetAt)
            {
                return new RateLimitCheckResult
                {
                    Allowed = true,
                    Remaining = MaxAdminLoginAttempts,
                    ResetInSeconds = (int)AdminLockoutWindow.TotalSeconds
                };
            }

            if (rec.Count >= MaxAdminLoginAttempts)
            {
                return new RateLimitCheckResult
                {
                    Allowed = false,
                    Remaining = 0,
                    ResetInSeconds = Math.Max(1, (int)Math.Ceiling((rec.ResetAt - now).TotalSeconds))
                };
            }

            return new RateLimitCheckResult
            {
                Allowed = true,
                Remaining = MaxAdminLoginAttempts - rec.Count,
                ResetInSeconds = Math.Max(1, (int)Math.Ceiling((rec.ResetAt - now).TotalSeconds))
            };
        }

        return new RateLimitCheckResult
        {
            Allowed = true,
            Remaining = MaxAdminLoginAttempts,
            ResetInSeconds = (int)AdminLockoutWindow.TotalSeconds
        };
    }

    public async Task<RateLimitCheckResult> RecordAdminLoginFailureAsync(string ip, AppDbContext db)
    {
        var now = DateTime.UtcNow;

        // Update in-memory
        string memKey = $"admin_login_{ip}";
        _memStore.AddOrUpdate(memKey,
            _ => (1, now.Add(AdminLockoutWindow)),
            (_, old) => now > old.ResetAt ? (1, now.Add(AdminLockoutWindow)) : (old.Count + 1, old.ResetAt));

        try
        {
            var attempt = await db.AdminLoginAttempts.FirstOrDefaultAsync(a => a.Ip == ip);
            int failed;

            if (attempt == null)
            {
                failed = 1;
                attempt = new AdminLoginAttempt
                {
                    Ip = ip,
                    FailedAttempts = failed,
                    LockedUntil = null,
                    UpdatedAt = now
                };
                db.AdminLoginAttempts.Add(attempt);
            }
            else
            {
                if ((now - attempt.UpdatedAt) > AdminLockoutWindow)
                {
                    failed = 1;
                    attempt.FailedAttempts = 1;
                    attempt.LockedUntil = null;
                }
                else
                {
                    attempt.FailedAttempts += 1;
                    failed = attempt.FailedAttempts;
                    if (failed >= MaxAdminLoginAttempts)
                    {
                        attempt.LockedUntil = now.Add(AdminLockoutWindow);
                    }
                }
                attempt.UpdatedAt = now;
            }

            await db.SaveChangesAsync();

            bool allowed = failed < MaxAdminLoginAttempts;
            int remaining = Math.Max(0, MaxAdminLoginAttempts - failed);
            return new RateLimitCheckResult
            {
                Allowed = allowed,
                Remaining = remaining,
                ResetInSeconds = (int)AdminLockoutWindow.TotalSeconds
            };
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[RateLimit DB record failure fallback]: {ex.Message}");
            var rec = _memStore[memKey];
            return new RateLimitCheckResult
            {
                Allowed = rec.Count < MaxAdminLoginAttempts,
                Remaining = Math.Max(0, MaxAdminLoginAttempts - rec.Count),
                ResetInSeconds = Math.Max(1, (int)Math.Ceiling((rec.ResetAt - now).TotalSeconds))
            };
        }
    }

    public async Task RecordAdminLoginSuccessAsync(string ip, AppDbContext db)
    {
        _memStore.TryRemove($"admin_login_{ip}", out _);

        try
        {
            var attempt = await db.AdminLoginAttempts.FirstOrDefaultAsync(a => a.Ip == ip);
            if (attempt != null)
            {
                db.AdminLoginAttempts.Remove(attempt);
                await db.SaveChangesAsync();
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[RateLimit DB clear success fallback]: {ex.Message}");
        }
    }

    public RateLimitCheckResult CheckPublicSubmissionRateLimit(string ip, int maxRequests = 6, int windowMinutes = 10)
    {
        var now = DateTime.UtcNow;
        var window = TimeSpan.FromMinutes(windowMinutes);
        string key = $"public_submit_{ip}";

        var rec = _memStore.AddOrUpdate(key,
            _ => (1, now.Add(window)),
            (_, old) => now > old.ResetAt ? (1, now.Add(window)) : (old.Count + 1, old.ResetAt));

        if (rec.Count > maxRequests)
        {
            int resetSeconds = Math.Max(1, (int)Math.Ceiling((rec.ResetAt - now).TotalSeconds));
            return new RateLimitCheckResult { Allowed = false, Remaining = 0, ResetInSeconds = resetSeconds };
        }

        return new RateLimitCheckResult
        {
            Allowed = true,
            Remaining = maxRequests - rec.Count,
            ResetInSeconds = Math.Max(1, (int)Math.Ceiling((rec.ResetAt - now).TotalSeconds))
        };
    }
}
