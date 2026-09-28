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

## Authentication & Credentials (Prof Only)
- **Single-Admin Username**: `prof`
- **Single-Admin Password**: `Prof@2026!`
- Protects:
  - The **Obsidian Editor** (`/editor`)
  - The **Ask Private Inbox** (`/ask` -> Private Inbox tab)
  - Edit/Delete actions on blog posts and academic notes

---

## Tech Stack & Architecture

### Backend: ASP.NET Core Web API (.NET 10)
- Clean / Layered Architecture (`c:\Users\mahmo\My Blog\backend`):
  - `Models/Entities.cs`: `User`, `BlogPost`, `AcademicNote`, `Question`
  - `Data/AppDbContext.cs`: EF Core with SQLite persistence (`prof.db`)
  - `Data/DbInitializer.cs`: Seeds admin credentials, real blog posts, course notes, and sample Q&A
  - `Services/TokenService.cs`: JWT Bearer authentication
  - `Controllers/`: `AuthController`, `BlogController`, `NotesController`, `QuestionsController`, `PortfolioController`

### Frontend: Angular (v19/20 Standalone)
- Component-based architecture with Angular Router & Reactive Forms (`c:\Users\mahmo\My Blog\frontend`):
  - `src/app/pages/home.component.ts`: Hero, real name, stats, and section portals
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

## How to Run Locally

### 1. Start the Backend (.NET Web API)
```powershell
cd "c:\Users\mahmo\My Blog\backend"
dotnet run --launch-profile http
```
*Backend runs on `http://localhost:5000` with Swagger OpenAPI support.*

### 2. Start the Frontend (Angular Dev Server)
```powershell
cd "c:\Users\mahmo\My Blog\frontend"
npm start -- --port 4200
```
*Frontend runs on `http://localhost:4200`.*
