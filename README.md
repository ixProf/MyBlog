# Call Me Prof — Personal Website & Digital Workshop

Personal website for **"Prof"** (**Mahmoud Sayed Mohamed**, Junior/Fresh Backend .NET Developer from Egypt).

A unified single-admin personal platform combining:
1. **Home** — Hero introduction, key stats (200+ endpoints, 97% query latency reduction), and navigation portals across the 4 pillars.
2. **Blog** — Public feed of technical write-ups rendered in a polished Obsidian-style reading view with code blocks, tables, and a reading progress bar.
3. **Academic Notes** — Docusaurus/GitBook documentation-style summaries of Software Engineering courses (Operating Systems, Database Internals, Distributed Systems) with sidebar hierarchy.
4. **Ask** — Public feed of answered questions, an anonymous question submission form for visitors, and an auth-protected private inbox for Prof to answer and publish responses.
5. **Portfolio** — Production systems (Alaris Nexus, Restaurant POS, University Attendance), freelance work in Saudi Arabia, technical skills taxonomy, education at Assiut National University, and training.
6. **Admin / Private Editor** — Distraction-free Obsidian-style Markdown editor with an **embedded drawing widget (Excalidraw-style canvas)** that allows drawing diagrams/sketches and embedding them directly into Markdown.

---

## Visual Identity & Design System
- **Color Palette**: Built around warm peach (`#FFDBBB`) and warm taupe (`#CCBEB1`).
  - **Light mode**: Background `#FDF8F3`, card surfaces `#FFFFFF` (with `#FFDBBB` accent tint), primary text `#2E2A26`, secondary text `#6B5F55`, interactive `#A8988A`, borders `#E8DCCF`.
  - **Dark mode**: Background `#1C1917`, card surfaces `#26221F`, primary text `#EDE4DA`, secondary text `#B0A399`, interactive `#FFDBBB`, borders `#3A342F`.
- **Eye Comfort**: Soft contrast ratios (~7:1–12:1), generous line-height (`1.65–1.8`), body text 16–18px.
- **Typography**: 
  - English headings & brand: **Delius** (Google Fonts).
  - English body text: **Plus Jakarta Sans** (Google Fonts).
  - Arabic text: **Arslan Wessam A** (`public/fonts/ArslanWessamA.ttf` via `@font-face` and `[lang="ar"]` / `.font-arabic`).
  - Code blocks: **JetBrains Mono**.
- **Dark/Light Mode Toggle**: Header button toggling themes instantly with persistence in `localStorage`.

---

## Authentication & Administration
- Single-Admin authentication protects:
  - The **Obsidian Editor** (`/editor`) via JWT Bearer token.
  - The **Ask Private Inbox** (`/ask/login`) via signed HttpOnly session cookie.
  - CRUD operations on blog posts, academic notes, and visitor questions.
- Admin credentials and secrets are configured via environment variables or .NET user-secrets (never hardcoded in source control).

---

## Tech Stack & Architecture

### Backend: ASP.NET Core Web API (.NET 10)
- Clean / Layered Architecture (`backend/`):
  - `Models/Entities.cs`: `User`, `BlogPost`, `AcademicNote`, `Question`
  - `Data/AppDbContext.cs`: EF Core with PostgreSQL persistence (Npgsql)
  - `Data/DbInitializer.cs`: Seeds initial data and sets up schema
  - `Services/TokenService.cs`: JWT Bearer authentication for editor
  - `Services/AskAuthService.cs`: Constant-time HMAC-SHA256 cookie auth for questions moderation
  - `Services/SupabaseStorageService.cs`: Direct cloud image uploads to Supabase Storage
  - `Services/StartupValidator.cs`: Fails fast on startup if critical configs/secrets are missing
  - `Controllers/`: `AuthController`, `BlogController`, `NotesController`, `QuestionsController`, `PortfolioController`, `UploadController`

