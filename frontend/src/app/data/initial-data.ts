import { BlogPost, AcademicNote, Question, PortfolioData } from '../models/models';

export const INITIAL_PORTFOLIO: PortfolioData = {
  name: 'Mahmoud Sayed Mohamed',
  alias: 'Prof',
  title: 'Junior / Fresh Backend .NET Developer',
  location: 'Egypt',
  summary: 'Fresh Backend .NET Developer who builds production API systems on ASP.NET Core, from data model to deployment. Delivered 200+ endpoints across freelance and product engagements, cutting response time by 97% on one production system through async query tuning. Comfortable owning a backend end-to-end: authentication, database transactions, testing, and reporting, across booking, e-commerce, POS, financial, and academic platforms.',
  metrics: [
    { label: 'Production Endpoints Delivered', value: '200+' },
    { label: 'Query Latency Reduction', value: '97%' },
    { label: 'Production Architectures', value: '3+' },
    { label: 'Total Controllers Authored', value: '45+' }
  ],
  projects: [
    {
      title: 'Alaris Nexus — E-Commerce Management Platform',
      url: 'https://alaris-nexus.vercel.app',
      highlights: '60+ REST endpoints across 16 controllers, layered repository/service/DTO architecture; hybrid payment pipeline (JWT refresh rotation, Vodafone Cash audits, COD ledger tracking) wrapped in DB transactions with xUnit coverage; automated Excel (ClosedXML) and PDF (QuestPDF) reporting; Redis caching; Docker; Serilog.',
      tags: ['ASP.NET Core', 'SQL Server', 'Redis', 'Docker', 'QuestPDF', 'ClosedXML', 'xUnit', 'Serilog']
    },
    {
      title: 'Restaurant Management & Real-Time POS System',
      url: 'https://client-cyan-alpha-16.vercel.app',
      highlights: '66-endpoint backend (10 controllers) for orders/inventory/payments/refunds, Clean Architecture, FluentValidation, Mapster; SignalR for live order-status sync across kitchen/cashier/waiter roles; 4 role types with JWT authorization; xUnit tests.',
      tags: ['Clean Architecture', 'SignalR', 'FluentValidation', 'Mapster', 'JWT Auth', 'xUnit']
    },
    {
      title: 'University Attendance & Coursework Management System',
      url: 'https://github.com/ixProf/Attendance-System',
      highlights: '4-role academic platform (10 controllers, 11 services), QR-based attendance, session locking, automated grading/risk-tracking, real-time SignalR notifications.',
      tags: ['ASP.NET Core', 'QR Attendance', 'SignalR', 'RBAC', 'Academic Tech']
    }
  ],
  experience: [
    {
      role: 'Backend Developer (Freelance)',
      company: 'Wa7at Al-Diriyah',
      location: 'Saudi Arabia Remote',
      period: '04/2026 – 05/2026',
      details: '30 REST endpoints across 7 controllers in a 6-week schedule, Clean Architecture; booking workflow with 4 status states and conflict prevention; financial dashboard with monthly PDF reporting (QuestPDF); JWT + BCrypt auth with rate-limited password reset; weekly client demos.'
    },
    {
      role: 'Backend Developer (Freelance)',
      company: 'Roaya Furniture',
      location: 'Saudi Arabia Remote',
      period: '06/2026 – 07/2026',
      details: 'ASP.NET Core e-commerce backend (SQL Server), 53+ endpoints, live in production; cut response times ~97% (12ms→0.65ms) via async query tuning; JWT/role-based auth; transactional order/payment flows; 10+ client check-ins.'
    },
    {
      role: 'Backend .NET Developer',
      company: 'Alaris Space',
      location: 'Remote',
      period: '06/2026 – Present',
      details: 'Contributes across Alaris Nexus and Alaris FlowX (126+ endpoints combined); Serilog diagnostics; Swagger/OpenAPI docs for all endpoints; xUnit tests; collaborates with a 3-person founding team on architecture and API contracts.'
    }
  ],
  technicalSkills: [
    {
      category: 'Languages & Core Fundamentals',
      items: ['C#', 'SQL', 'OOP', 'Data Structures', 'Algorithms', 'Asynchronous Programming']
    },
    {
      category: 'ASP.NET Core & Web API',
      items: ['ASP.NET Core', 'Web API', 'REST APIs', 'EF Core', 'LINQ', 'Dependency Injection', 'Async/Await', 'JWT', 'Refresh Tokens', 'RBAC', 'Rate Limiting', 'FluentValidation', 'Mapster']
    },
    {
      category: 'Architecture & System Design',
      items: ['Clean Architecture', 'Layered Architecture', 'Repository Pattern', 'Service Layer', 'SOLID', 'DTO Design', 'API Security']
    },
    {
      category: 'Databases & In-Memory Stores',
      items: ['SQL Server', 'Relational DB Design', 'DB Transactions', 'Query Optimization', 'Redis']
    },
    {
      category: 'Testing & Tooling',
      items: ['xUnit', 'Swagger / OpenAPI', 'Postman', 'Git', 'GitHub', 'SignalR', 'Linux', 'Docker']
    },
    {
      category: 'Logging & Reporting',
      items: ['Serilog', 'QuestPDF', 'ClosedXML', 'Payment Workflows']
    }
  ],
  education: {
    institution: 'Assiut National University',
    degree: 'Bachelor of Software Engineering',
    period: '09/2023 – 06/2027 (Expected)',
    location: 'Egypt'
  },
  training: [
    {
      program: 'Route Academy',
      track: 'ASP.NET Backend Developer Track',
      period: '04/2026 – 10/2026'
    },
    {
      program: 'Digital Egypt Pioneers Program (DEPI)',
      track: 'DevOps Engineer Track',
      period: '07/2026 – 01/2027'
    }
  ],
  links: {
    linkedIn: 'https://linkedin.com/in/mahmoud-sayed-mohamed',
    gitHub: 'https://github.com/ixProf'
  }
};

