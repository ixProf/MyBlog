using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data;

public static class DbInitializer
{
    public static async Task SeedAsync(AppDbContext context)
    {
        await context.Database.EnsureCreatedAsync();

        try
        {
            await context.Database.ExecuteSqlRawAsync("ALTER TABLE BlogPosts ADD COLUMN RelatedPostIds TEXT DEFAULT '';");
        }
        catch
        {
            // Column already exists or table freshly created
        }

        try
        {
            await context.Database.ExecuteSqlRawAsync(@"
                CREATE TABLE IF NOT EXISTS seed_history (
                    id SERIAL PRIMARY KEY,
                    key VARCHAR(128) UNIQUE NOT NULL,
                    seeded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );
            ");
        }
        catch { }

        try
        {
            await context.Database.ExecuteSqlRawAsync(@"
                CREATE TABLE IF NOT EXISTS subjects (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) UNIQUE NOT NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );
            ");
        }
        catch { }

        try
        {
            await context.Database.ExecuteSqlRawAsync(@"
                CREATE TABLE IF NOT EXISTS admin_login_attempts (
                    ip VARCHAR(64) PRIMARY KEY,
                    failed_attempts INTEGER NOT NULL DEFAULT 0,
                    locked_until TIMESTAMPTZ,
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );
            ");
        }
        catch { }

        try
        {
            await context.Database.ExecuteSqlRawAsync(@"
                CREATE TABLE IF NOT EXISTS profile (
                    id INTEGER PRIMARY KEY DEFAULT 1,
                    alias_ar VARCHAR(255) NOT NULL,
                    alias_en VARCHAR(255) NOT NULL,
                    name_ar VARCHAR(255) NOT NULL,
                    name_en VARCHAR(255) NOT NULL,
                    bio_ar TEXT NOT NULL,
                    bio_en TEXT NOT NULL,
                    linkedin VARCHAR(512) NOT NULL,
                    github VARCHAR(512) NOT NULL,
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );
            ");
        }
        catch { }

        try
        {
            await context.Database.ExecuteSqlRawAsync(@"
                CREATE TABLE IF NOT EXISTS questions (
                    id VARCHAR(64) PRIMARY KEY,
                    question_text TEXT NOT NULL,
                    answer_text TEXT,
                    status VARCHAR(32) NOT NULL DEFAULT 'pending',
                    is_anonymous BOOLEAN NOT NULL DEFAULT TRUE,
                    asker_name VARCHAR(255) NOT NULL DEFAULT 'Anonymous',
                    likes_count INTEGER NOT NULL DEFAULT 0,
                    parent_id VARCHAR(64),
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    answered_at TIMESTAMPTZ,
                    display_number INTEGER
                );
            ");
        }
        catch { }

        try
        {
            await context.Database.ExecuteSqlRawAsync(@"
                ALTER TABLE questions ADD COLUMN IF NOT EXISTS display_number INTEGER;
                ALTER TABLE questions ADD COLUMN IF NOT EXISTS parent_id VARCHAR(64);
            ");
        }
        catch { }

        try
        {
            if (!await context.Profiles.AnyAsync())
            {
                context.Profiles.Add(new Profile
                {
                    Id = 1,
                    AliasAr = "بروف",
                    AliasEn = "Prof",
                    NameAr = "محمود سيد محمد",
                    NameEn = "Mahmoud Sayed Mohamed",
                    BioAr = "مهندس برمجيات على قد حالي، بحاول أعمل حاجات ليها معنى وتفيدني وتفيد غيري. لو عندك سؤال، رأي، نقد، اقتراح، أو حتى حاجة نفسك تقولها ومش عارف تقولها ازاي. ابعتها، هقراها وهسمعك.",
                    BioEn = "I'm Mahmoud, but most people call me Prof. I'm a software developer who likes building things, trying new ideas, and figuring stuff out along the way. If you have a question, opinion, criticism, advice, or just something you want to say — go ahead. I'm listening.",
                    Linkedin = "https://www.linkedin.com/in/mahmoud-sayed-mohamed",
                    Github = "https://github.com/ixProf",
                    UpdatedAt = DateTime.UtcNow
                });
                await context.SaveChangesAsync();
            }
        }
        catch { }

        // 1. Keep Users admin account creation logic as-is (ensure admin account always exists and password is in sync)
        var defaultAdminPassword = Environment.GetEnvironmentVariable("ADMIN_EDITOR_PASSWORD")
            ?? Environment.GetEnvironmentVariable("ADMIN_PASSWORD")
            ?? "Prof@2026!";

        var adminUser = await context.Users.FirstOrDefaultAsync(u => u.Username.ToLower() == "prof" || u.Role == "Admin");
        if (adminUser == null)
        {
            var passwordHash = BCrypt.Net.BCrypt.HashPassword(defaultAdminPassword);
            context.Users.Add(new User
            {
                Username = "prof",
                PasswordHash = passwordHash,
                Role = "Admin",
                DisplayName = "Prof (Mahmoud Sayed Mohamed)"
            });
            await context.SaveChangesAsync();
        }
        else if (!string.IsNullOrWhiteSpace(defaultAdminPassword) && defaultAdminPassword != "Prof@2026!")
        {
            if (!BCrypt.Net.BCrypt.Verify(defaultAdminPassword, adminUser.PasswordHash))
            {
                adminUser.PasswordHash = BCrypt.Net.BCrypt.HashPassword(defaultAdminPassword);
                await context.SaveChangesAsync();
            }
        }

        // 2. Tracking mechanism: check if sample data has already been seeded once permanently
        const string SampleDataSeedKey = "InitialSampleData";
        try
        {
            var alreadySeeded = await context.SeedHistories.AnyAsync(s => s.Key == SampleDataSeedKey);
            if (alreadySeeded)
            {
                // Seeding has already run once permanently.
                // Skip all sample data insertion entirely (even if tables are currently empty).
                return;
            }

            // Check if database was already populated prior to introducing SeedHistory
            var hasExistingContent = await context.BlogPosts.AnyAsync() || await context.AcademicNotes.AnyAsync();
            if (hasExistingContent)
            {
                context.SeedHistories.Add(new SeedHistory
                {
                    Key = SampleDataSeedKey,
                    SeededAt = DateTime.UtcNow
                });
                await context.SaveChangesAsync();
                return;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[SeedHistory Note]: {ex.Message}");
        }

        // 3. First-time Seeding: Insert sample BlogPosts, AcademicNotes, and Questions
        context.BlogPosts.AddRange(
                new BlogPost
                {
                    Title = "How I Cut Database Response Times by 97% (12ms → 0.65ms) in Production",
                    Slug = "cut-database-response-times-97-percent",
                    Excerpt = "A walkthrough of identifying N+1 bottlenecks, utilizing AsNoTracking projection, covering indexes in SQL Server, and fine-tuning async execution in an active e-commerce backend.",
                    Content = @"# How I Cut Database Response Times by 97% (12ms → 0.65ms) in Production

When working on the **Roaya Furniture** e-commerce backend (an ASP.NET Core API serving high-traffic catalog browsing), our initial baseline endpoint latency hovered around **12ms to 18ms** under peak query concurrency. While that might sound acceptable for standard web apps, in an e-commerce catalog API every millisecond directly degrades checkout conversion.

Here is the exact step-by-step optimization roadmap that brought query execution down to **0.65ms**.

---

## 1. The Anatomy of the Bottleneck

Inspecting SQL Server Profiler and EF Core query logs revealed three major culprits:

1. **Unnecessary Change Tracker Overhead**: Standard queries were loading full tracking graphs into memory.
2. **Column Over-fetching**: Queries selected entire `Product` and `Category` entities rather than targeted view projections.
3. **Missing Index Seek on Active Status**: Catalog filters were performing table scans across 50,000+ SKU records.

```csharp
// BEFORE: Inefficient eager loading with full tracking
public async Task<List<ProductDto>> GetActiveProductsAsync(int categoryId)
{
    var products = await _context.Products
        .Include(p => p.Category)
        .Include(p => p.Variants)
        .Where(p => p.CategoryId == categoryId && p.IsActive)
        .ToListAsync();

    return _mapper.Map<List<ProductDto>>(products);
}
```

---

## 2. The Solution: Projection + NoTracking

By switching to `.AsNoTracking()` and projecting directly into DTOs using LINQ `.Select()`, EF Core translates the LINQ expression directly into clean SQL `SELECT` statements without loading variant tracking graphs or allocating heavy entity objects in the CLR heap.

```csharp
// AFTER: Zero-allocation projection with covering index
public async Task<IReadOnlyList<ProductSummaryDto>> GetOptimizedProductsAsync(int categoryId, CancellationToken ct)
{
    return await _context.Products
        .AsNoTracking()
        .Where(p => p.CategoryId == categoryId && p.IsActive)
        .OrderByDescending(p => p.CreatedAt)
        .Select(p => new ProductSummaryDto(
            p.Id,
            p.Title,
            p.Price,
            p.ThumbnailUrl,
            p.StockQuantity > 0
        ))
        .ToListAsync(ct);
}
```

---

## 3. SQL Server Covering Index

To turn cluster index scans into instant index seeks, we created a composite covering index on `(CategoryId, IsActive, CreatedAt)` with `INCLUDE (Title, Price, ThumbnailUrl, StockQuantity)`:

```sql
CREATE NONCLUSTERED INDEX IX_Products_Catalog_Lookup
ON Products (CategoryId, IsActive, CreatedAt DESC)
INCLUDE (Title, Price, ThumbnailUrl, StockQuantity);
```

### Result Benchmarks

| Metric | Before Optimization | After Optimization | Improvement |
| :--- | :--- | :--- | :--- |
| Average Latency | 12.4 ms | 0.65 ms | **94.7% Faster** |
| Memory Allocation | 480 KB / req | 14 KB / req | **97% Reduced** |
| Database CPU | 38% under load | 4% under load | **89% Dropped** |

> **Key Takeaway**: Never rely on full entity loading when read-only projections will do. Combine projection with covering indexes to let SQL Server satisfy requests purely out of memory.",
                    Tags = "ASP.NET Core, SQL Server, Performance, EF Core, Database",
                    RelatedPostIds = "2,3",
                    ReadTimeMinutes = 6,
                    PublishedAt = DateTime.UtcNow.AddDays(-14)
                },
                new BlogPost
                {
                    Title = "Architecting Hybrid Payment Pipelines: Cash on Delivery, Vodafone Cash, and JWT Rotation",
                    Slug = "hybrid-payment-pipelines-aspnet-core",
                    Excerpt = "Designing resilient payment state machines that guarantee atomic ledger reconciliation across asynchronous mobile wallets, COD delivery checkpoints, and protected API endpoints.",
                    Content = @"# Architecting Hybrid Payment Pipelines in ASP.NET Core

In emerging markets like Egypt, payment gateways rarely operate in a neat, synchronous credit-card sandbox. Systems must simultaneously support:

- **Cash on Delivery (COD)** with courier reconciliation ledgers.
- **Vodafone Cash & Mobile Wallets** with manual reference verification or webhook receipts.
- **JWT Refresh Token Rotation** to secure customer checkout sessions against replay attacks.

Here is how we architected this for the **Alaris Nexus** e-commerce platform.

---

## The Payment State Machine

```
[Order Created] ──> [Pending Verification] ──> [Payment Received] ──> [Order Dispatched]
        │                       │
        └───> [Cancelled] <─────┘ (Timeout / Expired)
```

We treat every transaction as an immutable ledger record wrapped inside an explicit database transaction using EF Core `BeginTransactionAsync(IsolationLevel.ReadCommitted)`.

```csharp
public async Task<PaymentResult> ProcessMobileWalletAsync(PaymentSubmissionDto dto, CancellationToken ct)
{
    await using var tx = await _context.Database.BeginTransactionAsync(IsolationLevel.ReadCommitted, ct);
    try
    {
        var order = await _context.Orders
            .FirstOrDefaultAsync(o => o.Id == dto.OrderId, ct)
            ?? throw new NotFoundException(""Order not found"");

        var ledgerEntry = new PaymentAuditLedger
        {
            OrderId = order.Id,
            Provider = PaymentProvider.VodafoneCash,
            TransactionReference = dto.SenderNumber + ""-"" + dto.ReferenceCode,
            Amount = order.TotalAmount,
            Status = PaymentStatus.UnderReview,
            SubmittedAt = DateTime.UtcNow
        };

        _context.PaymentAudits.Add(ledgerEntry);
        order.Status = OrderStatus.AwaitingVerification;

        await _context.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);

        return PaymentResult.Success(ledgerEntry.Id);
    }
    catch (Exception)
    {
        await tx.RollbackAsync(ct);
        throw;
    }
}
```

---

## Refresh Token Rotation Pattern

To protect administrative and customer sessions without forcing frequent re-logins, we store hashed refresh tokens in the database with automatic revocation of parent tokens if family reuse is detected.",
                    Tags = "Architecture, ASP.NET Core, Security, Payments, Clean Architecture",
                    RelatedPostIds = "1,3",
                    ReadTimeMinutes = 8,
                    PublishedAt = DateTime.UtcNow.AddDays(-5)
                },
                new BlogPost
                {
                    Title = "Why Clean Architecture Kept My Freelance Engagements on Schedule",
                    Slug = "why-clean-architecture-kept-freelance-on-schedule",
                    Excerpt = "How a disciplined folder structure, CQRS-lite handlers, and FluentValidation saved weeks of debugging across 200+ production endpoints.",
                    Content = @"# Why Clean Architecture Kept My Freelance Engagements on Schedule

When delivering 30 REST endpoints in 6 weeks for client projects like **Wa7at Al-Diriyah** (Saudi Arabia) or 66 endpoints for real-time restaurant POS systems, speed is useless if your code turns to spaghetti after week three.

Clean Architecture is often accused of being 'over-engineering'. But when applied pragmatically, it is actually the ultimate deadline preserver.

---

## The 4 Layer Boundaries

1. **Domain**: Pure business entities, enum statuses, and domain exceptions. Zero external dependencies.
2. **Application**: Use cases, request DTOs, FluentValidation validators, and service interfaces.
3. **Infrastructure**: EF Core DbContext, SQL Server migrations, Redis cache providers, QuestPDF generators.
4. **Presentation (API)**: Minimal controllers or Minimal APIs whose sole responsibility is HTTP contract handling and status code mapping.

```
       ┌────────────────────────┐
       │   API / Presentation   │
       └───────────┬────────────┘
                   │
       ┌───────────▼────────────┐
       │      Application       │
       └─────┬────────────┬─────┘
             │            │
 ┌───────────▼──┐      ┌──▼─────────────┐
 │    Domain    │      │ Infrastructure │
 │  └───────────┘      └────────────────┘
```

By decoupling business validation from controller actions, we could write unit tests in xUnit that execute in milliseconds without spinning up a real database or HTTP server.",
                    Tags = "Clean Architecture, Best Practices, C#, Freelancing",
                    RelatedPostIds = "1,2",
                    ReadTimeMinutes = 5,
                    PublishedAt = DateTime.UtcNow.AddDays(-2)
                }
            );
            await context.SaveChangesAsync();

            context.AcademicNotes.AddRange(
                new AcademicNote
                {
                    Subject = "Operating Systems",
                    Title = "Process Synchronization & Deadlock Prevention",
                    Slug = "os-process-synchronization-deadlocks",
                    Order = 1,
                    Content = @"# Process Synchronization & Deadlock Prevention

## 1. The Critical-Section Problem

A critical section is a piece of code that accesses shared resources (like shared memory or files) and must not be concurrently accessed by more than one process.

Any valid solution to the critical-section problem must satisfy three criteria:
1. **Mutual Exclusion**: If process $P_i$ is executing in its critical section, no other processes can be executing in their critical sections.
2. **Progress**: If no process is executing in its critical section and there exist some processes that wish to enter their critical section, then the selection of the processes that will enter cannot be postponed indefinitely.
3. **Bounded Waiting**: There must exist a bound on the number of times that other processes are allowed to enter their critical sections after a process has made a request to enter.

---

## 2. Hardware Synchronization: TestAndSet & CompareAndSwap

Modern CPUs provide atomic instructions to prevent race conditions at the instruction level:

```c
// Conceptual definition of CompareAndSwap (atomic in hardware)
int compare_and_swap(int *val, int expected, int new_val) {
    int temp = *val;
    if (*val == expected)
        *val = new_val;
    return temp;
}
```

---

## 3. The 4 Necessary Coffman Conditions for Deadlock

Deadlock can arise if and only if the following four conditions hold simultaneously:

1. **Mutual Exclusion**: At least one resource must be held in a non-shareable mode.
2. **Hold and Wait**: A process must be holding at least one resource and waiting to acquire additional resources held by other processes.
3. **No Preemption**: Resources cannot be preempted; a resource can be released only voluntarily by the process holding it.
4. **Circular Wait**: A closed chain of processes exists such that each process holds at least one resource needed by the next process in the chain.

> **Rule of thumb for systems programming**: Always acquire locks in a globally defined, consistent order to break condition #4 (Circular Wait)."
                },
                new AcademicNote
                {
                    Subject = "Operating Systems",
                    Title = "Virtual Memory & Page Replacement Algorithms",
                    Slug = "os-virtual-memory-page-replacement",
                    Order = 2,
                    Content = @"# Virtual Memory & Page Replacement Algorithms

Virtual memory decouples the user logical memory from physical physical RAM, allowing programs to execute even when they exceed available physical space.

---

## 1. Demand Paging & Page Fault Handling

When a process requests an address whose page table entry has the valid bit set to `0`, the MMU triggers a **Page Fault** trap to the OS kernel:

```
[CPU: Address Translation] ──> [Valid Bit = 0?] ──> [Trap to OS Kernel]
                                                           │
                                                           ▼
[Resume Process] <── [Update Page Table] <── [Read Page from Disk into Frame]
```

---

## 2. Comparison of Page Replacement Algorithms

- **FIFO (First-In, First-Out)**: Replaces the oldest loaded page. Suffer from Belady's Anomaly (more frames can lead to more page faults).
- **Optimal (OPT / MIN)**: Replaces the page that will not be used for the longest period of time. Theoretically optimal, impossible to implement without clairvoyance.
- **LRU (Least Recently Used)**: Replaces the page that has not been used for the longest period. Approximates OPT effectively using hardware timestamp counters or stack-based tracking.
- **Second-Chance (Clock Algorithm)**: Practical approximation of LRU using a single reference bit."
                },
                new AcademicNote
                {
                    Subject = "Database Internals",
                    Title = "B+ Trees vs LSM Trees: Read vs Write Trade-offs",
                    Slug = "db-bplus-trees-vs-lsm-trees",
                    Order = 1,
                    Content = @"# B+ Trees vs LSM Trees: Read vs Write Trade-offs

Database storage engines generally choose between two dominant data structures for disk indexing: **B+ Trees** (used in SQL Server, PostgreSQL, MySQL InnoDB) and **Log-Structured Merge-Trees (LSM Trees)** (used in RocksDB, Cassandra, ScyllaDB).

---

## 1. B+ Tree Architecture

- All leaf nodes are linked together in a doubly-linked list for sequential range scans.
- Internal nodes contain only routing keys and child pointers, maximizing node fan-out.
- High fan-out keeps tree depth small (e.g. depth 3 or 4 can index millions of rows).
- **Pros**: $O(\log N)$ predictable point reads and ultra-fast range queries.
- **Cons**: Random writes cause page splits and write amplification on mechanical disks and SSDs.

---

## 2. LSM Tree Architecture

- Writes are appended sequentially to an in-memory buffer (**MemTable**) backed by a Write-Ahead Log (WAL).
- When the MemTable is full, it is flushed to disk as an immutable **SSTable** (Sorted String Table).
- Periodic background **Compaction** merges SSTables and discards overwritten/deleted records.
- **Pros**: Sequential append writes deliver phenomenal write throughput.
- **Cons**: Point reads may need to check Bloom filters and multiple SSTables, increasing read latency."
                },
                new AcademicNote
                {
                    Subject = "Distributed Systems",
                    Title = "CAP Theorem & PACELC: Understanding Real World Guarantees",
                    Slug = "dist-cap-pacelc-explained",
                    Order = 1,
                    Content = @"# CAP Theorem & PACELC: Understanding Real World Guarantees

## 1. The Real CAP Theorem

Formulated by Eric Brewer and proven by Gilbert & Lynch, CAP states that in a distributed data store, in the presence of a **Network Partition ($P$)**, the system must choose between:

- **Consistency ($C$)**: Every read receives the most recent write or an error.
- **Availability ($A$)**: Every non-failing node returns a non-error response, without guarantee of receiving the most recent write.

Since network partitions ($P$) are unavoidable in physical networks due to router failures, cable cuts, or packet loss, the choice is never 'pick 2 of 3'. The choice is: **When partitions occur, do you prefer Consistency or Availability?**

---

## 2. The PACELC Theorem

Daniel Abadi recognized that CAP only describes system behavior during partitions, which happen rarely. What happens during normal execution?

**PACELC states:**
> If there is a **Partition ($P$)**, how does your system choose between **Availability ($A$)** and **Consistency ($C$)**?  
> **Else ($E$)**, how does your system trade off between **Latency ($L$)** and **Consistency ($C$)**?

| System | Classification | Behavior |
| :--- | :--- | :--- |
| **SQL Server AlwaysOn** | PC/EC | Partition: Consistent. Normal: Low latency sync/async replica |
| **Amazon DynamoDB** | PA/EL | Partition: Available. Normal: Lowest latency with eventual consistency |
| **Apache Cassandra** | PA/EL | Configurable per query (Quorum / One / All) |"
                }
            );
            await context.SaveChangesAsync();

            context.Questions.AddRange(
                new Question
                {
                    Id = "q-ef6d836dcb61",
                    QuestionText = "ازيك يا عالمي",
                    AnswerText = "بخير يا عالمي منور",
                    Status = "answered",
                    IsAnonymous = true,
                    AskerName = "Anonymous",
                    LikesCount = 1,
                    ParentId = null,
                    DisplayNumber = 1,
                    CreatedAt = DateTime.UtcNow.AddDays(-2),
                    AnsweredAt = DateTime.UtcNow.AddDays(-2).AddMinutes(1)
                },
                new Question
                {
                    AskerName = "Karim (Computer Science Junior)",
                    QuestionText = "How do you prepare for backend .NET technical interviews while still studying at university?",
                    AnswerText = @"Great question! Here is the blueprint that worked for me:

1. **Master the CLR & C# Foundations**: Don't just learn syntax. Understand value types vs reference types, boxing/unboxing, garbage collection generations (Gen 0, 1, 2), and how `async/await` uses state machines under the hood.
2. **Build Real Production APIs, Not Just Tutorials**: Anyone can follow a 20-minute CRUD tutorial. Build an e-commerce backend with transactional orders, real payment flows, JWT refresh rotation, and xUnit test suites. Put your GitHub repository link right at the top of your resume.
3. **Master SQL & Database Optimization**: Learn execution plans, clustered vs non-clustered indexes, and query profiling. In my freelance work, optimizing one query from 12ms to 0.65ms impressed clients and interviewers more than any certificate.
4. **Learn Clean Architecture**: Separate your Domain entities from your EF Core DbContext and Web API controllers.",
                    Status = "answered",
                    IsAnonymous = false,
                    LikesCount = 0,
                    DisplayNumber = 2,
                    CreatedAt = DateTime.UtcNow.AddDays(-10),
                    AnsweredAt = DateTime.UtcNow.AddDays(-9)
                },
                new Question
                {
                    AskerName = "Ahmed N.",
                    QuestionText = "When should I use SignalR instead of WebSockets directly in ASP.NET Core?",
                    AnswerText = @"In 99% of ASP.NET Core applications, you should use **SignalR** rather than raw WebSockets.

SignalR provides:
- **Automatic Fallback**: If WebSockets are blocked by corporate firewalls or proxies, SignalR automatically falls back to Server-Sent Events (SSE) or Long Polling.
- **Hub & Connection Management**: Built-in support for user IDs, connection groups (e.g. `Clients.Group(""KitchenStaff"")`), and broadcast messages.
- **Scale-out Backplanes**: Effortless clustering across multiple server instances using Redis backplanes or Azure SignalR Service.

We used SignalR in our **Restaurant POS System** to synchronize order status across kitchen, cashier, and waiter tablets with zero manual socket handshake boilerplate.",
                    Status = "answered",
                    IsAnonymous = false,
                    LikesCount = 0,
                    DisplayNumber = 3,
                    CreatedAt = DateTime.UtcNow.AddDays(-4),
                    AnsweredAt = DateTime.UtcNow.AddDays(-3)
                },
                new Question
                {
                    AskerName = "Anonymous",
                    QuestionText = "What is your favorite book or resource for learning distributed systems and database engines?",
                    AnswerText = null,
                    Status = "pending",
                    IsAnonymous = true,
                    LikesCount = 0,
                    DisplayNumber = 4,
                    CreatedAt = DateTime.UtcNow.AddHours(-6)
                }
            );
            await context.SaveChangesAsync();

            // Mark seeding as completed permanently in SeedHistory table
            try
            {
                context.SeedHistories.Add(new SeedHistory
                {
                    Key = SampleDataSeedKey,
                    SeededAt = DateTime.UtcNow
                });
                await context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SeedHistory Warning]: Could not record seed completion: {ex.Message}");
            }
    }
}