### Frontend: Angular (v22 Standalone)
- Component-based architecture with Angular Router & Reactive Forms (`frontend/`):
  - `src/app/pages/home.component.ts`: Hero, bio, key metrics, and section portals
  - `src/app/pages/blog.component.ts`: Post feed, tag chips, and search
  - `src/app/pages/blog-detail.component.ts`: Obsidian reading view and progress track
  - `src/app/pages/academic-notes.component.ts`: Docusaurus-style sidebar and course trees
  - `src/app/pages/ask.component.ts`: Public Q&A, anonymous submission, and Prof's private inbox
  - `src/app/pages/portfolio.component.ts`: Complete real portfolio and project architecture
  - `src/app/pages/admin-editor.component.ts`: Obsidian Markdown editor with live preview
  - `src/app/components/drawing-canvas.component.ts`: Excalidraw-style drawing widget
  - `src/app/components/navbar.component.ts` & `footer.component.ts`: Unified design system
  - `src/app/components/login-modal.component.ts`: Single-admin login modal

---

## Configuration & Environment Variables

The backend requires the following configuration keys (set via environment variables or `dotnet user-secrets`):

| Variable / Key | Purpose | Example / Note |
|---|---|---|
| `ConnectionStrings__DefaultConnection` (or `SUPABASE_CONNECTION_STRING`) | PostgreSQL database connection string | `Host=...;Database=...;Username=...;Password=...` |
| `Jwt__Key` (or `Jwt:Key`) | Secret key for JWT Bearer token signing | Minimum 32 characters long |
| `ADMIN_PASSWORD` | Password for admin authentication | Strong secret password |
| `SESSION_SECRET` | Secret key for signing moderation cookies | Strong HMAC secret string |
| `FRONTEND_URL` | Allowed CORS origin for frontend | `https://your-domain.vercel.app` (or comma-separated) |
| `PORT` | Listening HTTP port | Defaults to `10000` (for container / cloud hosts) |
| `Supabase__Url` | Supabase project API URL | `https://xxxx.supabase.co` |
| `Supabase__Bucket` | Supabase storage bucket name | `blog-images` |
| `Supabase__ApiKey` | Supabase service/anon API key | Supabase API Key |

### Setting Local Secrets with `dotnet user-secrets`
In local development, avoid putting secrets in `appsettings.json`. Instead, initialize and set them inside `backend/`:
```powershell
cd backend
dotnet user-secrets init
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Database=myblog;Username=postgres;Password=your_dev_password"
dotnet user-secrets set "Jwt:Key" "your-development-jwt-key-must-be-at-least-32-chars-long"
dotnet user-secrets set "Admin:Password" "your_local_admin_password"
dotnet user-secrets set "Admin:SessionSecret" "your_local_session_secret_at_least_32_chars"
dotnet user-secrets set "Supabase:Url" "https://your-proj.supabase.co"
dotnet user-secrets set "Supabase:Bucket" "blog-images"
dotnet user-secrets set "Supabase:ApiKey" "your_supabase_api_key"
```

### Production Deployment (SnapDeploy / Render / Docker)
Set the environment variables directly in the hosting dashboard or Docker run command:
- `ConnectionStrings__DefaultConnection` = `<PostgreSQL connection string>`
- `Jwt__Key` = `<Secure 32+ character JWT secret>`
- `ADMIN_PASSWORD` = `<Admin password>`
- `SESSION_SECRET` = `<Session cookie HMAC secret>`
- `FRONTEND_URL` = `https://your-app.vercel.app`
- `PORT` = `10000`
- `Supabase__Url`, `Supabase__Bucket`, `Supabase__ApiKey`

---

## How to Run Locally

### 1. Start the Backend (.NET Web API)
```powershell
cd "backend"
dotnet run
```
*Backend runs on `http://0.0.0.0:10000` (or configured PORT) with health check at `/health`.*

### 2. Start the Frontend (Angular Dev Server)
```powershell
cd "frontend"
npm start -- --port 4200
```
*Frontend runs on `http://localhost:4200`.*