export const INITIAL_PORTFOLIO_AR: PortfolioData = {
  name: 'محمود سيد محمد',
  alias: 'بروف',
  title: 'مهندس باك إند دوت نت (Junior / Fresh)',
  location: 'مصر',
  summary: 'مهندس باك إند دوت نت شغال في بناء أنظمة APIs فعلية باستخدام ASP.NET Core، من أول تصميم الداتابيز لحد ما السيستم يترفع لايف على السيرفر. سلمت أكتر من ٢٠٠ إندبوينت في مشاريع فريلانس ومنتجات حقيقية، ونجحت في تسريع زمن استجابة استعلامات الداتابيز بنسبة ٩٧٪ على سيستم إنتاج شغال فعلياً بتحسين الاستعلامات والـ Async. متعود أشيل الباك إند من الألف للياء: الـ Authentication، معاملات الداتابيز (Transactions)، كتابة الـ Unit Tests، واستخراج التقارير، في منصات الحجوزات، الـ E-Commerce، نقاط البيع اللحظية (POS)، والأنظمة الجامعية.',
  metrics: [
    { label: 'إندبوينت شغالين في الإنتاج', value: '٢٠٠+' },
    { label: 'نسبة تسريع الاستعلامات', value: '٩٧٪' },
    { label: 'معماريات برمجية في الإنتاج', value: '٣+' },
    { label: 'إجمالي الكنترولرز البرمجية', value: '٤٥+' }
  ],
  projects: [
    {
      title: 'Alaris Nexus — منصة إدارة المتاجر الإلكترونية',
      url: 'https://alaris-nexus.vercel.app',
      highlights: 'أكتر من ٦٠ إندبوينت REST متقسمين على ١٦ كنترولر، مبنية بنظام الطبقات المنفصلة (Repository / Service / DTO)؛ دورة دفع هجينة (JWT مع تدوير الـ Refresh Tokens، مراجعة دفع فودافون كاش، ودفتر حسابات الدفع عند الاستلام) مربوطة بمعاملات داتابيز مع اختبارات xUnit؛ تقارير أوتوماتيك إكسيل (ClosedXML) وPDF (QuestPDF)؛ كاشينج باستخدام Redis؛ دوكر Docker؛ وتسجيل أخطاء بـ Serilog.',
      tags: ['ASP.NET Core', 'SQL Server', 'Redis', 'Docker', 'QuestPDF', 'ClosedXML', 'xUnit', 'Serilog']
    },
    {
      title: 'نظام إدارة المطاعم ونقاط البيع اللحظية (POS)',
      url: 'https://client-cyan-alpha-16.vercel.app',
      highlights: 'باك إند كامل فيه ٦٦ إندبوينت (١٠ كنترولرز) للطلبات والمخازن والمدفوعات والمسترجعات، بمعمارية نظيفة Clean Architecture، وFluentValidation، وMapster؛ ربط SignalR لتحديث ومزامنة حالة الأوردرات لحظياً بين المطبخ والكاشير والويتر؛ ٤ صلاحيات مستخدمين بتوثيق JWT؛ واختبارات xUnit.',
      tags: ['Clean Architecture', 'SignalR', 'FluentValidation', 'Mapster', 'JWT Auth', 'xUnit']
    },
    {
      title: 'نظام إدارة الحضور والغياب والمقررات الجامعية',
      url: 'https://github.com/ixProf/Attendance-System',
      highlights: 'منصة أكاديمية بـ ٤ صلاحيات (١٠ كنترولرز و١١ سيرفس)، تسجيل حضور بالـ QR كود، قفل الجلسات تلقائياً، تتبع درجات الطلاب المعرضين للرسوب أوتوماتيك، وإشعارات لحظية عبر SignalR.',
      tags: ['ASP.NET Core', 'QR Attendance', 'SignalR', 'RBAC', 'Academic Tech']
    }
  ],
  experience: [
    {
      role: 'مطور باك إند (فريلانس)',
      company: 'واحات الدرعية',
      location: 'عن بُعد — السعودية',
      period: '04/2026 – 05/2026',
      details: 'بناء ٣٠ إندبوينت REST على ٧ كنترولرز خلال ٦ أسابيع بمعمارية نظيفة Clean Architecture؛ دورة حجز كاملة بـ ٤ حالات لمنع تضارب المواعيد؛ لوحة تحكم مالية بتقارير PDF شهرية (QuestPDF)؛ توثيق أمان بـ JWT وBCrypt مع حماية ضد الـ Brute Force؛ وديمو أسبوعي مع العميل.'
    },
    {
      role: 'مطور باك إند (فريلانس)',
      company: 'رؤية للأثاث',
      location: 'عن بُعد — السعودية',
      period: '06/2026 – 07/2026',
      details: 'باك إند متجر إلكتروني بـ ASP.NET Core وقواعد بيانات SQL Server، أكتر من ٥٣ إندبوينت شغالين لايف في الإنتاج؛ تسريع زمن الاستجابة بنسبة ٩٧٪ (من 12ms لـ 0.65ms) بتحسين الاستعلامات والـ AsNoTracking؛ صلاحيات وتوثيق JWT؛ ودورات دفع وطلبات داخل داتابيز ترانزاكشن.'
    },
    {
      role: 'مهندس باك إند دوت نت',
      company: 'Alaris Space',
      location: 'عن بُعد',
      period: '06/2026 – حتى الآن',
      details: 'مشاركة في بناء منصتي Alaris Nexus وAlaris FlowX (مجموع أكتر من ١٢٦ إندبوينت)؛ تشخيص أداء ومراقبة بـ Serilog؛ توثيق كامل للـ APIs بـ Swagger / OpenAPI؛ كتابة اختبارات xUnit؛ وتعاون معماري مع فريق التأسيس المكون من ٣ مهندسين.'
    }
  ],
  technicalSkills: [
    {
      category: 'لغات البرمجة والأساسيات البرمجية',
      items: ['C#', 'SQL', 'البرمجة كائنية التوجه (OOP)', 'هياكل البيانات (Data Structures)', 'الخوارزميات (Algorithms)', 'البرمجة غير المتزامنة (Async/Await)']
    },
    {
      category: 'تطوير الويب بـ ASP.NET Core',
      items: ['ASP.NET Core', 'Web API', 'واجهات RESTful', 'EF Core', 'LINQ', 'حقن التبعيات (DI)', 'توثيق JWT', 'Refresh Tokens', 'إدارة الصلاحيات (RBAC)', 'تحديد معدل الطلبات (Rate Limiting)', 'FluentValidation', 'Mapster']
    },
    {
      category: 'المعمارية البرمجية وتصميم النظم',
      items: ['Clean Architecture', 'المعمارية متعددة الطبقات', 'Repository Pattern', 'Service Layer', 'مبادئ SOLID', 'تصميم الـ DTOs', 'أمان الـ APIs']
    },
    {
      category: 'قواعد البيانات والتخزين المؤقت',
      items: ['SQL Server', 'تصميم قواعد البيانات العلائقية', 'معاملات الداتابيز (Transactions)', 'تحسين أداء الاستعلامات', 'Redis']
    },
    {
      category: 'الاختبارات والأدوات الهندسية',
      items: ['xUnit', 'Swagger / OpenAPI', 'Postman', 'Git & GitHub', 'SignalR', 'Linux', 'Docker']
    },
    {
      category: 'التسجيل واستخراج التقارير',
      items: ['Serilog', 'QuestPDF (تقارير PDF)', 'ClosedXML (تقارير إكسيل)', 'بوابات الدفع الإلكتروني']
    }
  ],
  education: {
    institution: 'جامعة أسيوط الأهلية',
    degree: 'بكالوريوس هندسة البرمجيات',
    period: '09/2023 – 06/2027 (المتوقع)',
    location: 'مصر'
  },
  training: [
    {
      program: 'أكاديمية Route',
      track: 'مسار مطور باك إند ASP.NET',
      period: '04/2026 – 10/2026'
    },
    {
      program: 'مبادرة رواد مصر الرقمية (DEPI)',
      track: 'مسار مهندس ديف أوبس (DevOps)',
      period: '07/2026 – 01/2027'
    }
  ],
  links: {
    linkedIn: 'https://linkedin.com/in/mahmoud-sayed-mohamed',
    gitHub: 'https://github.com/ixProf'
  }
};

