using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PortfolioController : ControllerBase
{
    [HttpGet]
    public ActionResult GetPortfolio()
    {
        var data = new
        {
            Name = "Mahmoud Sayed Mohamed",
            Alias = "Prof",
            Title = "Junior / Fresh Backend .NET Developer",
            Location = "Assiut, Egypt",
            Summary = "Fresh Backend .NET Developer who builds production API systems on ASP.NET Core, from data model to deployment. Delivered 200+ endpoints across freelance and product engagements, cutting response time by 97% on one production system through async query tuning. Comfortable owning a backend end-to-end: authentication, database transactions, testing, and reporting, across booking, e-commerce, POS, financial, and academic platforms.",
            
            Metrics = new[]
            {
                new { Label = "Production Endpoints", Value = "200+" },
                new { Label = "Query Latency Reduction", Value = "97%" },
                new { Label = "Enterprise Projects", Value = "3+" },
                new { Label = "Production Controllers", Value = "45+" }
            },

            Projects = new[]
            {
                new
                {
                    Title = "Alaris Nexus — E-Commerce Management Platform",
                    Url = "https://alaris-nexus.vercel.app",
                    Highlights = "60+ REST endpoints across 16 controllers, layered repository/service/DTO architecture; hybrid payment pipeline (JWT refresh rotation, Vodafone Cash audits, COD ledger tracking) wrapped in DB transactions with xUnit coverage; automated Excel (ClosedXML) and PDF (QuestPDF) reporting; Redis caching; Docker; Serilog.",
                    Tags = new[] { "ASP.NET Core", "SQL Server", "Redis", "Docker", "QuestPDF", "ClosedXML", "xUnit", "Serilog" }
                },
                new
                {
                    Title = "Restaurant Management & Real-Time POS System",
                    Url = "https://client-cyan-alpha-16.vercel.app",
                    Highlights = "66-endpoint backend (10 controllers) for orders/inventory/payments/refunds, Clean Architecture, FluentValidation, Mapster; SignalR for live order-status sync across kitchen/cashier/waiter roles; 4 role types with JWT authorization; xUnit tests.",
                    Tags = new[] { "Clean Architecture", "SignalR", "FluentValidation", "Mapster", "JWT Auth", "xUnit" }
                },
                new
                {
                    Title = "University Attendance & Coursework Management System",
                    Url = "https://github.com/ixProf/Attendance-System",
                    Highlights = "4-role academic platform (10 controllers, 11 services), QR-based attendance, session locking, automated grading/risk-tracking, real-time SignalR notifications.",
                    Tags = new[] { "ASP.NET Core", "QR Codes", "SignalR", "Role-Based Auth", "Academic Tech" }
                }
            },

            Experience = new[]
            {
                new
                {
                    Role = "Backend Developer (Freelance)",
                    Company = "Wa7at Al-Diriyah",
                    Location = "Saudi Arabia (Remote)",
                    Period = "04/2026 – 05/2026",
                    Details = "30 REST endpoints across 7 controllers in a 6-week schedule, Clean Architecture; booking workflow with 4 status states and conflict prevention; financial dashboard with monthly PDF reporting (QuestPDF); JWT + BCrypt auth with rate-limited password reset; weekly client demos."
                },
                new
                {
                    Role = "Backend Developer (Freelance)",
                    Company = "Roaya Furniture",
                    Location = "Saudi Arabia (Remote)",
                    Period = "06/2026 – 07/2026",
                    Details = "ASP.NET Core e-commerce backend (SQL Server), 53+ endpoints, live in production; cut response times ~97% (12ms→0.65ms) via async query tuning; JWT/role-based auth; transactional order/payment flows; 10+ client check-ins."
                },
                new
                {
                    Role = "Backend .NET Developer",
                    Company = "Alaris Space",
                    Location = "Remote",
                    Period = "06/2026 – Present",
                    Details = "Contributes across Alaris Nexus and Alaris FlowX (126+ endpoints combined); Serilog diagnostics; Swagger/OpenAPI docs for all endpoints; xUnit tests; collaborates with a 3-person founding team on architecture and API contracts."
                }
            },

            TechnicalSkills = new[]
            {
                new { Category = "Languages & Fundamentals", Items = new[] { "C#", "SQL", "OOP", "Data Structures", "Algorithms" } },
                new { Category = ".NET & Web API", Items = new[] { "ASP.NET Core", "Web API", "REST APIs", "EF Core", "LINQ", "Dependency Injection", "Async/Await", "JWT", "Refresh Tokens", "RBAC", "Rate Limiting", "FluentValidation", "Mapster" } },
                new { Category = "Architecture & Patterns", Items = new[] { "Clean Architecture", "Layered Architecture", "Repository Pattern", "Service Layer", "SOLID Principles", "DTO Design", "API Security" } },
                new { Category = "Databases & Caching", Items = new[] { "SQL Server", "Relational DB Design", "DB Transactions", "Query Optimization", "Redis" } },
                new { Category = "Testing & DevOps Tools", Items = new[] { "xUnit", "Swagger/OpenAPI", "Postman", "Git", "GitHub", "SignalR", "Linux", "Docker" } },
                new { Category = "Libraries & Reporting", Items = new[] { "Serilog", "QuestPDF", "ClosedXML", "Payment Workflows" } }
            },

            Education = new
            {
                Institution = "Assiut National University",
                Degree = "Bachelor of Software Engineering",
                Period = "09/2023 – 06/2027 (Expected)",
                Location = "Assiut, Egypt"
            },

            Training = new[]
            {
                new
                {
                    Program = "Route Academy",
                    Track = "ASP.NET Backend Developer Track",
                    Period = "04/2026 – 10/2026"
                },
                new
                {
                    Program = "Digital Egypt Pioneers Program (DEPI)",
                    Track = "DevOps Engineer Track",
                    Period = "07/2026 – 01/2027"
                }
            },

            Links = new
            {
                LinkedIn = "https://linkedin.com/in/mahmoud-sayed-mohamed",
                GitHub = "https://github.com/ixProf"
            }
        };

        return Ok(data);
    }
}
