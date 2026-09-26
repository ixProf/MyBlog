import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BlogService } from '../services/blog.service';
import { NotesService } from '../services/notes.service';
import { PortfolioService } from '../services/portfolio.service';
import { QuestionsService } from '../services/questions.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="home-container">
      <!-- HERO SECTION -->
      <section class="hero-section">
        <div class="container">
          <div class="hero-layout">
            <div class="alias-badge">
              <span class="badge-dot"></span>
              <span>Personal Workshop & Technical Dispatch</span>
            </div>
            
            <h1 class="hero-title">
              My Name is Mahmoud, But You Can Call Me <span class="highlight-prof">Prof</span>.
            </h1>

            <p class="hero-bio">
              A personal space for deep-dive write-ups on production ASP.NET Core APIs, database execution plans, and university course summaries. Built with deliberate architectural clarity — no filler, just engineering notes and real systems.
            </p>

            <div class="hero-actions">
              <a routerLink="/portfolio" class="btn btn-primary" id="hero-portfolio-btn">
                <span>Explore Portfolio & Projects</span>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </a>
              <a routerLink="/blog" class="btn btn-secondary" id="hero-blog-btn">
                <span>Read Blog Articles</span>
              </a>
              <a routerLink="/ask" class="btn btn-outline" id="hero-ask-btn">
                <span>Ask a Question</span>
              </a>
            </div>

            <!-- Horizontal Stats Strip -->
            <div class="hero-stats-strip">
              <div class="stat-block">
                <span class="stat-num">200+</span>
                <span class="stat-label">Production Endpoints</span>
              </div>
              <div class="stat-block">
                <span class="stat-num">97%</span>
                <span class="stat-label">Latency Reduction (12ms → 0.65ms)</span>
              </div>
              <div class="stat-block">
                <span class="stat-num">66</span>
                <span class="stat-label">Real-Time POS Endpoints (SignalR)</span>
              </div>
              <div class="stat-block">
                <span class="stat-num">45+</span>
                <span class="stat-label">Clean Controllers Authored</span>
              </div>
            </div>

            <!-- Tech Tag Pills -->
            <div class="hero-tech-tags">
              <span class="badge badge-peach">C# 13</span>
              <span class="badge">.NET 10</span>
              <span class="badge">EF Core</span>
              <span class="badge">SQL Server</span>
              <span class="badge">Redis</span>
              <span class="badge">xUnit</span>
            </div>
          </div>
        </div>
      </section>

      <!-- FOUR PILLARS SECTION -->
      <section class="pillars-section">
        <div class="container">
          <div class="section-header">
            <span class="section-label">Architecture</span>
            <h2 class="section-title">The Four Main Pillars</h2>
            <p class="section-sub">A single unified system connecting long-form writing, course archives, public Q&A, and production code.</p>
          </div>

          <div class="pillars-grid">
            <!-- 1. Blog -->
            <a routerLink="/blog" class="pillar-card card card-interactive" id="pillar-blog">
              <div class="pillar-num-badge">01</div>
              <div class="pillar-body">
                <h3 class="pillar-title">The Blog</h3>
                <p class="pillar-desc">Deep-dive technical write-ups on async query tuning, transaction isolation, and Clean Architecture.</p>
                <span class="pillar-link">Browse {{ blogService.posts().length }} articles →</span>
              </div>
            </a>

            <!-- 2. Academic Notes -->
            <a routerLink="/notes" class="pillar-card card card-interactive" id="pillar-notes">
              <div class="pillar-num-badge">02</div>
              <div class="pillar-body">
                <h3 class="pillar-title">Academic Notes</h3>
                <p class="pillar-desc">Documentation-style course summaries for Operating Systems, Distributed Systems, and Database Engines.</p>
                <span class="pillar-link">Browse course summaries →</span>
              </div>
            </a>

            <!-- 3. Ask -->
            <a routerLink="/ask" class="pillar-card card card-interactive" id="pillar-ask">
              <div class="pillar-num-badge">03</div>
              <div class="pillar-body">
                <h3 class="pillar-title">Public Q&A</h3>
                <p class="pillar-desc">Anonymous visitor questions answered publicly by Prof on backend roadmaps, concurrency, and study tips.</p>
                <span class="pillar-link">Ask anonymously or read feed →</span>
              </div>
            </a>

            <!-- 4. Portfolio -->
            <a routerLink="/portfolio" class="pillar-card card card-interactive" id="pillar-portfolio">
              <div class="pillar-num-badge">04</div>
              <div class="pillar-body">
                <h3 class="pillar-title">Backend Portfolio</h3>
                <p class="pillar-desc">Live production systems (Alaris Nexus, Restaurant POS, University Attendance) and freelance delivery logs.</p>
                <span class="pillar-link">Inspect production code & specs →</span>
              </div>
            </a>
          </div>
        </div>
      </section>

      <!-- RECENT ARTICLES -->
      <section class="recent-section">
        <div class="container">
          <div class="recent-header">
            <div>
              <span class="section-label">Selected Articles</span>
              <h2 class="section-title">Latest Write-ups</h2>
            </div>
            <a routerLink="/blog" class="btn btn-outline btn-sm">View All Articles</a>
          </div>

          <div class="articles-list">
            @for (post of blogService.posts().slice(0, 3); track post.id) {
              <article class="article-entry card card-interactive">
                <div class="entry-meta">
                  <span class="badge badge-peach">{{ post.readTimeMinutes }} min read</span>
                  <time class="meta-time">{{ post.publishedAt | date:'mediumDate' }}</time>
                </div>
                <h3 class="entry-title">
                  <a [routerLink]="['/blog', post.slug]">{{ post.title }}</a>
                </h3>
                <p class="entry-excerpt">{{ post.excerpt }}</p>
                <div class="entry-footer">
                  <div class="entry-tags">
                    @for (tag of post.tags.split(','); track tag) {
                      @if (tag.trim()) {
                        <span class="badge">{{ tag.trim() }}</span>
                      }
                    }
                  </div>
                  <a [routerLink]="['/blog', post.slug]" class="entry-read-link">Read Note →</a>
                </div>
              </article>
            }
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .home-container {
      padding-top: 1rem;
    }
    .hero-section {
      padding: 3rem 0 4.5rem 0;
    }
    .hero-layout {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      max-width: 900px;
      margin: 0 auto;
    }
    .alias-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.35rem 0.85rem;
      border-radius: var(--radius-pill);
      background-color: var(--bg-surface-tint);
      border: 1px solid var(--border-color);
      font-size: 0.82rem;
      color: var(--text-secondary);
      margin-bottom: 1.5rem;
    }
    .badge-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background-color: var(--color-dark-taupe);
    }
    .hero-title {
      font-size: clamp(2.4rem, 4.5vw, 3.5rem);
      line-height: 1.15;
      margin-bottom: 1.25rem;
      color: var(--text-primary);
    }
    .highlight-prof {
      color: var(--color-dark-taupe);
      text-decoration: underline;
      text-decoration-color: var(--color-warm-peach);
      text-underline-offset: 6px;
    }
    :host-context(html.dark) .highlight-prof {
      color: #FFDBBB;
    }
    .hero-bio {
      font-size: 1.1rem;
      color: var(--text-secondary);
      line-height: 1.8;
      margin: 0 auto 2.25rem auto;
      max-width: 680px;
    }
    .hero-actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 0.85rem;
      margin-bottom: 3.5rem;
    }
    .hero-stats-strip {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 2rem;
      width: 100%;
      max-width: 860px;
      margin-bottom: 1.75rem;
    }
    .stat-block {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 0.35rem;
    }
    .stat-num {
      font-size: 2.25rem;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1.1;
    }
    .stat-label {
      font-size: 0.82rem;
      color: var(--text-secondary);
      line-height: 1.4;
      max-width: 180px;
    }
    .hero-tech-tags {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 0.5rem;
    }
    .pillars-section {
      padding: 4.5rem 0;
      border-top: 1px solid var(--border-color);
    }
    .section-header {
      margin-bottom: 2.5rem;
    }
    .section-label {
      font-size: 0.82rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-muted);
      margin-bottom: 0.4rem;
      display: block;
    }
    .section-title {
      font-size: 2.2rem;
      margin-bottom: 0.5rem;
    }
    .section-sub {
      font-size: 1.05rem;
      color: var(--text-secondary);
      max-width: 600px;
    }
    .pillars-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
    }
    .pillar-card {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      height: 100%;
    }
    .pillar-num-badge {
      font-size: 0.95rem;
      font-weight: bold;
      color: var(--color-dark-taupe);
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.5rem;
    }
    :host-context(html.dark) .pillar-num-badge {
      color: #FFDBBB;
    }
    .pillar-body {
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    .pillar-title {
      font-size: 1.35rem;
      margin-bottom: 0.5rem;
      color: var(--text-primary);
    }
    .pillar-desc {
      font-size: 0.92rem;
      color: var(--text-secondary);
      line-height: 1.65;
      margin-bottom: 1.25rem;
    }
    .pillar-link {
      font-size: 0.88rem;
      color: var(--text-link);
      font-weight: 500;
      margin-top: auto;
    }
    .recent-section {
      padding: 4.5rem 0;
      border-top: 1px solid var(--border-color);
    }
    .recent-header {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      margin-bottom: 2.5rem;
    }
    .articles-list {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .article-entry {
      padding: 2rem;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }
    .entry-meta {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }
    .meta-time {
      font-size: 0.85rem;
      color: var(--text-muted);
    }
    .entry-title {
      font-size: 1.6rem;
      line-height: 1.3;
    }
    .entry-title a:hover {
      color: var(--color-dark-taupe);
    }
    .entry-excerpt {
      font-size: 0.98rem;
      color: var(--text-secondary);
      line-height: 1.7;
    }
    .entry-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 0.5rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-subtle);
      flex-wrap: wrap;
      gap: 0.75rem;
    }
    .entry-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
    }
    .entry-read-link {
      font-size: 0.92rem;
      color: var(--text-link);
      font-weight: 500;
    }
    .entry-read-link:hover {
      text-decoration: underline;
    }
    @media (max-width: 768px) {
      .hero-stats-strip {
        grid-template-columns: repeat(2, 1fr);
        gap: 1.75rem 1.25rem;
      }
      .hero-title {
        font-size: 2.25rem;
      }
    }
    @media (max-width: 480px) {
      .hero-actions {
        flex-direction: column;
        width: 100%;
      }
      .hero-actions .btn {
        width: 100%;
        justify-content: center;
      }
      .hero-stats-strip {
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }
    }
  `]
})
export class HomeComponent {
  blogService = inject(BlogService);
  notesService = inject(NotesService);
  portfolioService = inject(PortfolioService);
  questionsService = inject(QuestionsService);
}