export const INITIAL_BLOG_POSTS: BlogPost[] = [
  {
    id: 1,
    title: 'How I Cut Database Response Times by 97% (12ms → 0.65ms) in Production',
    slug: 'cut-database-response-times-97-percent',
    excerpt: 'A deep-dive walkthrough on locating N+1 bottlenecks, utilizing AsNoTracking with LINQ projection, designing covering indexes, and fine-tuning async execution in an active e-commerce backend.',
    content: `# How I Cut Database Response Times by 97% (12ms → 0.65ms) in Production

When working on the **Roaya Furniture** e-commerce backend (an ASP.NET Core API serving high-traffic catalog browsing), our initial baseline endpoint latency hovered around **12ms to 18ms** under peak query concurrency. While that might sound acceptable for standard web apps, in an e-commerce catalog API every millisecond directly degrades checkout conversion.

Here is the exact step-by-step optimization roadmap that brought query execution down to **0.65ms**.

---

## 1. The Anatomy of the Bottleneck

Inspecting SQL Server Profiler and EF Core query logs revealed three major culprits:

1. **Unnecessary Change Tracker Overhead**: Standard queries were loading full tracking graphs into memory.
2. **Column Over-fetching**: Queries selected entire \`Product\` and \`Category\` entities rather than targeted view projections.
3. **Missing Index Seek on Active Status**: Catalog filters were performing table scans across 50,000+ SKU records.

\`\`\`csharp
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
\`\`\`

---

## 2. The Solution: Projection + NoTracking

By switching to \`.AsNoTracking()\` and projecting directly into DTOs using LINQ \`.Select()\`, EF Core translates the LINQ expression directly into clean SQL \`SELECT\` statements without loading variant tracking graphs or allocating heavy entity objects in the CLR heap.

\`\`\`csharp
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
\`\`\`

---

## 3. SQL Server Covering Index

To turn cluster index scans into instant index seeks, we created a composite covering index on \`(CategoryId, IsActive, CreatedAt)\` with \`INCLUDE (Title, Price, ThumbnailUrl, StockQuantity)\`:

\`\`\`sql
CREATE NONCLUSTERED INDEX IX_Products_Catalog_Lookup
ON Products (CategoryId, IsActive, CreatedAt DESC)
INCLUDE (Title, Price, ThumbnailUrl, StockQuantity);
\`\`\`

### Result Benchmarks

| Metric | Before Optimization | After Optimization | Improvement |
| :--- | :--- | :--- | :--- |
| Average Latency | 12.4 ms | 0.65 ms | **94.7% Faster** |
| Memory Allocation | 480 KB / req | 14 KB / req | **97% Reduced** |
| Database CPU | 38% under load | 4% under load | **89% Dropped** |

> **Key Takeaway**: Never rely on full entity loading when read-only projections will do. Combine projection with covering indexes to let SQL Server satisfy requests purely out of memory.`,
    tags: 'ASP.NET Core, SQL Server, Performance, EF Core, Database',
    relatedPostIds: '2,3',
    readTimeMinutes: 6,
    publishedAt: '2026-09-11T14:30:00Z'
  },
  {
    id: 2,
    title: 'Architecting Hybrid Payment Pipelines: Cash on Delivery, Vodafone Cash, and JWT Rotation',
    slug: 'hybrid-payment-pipelines-aspnet-core',
    excerpt: 'Designing resilient payment state machines that guarantee atomic ledger reconciliation across asynchronous mobile wallets, COD delivery checkpoints, and protected API endpoints.',
    content: `# Architecting Hybrid Payment Pipelines in ASP.NET Core

In emerging markets like Egypt, payment gateways rarely operate in a neat, synchronous credit-card sandbox. Systems must simultaneously support:

- **Cash on Delivery (COD)** with courier reconciliation ledgers.
- **Vodafone Cash & Mobile Wallets** with manual reference verification or webhook receipts.
- **JWT Refresh Token Rotation** to secure customer checkout sessions against replay attacks.

Here is how we architected this for the **Alaris Nexus** e-commerce platform.

---

## The Payment State Machine

\`\`\`
[Order Created] ──> [Pending Verification] ──> [Payment Received] ──> [Order Dispatched]
        │                       │
        └───> [Cancelled] <─────┘ (Timeout / Expired)
\`\`\`

We treat every transaction as an immutable ledger record wrapped inside an explicit database transaction using EF Core \`BeginTransactionAsync(IsolationLevel.ReadCommitted)\`.

\`\`\`csharp
public async Task<PaymentResult> ProcessMobileWalletAsync(PaymentSubmissionDto dto, CancellationToken ct)
{
    await using var tx = await _context.Database.BeginTransactionAsync(IsolationLevel.ReadCommitted, ct);
    try
    {
        var order = await _context.Orders
            .FirstOrDefaultAsync(o => o.Id == dto.OrderId, ct)
            ?? throw new NotFoundException("Order not found");

        var ledgerEntry = new PaymentAuditLedger
        {
            OrderId = order.Id,
            Provider = PaymentProvider.VodafoneCash,
            TransactionReference = dto.SenderNumber + "-" + dto.ReferenceCode,
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
\`\`\`

---

## Refresh Token Rotation Pattern

To protect administrative and customer sessions without forcing frequent re-logins, we store hashed refresh tokens in the database with automatic revocation of parent tokens if family reuse is detected.`,
    tags: 'Architecture, ASP.NET Core, Security, Payments, Clean Architecture',
    relatedPostIds: '1,3',
    readTimeMinutes: 8,
    publishedAt: '2026-09-20T10:00:00Z'
  },
  {
    id: 3,
    title: 'Why Clean Architecture Kept My Freelance Engagements on Schedule',
    slug: 'why-clean-architecture-kept-freelance-on-schedule',
    excerpt: 'How a disciplined folder structure, CQRS-lite handlers, and FluentValidation saved weeks of debugging across 200+ production endpoints.',
    content: `# Why Clean Architecture Kept My Freelance Engagements on Schedule

When delivering 30 REST endpoints in 6 weeks for client projects like **Wa7at Al-Diriyah** (Saudi Arabia) or 66 endpoints for real-time restaurant POS systems, speed is useless if your code turns to spaghetti after week three.

Clean Architecture is often accused of being 'over-engineering'. But when applied pragmatically, it is actually the ultimate deadline preserver.

---

## The 4 Layer Boundaries

1. **Domain**: Pure business entities, enum statuses, and domain exceptions. Zero external dependencies.
2. **Application**: Use cases, request DTOs, FluentValidation validators, and service interfaces.
3. **Infrastructure**: EF Core DbContext, SQL Server migrations, Redis cache providers, QuestPDF generators.
4. **Presentation (API)**: Minimal controllers or Minimal APIs whose sole responsibility is HTTP contract handling and status code mapping.

\`\`\`
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
 └──────────────┘      └────────────────┘
\`\`\`

By decoupling business validation from controller actions, we could write unit tests in xUnit that execute in milliseconds without spinning up a real database or HTTP server.`,
    tags: 'Clean Architecture, Best Practices, C#, Freelancing',
    relatedPostIds: '1',
    readTimeMinutes: 5,
    publishedAt: '2026-09-23T18:00:00Z'
  }
];

