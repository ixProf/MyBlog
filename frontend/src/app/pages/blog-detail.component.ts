import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { BlogService } from '../services/blog.service';
import { MarkdownService } from '../services/markdown.service';
import { AuthService } from '../services/auth.service';
import { BlogPost, TocItem } from '../models/models';
import { TableOfContentsComponent } from '../components/table-of-contents.component';

@Component({
  selector: 'app-blog-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, TableOfContentsComponent],
  template: `
    <div class="doc-article-page">
      <div class="container doc-container">
        <!-- Documentation Breadcrumb Trail -->
        <nav class="doc-breadcrumbs" aria-label="Breadcrumbs">
          <a routerLink="/" class="breadcrumb-link">Home</a>
          <span class="bc-sep">/</span>
          <a routerLink="/blog" class="breadcrumb-link">Blog</a>
          @if (primaryCategory()) {
            <span class="bc-sep">/</span>
            <span class="bc-category">{{ primaryCategory() }}</span>
          }
          <span class="bc-sep">/</span>
          <span class="bc-current">{{ post()?.title }}</span>
        </nav>

        @if (post()) {
          <!-- Documentation Layout: Two Columns (Main Content + Dedicated Sticky Sidebar) -->
          <div class="doc-article-layout">
            <!-- Column 1: Main Content Flowing directly on background -->
            <main class="doc-main-content">
              <!-- Plain Metadata Header (no boxed container) -->
              <header class="doc-article-header">
                <h1 class="doc-article-title">{{ post()!.title }}</h1>

                <div class="doc-meta-row">
                  <div class="author-snippet">
                    <span class="author-dot"></span>
                    <span class="author-name">Mahmoud Sayed Mohamed (Prof)</span>
                  </div>
                  <span class="meta-separator">&bull;</span>
                  <time class="meta-date">{{ post()!.publishedAt | date:'mediumDate' }}</time>
                  <span class="meta-separator">&bull;</span>
                  <span class="meta-read-time">{{ post()!.readTimeMinutes }} min read</span>
                  @if (authService.isAdmin()) {
                    <span class="meta-separator">&bull;</span>
                    <a [routerLink]="['/editor']" [queryParams]="{ editId: post()!.id, type: 'blog' }" class="edit-link">
                      Edit Article
                    </a>
                  }
                </div>

                <div class="doc-tags-row">
                  @for (tag of post()!.tags.split(','); track tag) {
                    @if (tag.trim()) {
                      <span class="badge">{{ tag.trim() }}</span>
                    }
                  }
                </div>
              </header>

              <div class="doc-divider"></div>

              <!-- Markdown Content flowing naturally on page background -->
              <div class="markdown-body doc-markdown" [innerHTML]="renderedContent()" dir="auto"></div>

              <!-- RELATED ARTICLES (Manually Curated by Prof) -->
              @if (relatedArticles().length > 0) {
                <section class="related-articles-section">
                  <div class="related-section-header">
                    <span class="related-label">Curated Suggestions</span>
                    <h2 class="related-title">Related Articles</h2>
                  </div>

                  <div class="related-cards-grid">
                    @for (rel of relatedArticles(); track rel.id) {
                      <a [routerLink]="['/blog', rel.slug]" class="related-card card card-interactive">
                        <div class="related-meta">
                          <span class="badge badge-peach">{{ rel.readTimeMinutes }} min read</span>
                          <time class="related-date">{{ rel.publishedAt | date:'mediumDate' }}</time>
                        </div>
                        <h3 class="related-card-title">{{ rel.title }}</h3>
                        <p class="related-card-excerpt">{{ rel.excerpt }}</p>
                        <span class="related-read-more">Read write-up &rarr;</span>
                      </a>
                    }
                  </div>
                </section>
              }

              <!-- Author Signature Box -->
              <footer class="doc-footer">
                <div class="doc-author-box card">
                  <div class="author-avatar">P</div>
                  <div class="author-text">
                    <h3 class="author-heading">Mahmoud Sayed Mohamed (Prof)</h3>
                    <p class="author-bio">
                      Junior Backend .NET Developer & Software Engineering Student from Assiut, Egypt.
                      Passionate about building production APIs on ASP.NET Core, database tuning, and distributed systems.
                    </p>
                    <div class="author-links">
                      <a href="https://linkedin.com/in/mahmoud-sayed-mohamed" target="_blank" rel="noopener noreferrer">LinkedIn</a>
                      <a href="https://github.com/ixProf" target="_blank" rel="noopener noreferrer">GitHub</a>
                      <a routerLink="/ask">Ask a Question</a>
                    </div>
                  </div>
                </div>
              </footer>
            </main>

            <!-- Column 2: Dedicated Sticky TOC Sidebar (Beside content, never overlaps text) -->
            <aside class="doc-toc-sidebar" aria-label="Table of contents">
              <app-table-of-contents [items]="tocItems()"></app-table-of-contents>
            </aside>
          </div>
        } @else {
          <div class="not-found card">
            <h2>Article Not Found</h2>
            <p>The requested write-up could not be located.</p>
            <a routerLink="/blog" class="btn btn-primary">Return to Blog</a>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .doc-article-page {
      padding: 2.25rem 0 6rem 0;
      position: relative;
    }
    .doc-container {
      max-width: 1240px;
    }
    /* Breadcrumb trail */
    .doc-breadcrumbs {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-bottom: 2rem;
      flex-wrap: wrap;
      user-select: none;
    }
    .breadcrumb-link {
      color: var(--text-secondary);
      transition: color var(--transition-fast);
      text-decoration: none;
    }
    .breadcrumb-link:hover {
      color: var(--text-primary);
      text-decoration: underline;
    }
    .bc-sep {
      color: var(--border-color);
    }
    .bc-category {
      color: var(--text-secondary);
    }
    .bc-current {
      color: var(--text-primary);
      font-weight: 500;
      max-width: 450px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* 2-Column Documentation Grid: Main Content + Dedicated Sidebar */
    .doc-article-layout {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 260px;
      gap: 3.5rem;
      align-items: start;
    }
    .doc-main-content {
      min-width: 0;
      max-width: 800px;
    }
    .doc-article-header {
      margin-bottom: 2rem;
    }
    .doc-article-title {
      font-size: 3rem;
      line-height: 1.18;
      color: var(--text-primary);
      margin-bottom: 1.15rem;
      letter-spacing: -0.01em;
    }
    .doc-meta-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.9rem;
      color: var(--text-muted);
      margin-bottom: 1.25rem;
      flex-wrap: wrap;
    }
    .author-snippet {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      color: var(--text-primary);
      font-weight: 500;
    }
    .author-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background-color: var(--color-dark-taupe);
    }
    :host-context(html.dark) .author-dot {
      background-color: #FFDBBB;
    }
    .meta-separator {
      color: var(--border-color);
    }
    .edit-link {
      color: var(--text-link);
      font-weight: 500;
      text-decoration: none;
    }
    .edit-link:hover {
      text-decoration: underline;
    }
    .doc-tags-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.45rem;
    }
    .doc-divider {
      border: none;
      height: 1px;
      background-color: var(--border-color);
      margin: 2.25rem 0 2.5rem 0;
    }
    .doc-markdown {
      margin-bottom: 4rem;
    }

    /* Dedicated TOC Column: Sticky beside content in its own grid column */
    .doc-toc-sidebar {
      width: 260px;
      position: sticky;
      top: 96px;
      align-self: start;
      max-height: calc(100vh - 120px);
      overflow-y: auto;
      scrollbar-width: thin;
      padding-left: 1.25rem;
      border-left: 1px solid var(--border-color);
    }

    /* Related Articles Section */
    .related-articles-section {
      margin-top: 4.5rem;
      padding-top: 3rem;
      border-top: 1px solid var(--border-color);
    }
    .related-section-header {
      margin-bottom: 1.75rem;
    }
    .related-label {
      font-size: 0.78rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-muted);
      display: block;
      margin-bottom: 0.25rem;
    }
    .related-title {
      font-size: 1.85rem;
      color: var(--text-primary);
    }
    .related-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
    }
    .related-card {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      padding: 1.6rem;
      height: 100%;
      text-decoration: none;
    }
    .related-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.8rem;
      color: var(--text-muted);
    }
    .related-card-title {
      font-size: 1.25rem;
      line-height: 1.35;
      color: var(--text-primary);
    }
    .related-card-excerpt {
      font-size: 0.9rem;
      color: var(--text-secondary);
      line-height: 1.6;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .related-read-more {
      font-size: 0.88rem;
      color: var(--text-link);
      font-weight: 500;
      margin-top: auto;
      padding-top: 0.5rem;
    }

    /* Footer Author Box */
    .doc-footer {
      margin-top: 4rem;
      padding-top: 2.5rem;
      border-top: 1px solid var(--border-subtle);
    }
    .doc-author-box {
      display: flex;
      gap: 1.5rem;
      align-items: flex-start;
      padding: 1.75rem;
      background-color: var(--bg-surface-tint);
    }
    .author-avatar {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-xs);
      background-color: var(--color-warm-peach);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      color: #2E2A26;
      font-weight: bold;
      flex-shrink: 0;
    }
    .author-heading {
      font-size: 1.2rem;
      margin-bottom: 0.35rem;
      color: var(--text-primary);
    }
    .author-bio {
      font-size: 0.92rem;
      color: var(--text-secondary);
      line-height: 1.65;
      margin-bottom: 0.85rem;
    }
    .author-links {
      display: flex;
      gap: 1rem;
      font-size: 0.88rem;
    }
    .author-links a {
      color: var(--text-link);
      font-weight: 500;
      text-decoration: none;
    }
    .author-links a:hover {
      text-decoration: underline;
    }
    .not-found {
      text-align: center;
      padding: 4rem 2rem;
    }

    /* Responsive Breakpoints */
    @media (max-width: 980px) {
      .doc-article-layout {
        grid-template-columns: 1fr;
        gap: 1.75rem;
      }
      .doc-toc-sidebar {
        width: 100%;
        position: static;
        max-height: none;
        padding-left: 0;
        border-left: none;
        order: -1;
      }
      .doc-main-content {
        max-width: 100%;
      }
    }
    @media (max-width: 650px) {
      .doc-article-title { font-size: 2.2rem; }
      .doc-author-box { flex-direction: column; }
    }
  `]
})
export class BlogDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private blogService = inject(BlogService);
  private markdownService = inject(MarkdownService);
  authService = inject(AuthService);

  post = signal<BlogPost | null>(null);
  renderedContent = signal<any>('');
  tocItems = signal<TocItem[]>([]);

  primaryCategory = () => {
    const p = this.post();
    if (!p || !p.tags) return null;
    const first = p.tags.split(',')[0]?.trim();
    return first || null;
  };

  relatedArticles = (): BlogPost[] => {
    const p = this.post();
    if (!p) return [];
    return this.blogService.getRelatedPosts(p);
  };

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');
      if (slug) {
        const found = this.blogService.getPostBySlug(slug);
        if (found) {
          this.post.set(found);
          this.renderedContent.set(this.markdownService.render(found.content));
          this.tocItems.set(this.markdownService.extractToc(found.content));
        }
      }
    });
  }
}