export const INITIAL_ACADEMIC_NOTES: AcademicNote[] = [
  {
    id: 1,
    subject: 'Operating Systems',
    title: 'Process Synchronization & Deadlock Prevention',
    slug: 'os-process-synchronization-deadlocks',
    order: 1,
    content: `# Process Synchronization & Deadlock Prevention

## 1. The Critical-Section Problem

A critical section is a piece of code that accesses shared resources (like shared memory or files) and must not be concurrently accessed by more than one process.

Any valid solution to the critical-section problem must satisfy three criteria:
1. **Mutual Exclusion**: If process $P_i$ is executing in its critical section, no other processes can be executing in their critical sections.
2. **Progress**: If no process is executing in its critical section and there exist some processes that wish to enter their critical section, then the selection of the processes that will enter cannot be postponed indefinitely.
3. **Bounded Waiting**: There must exist a bound on the number of times that other processes are allowed to enter their critical sections after a process has made a request to enter.

---

## 2. Hardware Synchronization: TestAndSet & CompareAndSwap

Modern CPUs provide atomic instructions to prevent race conditions at the instruction level:

\`\`\`c
// Conceptual definition of CompareAndSwap (atomic in hardware)
int compare_and_swap(int *val, int expected, int new_val) {
    int temp = *val;
    if (*val == expected)
        *val = new_val;
    return temp;
}
\`\`\`

---

## 3. The 4 Necessary Coffman Conditions for Deadlock

Deadlock can arise if and only if the following four conditions hold simultaneously:

1. **Mutual Exclusion**: At least one resource must be held in a non-shareable mode.
2. **Hold and Wait**: A process must be holding at least one resource and waiting to acquire additional resources held by other processes.
3. **No Preemption**: Resources cannot be preempted; a resource can be released only voluntarily by the process holding it.
4. **Circular Wait**: A closed chain of processes exists such that each process holds at least one resource needed by the next process in the chain.

> **Rule of thumb for systems programming**: Always acquire locks in a globally defined, consistent order to break condition #4 (Circular Wait).`,
    updatedAt: '2026-09-18T12:00:00Z'
  },
  {
    id: 2,
    subject: 'Operating Systems',
    title: 'Virtual Memory & Page Replacement Algorithms',
    slug: 'os-virtual-memory-page-replacement',
    order: 2,
    content: `# Virtual Memory & Page Replacement Algorithms

Virtual memory decouples the user logical memory from physical RAM, allowing programs to execute even when they exceed available physical space.

---

## 1. Demand Paging & Page Fault Handling

When a process requests an address whose page table entry has the valid bit set to \`0\`, the MMU triggers a **Page Fault** trap to the OS kernel:

\`\`\`
[CPU: Address Translation] ──> [Valid Bit = 0?] ──> [Trap to OS Kernel]
                                                           │
                                                           ▼
[Resume Process] <── [Update Page Table] <── [Read Page from Disk into Frame]
\`\`\`

---

## 2. Comparison of Page Replacement Algorithms

- **FIFO (First-In, First-Out)**: Replaces the oldest loaded page. Suffers from Belady's Anomaly (more frames can lead to more page faults).
- **Optimal (OPT / MIN)**: Replaces the page that will not be used for the longest period of time. Theoretically optimal, impossible to implement without clairvoyance.
- **LRU (Least Recently Used)**: Replaces the page that has not been used for the longest period. Approximates OPT effectively using hardware timestamp counters or stack-based tracking.
- **Second-Chance (Clock Algorithm)**: Practical approximation of LRU using a single reference bit.`,
    updatedAt: '2026-09-19T15:30:00Z'
  },
  {
    id: 3,
    subject: 'Database Internals',
    title: 'B+ Trees vs LSM Trees: Read vs Write Trade-offs',
    slug: 'db-bplus-trees-vs-lsm-trees',
    order: 1,
    content: `# B+ Trees vs LSM Trees: Read vs Write Trade-offs

Database storage engines generally choose between two dominant data structures for disk indexing: **B+ Trees** (used in SQL Server, PostgreSQL, MySQL InnoDB) and **Log-Structured Merge-Trees (LSM Trees)** (used in RocksDB, Cassandra, ScyllaDB).

---

## 1. B+ Tree Architecture

- All leaf nodes are linked together in a doubly-linked list for sequential range scans.
- Internal nodes contain only routing keys and child pointers, maximizing node fan-out.
- High fan-out keeps tree depth small (e.g. depth 3 or 4 can index millions of rows).
- **Pros**: $O(\\log N)$ predictable point reads and ultra-fast range queries.
- **Cons**: Random writes cause page splits and write amplification on mechanical disks and SSDs.

---

## 2. LSM Tree Architecture

- Writes are appended sequentially to an in-memory buffer (**MemTable**) backed by a Write-Ahead Log (WAL).
- When the MemTable is full, it is flushed to disk as an immutable **SSTable** (Sorted String Table).
- Periodic background **Compaction** merges SSTables and discards overwritten/deleted records.
- **Pros**: Sequential append writes deliver phenomenal write throughput.
- **Cons**: Point reads may need to check Bloom filters and multiple SSTables, increasing read latency.`,
    updatedAt: '2026-09-21T09:00:00Z'
  },
  {
    id: 4,
    subject: 'Distributed Systems',
    title: 'CAP Theorem & PACELC: Understanding Real World Guarantees',
    slug: 'dist-cap-pacelc-explained',
    order: 1,
    content: `# CAP Theorem & PACELC: Understanding Real World Guarantees

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
| **Apache Cassandra** | PA/EL | Configurable per query (Quorum / One / All) |`,
    updatedAt: '2026-09-22T11:00:00Z'
  }
];

export const INITIAL_QUESTIONS: Question[] = [
  {
    id: 'q-1',
    display_number: 1,
    asker_name: 'Karim (Computer Science Junior)',
    question_text: 'How do you prepare for backend .NET technical interviews while still studying at university?',
    answer_text: `Great question! Here is the blueprint that worked for me:

1. **Master the CLR & C# Foundations**: Don't just learn syntax. Understand value types vs reference types, boxing/unboxing, garbage collection generations (Gen 0, 1, 2), and how \`async/await\` uses state machines under the hood.
2. **Build Real Production APIs, Not Just Tutorials**: Anyone can follow a 20-minute CRUD tutorial. Build an e-commerce backend with transactional orders, real payment flows, JWT refresh rotation, and xUnit test suites. Put your GitHub repository link right at the top of your resume.
3. **Master SQL & Database Optimization**: Learn execution plans, clustered vs non-clustered indexes, and query profiling. In my freelance work, optimizing one query from 12ms to 0.65ms impressed clients and interviewers more than any certificate.
4. **Learn Clean Architecture**: Separate your Domain entities from your EF Core DbContext and Web API controllers.`,
    status: 'answered',
    is_anonymous: false,
    likes_count: 5,
    created_at: '2026-09-15T10:00:00Z',
    answered_at: '2026-09-16T14:30:00Z',
    askerName: 'Karim (Computer Science Junior)',
    questionText: 'How do you prepare for backend .NET technical interviews while still studying at university?',
    answerText: `Great question! Here is the blueprint that worked for me:

1. **Master the CLR & C# Foundations**: Don't just learn syntax. Understand value types vs reference types, boxing/unboxing, garbage collection generations (Gen 0, 1, 2), and how \`async/await\` uses state machines under the hood.
2. **Build Real Production APIs, Not Just Tutorials**: Anyone can follow a 20-minute CRUD tutorial. Build an e-commerce backend with transactional orders, real payment flows, JWT refresh rotation, and xUnit test suites. Put your GitHub repository link right at the top of your resume.
3. **Master SQL & Database Optimization**: Learn execution plans, clustered vs non-clustered indexes, and query profiling. In my freelance work, optimizing one query from 12ms to 0.65ms impressed clients and interviewers more than any certificate.
4. **Learn Clean Architecture**: Separate your Domain entities from your EF Core DbContext and Web API controllers.`,
    isAnswered: true,
    createdAt: '2026-09-15T10:00:00Z',
    answeredAt: '2026-09-16T14:30:00Z'
  },
  {
    id: 'q-2',
    display_number: 2,
    asker_name: 'Ahmed N.',
    question_text: 'When should I use SignalR instead of WebSockets directly in ASP.NET Core?',
    answer_text: `In 99% of ASP.NET Core applications, you should use **SignalR** rather than raw WebSockets.

SignalR provides:
- **Automatic Fallback**: If WebSockets are blocked by corporate firewalls or proxies, SignalR automatically falls back to Server-Sent Events (SSE) or Long Polling.
- **Hub & Connection Management**: Built-in support for user IDs, connection groups (e.g. \`Clients.Group("KitchenStaff")\`), and broadcast messages.
- **Scale-out Backplanes**: Effortless clustering across multiple server instances using Redis backplanes or Azure SignalR Service.

We used SignalR in our **Restaurant POS System** to synchronize order status across kitchen, cashier, and waiter tablets with zero manual socket handshake boilerplate.`,
    status: 'answered',
    is_anonymous: false,
    likes_count: 8,
    created_at: '2026-09-21T08:15:00Z',
    answered_at: '2026-09-22T09:45:00Z',
    askerName: 'Ahmed N.',
    questionText: 'When should I use SignalR instead of WebSockets directly in ASP.NET Core?',
    answerText: `In 99% of ASP.NET Core applications, you should use **SignalR** rather than raw WebSockets.

SignalR provides:
- **Automatic Fallback**: If WebSockets are blocked by corporate firewalls or proxies, SignalR automatically falls back to Server-Sent Events (SSE) or Long Polling.
- **Hub & Connection Management**: Built-in support for user IDs, connection groups (e.g. \`Clients.Group("KitchenStaff")\`), and broadcast messages.
- **Scale-out Backplanes**: Effortless clustering across multiple server instances using Redis backplanes or Azure SignalR Service.

We used SignalR in our **Restaurant POS System** to synchronize order status across kitchen, cashier, and waiter tablets with zero manual socket handshake boilerplate.`,
    isAnswered: true,
    createdAt: '2026-09-21T08:15:00Z',
    answeredAt: '2026-09-22T09:45:00Z'
  },
  {
    id: 'q-3',
    display_number: 3,
    asker_name: 'Visitor from Cairo',
    question_text: 'What is your favorite resource for learning database storage engine internals and concurrency control?',
    answer_text: null,
    status: 'pending',
    is_anonymous: false,
    likes_count: 0,
    created_at: '2026-09-24T19:00:00Z',
    answered_at: null,
    askerName: 'Visitor from Cairo',
    questionText: 'What is your favorite resource for learning database storage engine internals and concurrency control?',
    answerText: null,
    isAnswered: false,
    createdAt: '2026-09-24T19:00:00Z'
  }
];

