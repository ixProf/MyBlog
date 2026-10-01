import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BlogService } from '../services/blog.service';
import { AuthService } from '../services/auth.service';
import { TranslationService } from '../services/translation.service';

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="blog-page">
      <div class="container">
        <!-- Header -->
        <div class="blog-header">
          <div class="header-left">
            <span class="section-label">{{ ts.t('blog.label') }}</span>
            <h1 class="page-title">{{ ts.t('blog.title') }}</h1>
            <p class="page-subtitle">
              {{ ts.t('blog.subtitle') }}
            </p>
          </div>
          @if (authService.isAdmin()) {
            <a routerLink="/editor" [queryParams]="{ type: 'blog' }" class="btn btn-primary" id="btn-write-post">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              <span>{{ ts.t('blog.write_new') }}</span>
            </a>
          }
        </div>

        <!-- Filter & Search Bar -->
        <div class="filter-bar">
          <div class="search-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input 
              type="text" 
              [placeholder]="ts.t('blog.search_placeholder')" 
              [ngModel]="searchQuery()"
              (ngModelChange)="searchQuery.set($event)"
              class="search-input"
              id="blog-search-input"
            />
            @if (searchQuery()) {
              <button class="clear-search" (click)="searchQuery.set('')">✕</button>
            }
          </div>

          <div class="tags-scroller">
            <button 
              type="button" 
              class="tag-chip" 
              [class.active]="selectedTag() === null" 
              (click)="selectedTag.set(null)"
            >
              {{ ts.t('blog.all_topics') }}
            </button>
            @for (tag of blogService.getAllTags(); track tag) {
              <button 
                type="button" 
                class="tag-chip" 
                [class.active]="selectedTag() === tag" 
                (click)="toggleTag(tag)"
              >
                {{ tag }}
              </button>
            }
          </div>
        </div>

        <!-- Blog Posts Grid -->
        @if (filteredPosts().length > 0) {
          <div class="posts-list">
            @for (post of filteredPosts(); track post.id) {
              <article class="blog-card card card-interactive" [id]="'post-card-' + post.slug">
                <div class="blog-card-header">
                  <div class="meta-row">
                    <span class="badge badge-peach">{{ post.readTimeMinutes }} {{ ts.t('blog.min_read') }}</span>
                    <time class="meta-date">{{ post.publishedAt | date:'mediumDate' }}</time>
                  </div>
                  @if (authService.isAdmin()) {
                    <div class="admin-actions">
                      <a [routerLink]="['/editor']" [queryParams]="{ editId: post.id, type: 'blog' }" class="action-link" [title]="ts.t('blog.edit_title')">{{ ts.t('blog.edit') }}</a>
                      <button type="button" class="action-link delete-link" (click)="onDelete(post.id, $event)" [title]="ts.t('blog.delete_title')">{{ ts.t('blog.delete') }}</button>
                    </div>
                  }
                </div>

                <h2 class="blog-post-title" dir="auto">
                  <a [routerLink]="['/blog', post.slug]" class="title-link">{{ post.title }}</a>
                </h2>

                <p class="blog-post-excerpt" dir="auto">{{ post.excerpt }}</p>

                <div class="blog-card-footer">
                  <div class="tags-group">
                    @for (t of post.tags.split(','); track t) {
                      @if (t.trim()) {
                        <span class="badge">{{ t.trim() }}</span>
                      }
                    }
                  </div>
                  <a [routerLink]="['/blog', post.slug]" class="read-more-link">
                    {{ ts.t('blog.read_article') }}
                  </a>
                </div>
              </article>
            }
          </div>
        } @else {
          <div class="empty-state card">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <h3>{{ ts.t('blog.no_posts') }}</h3>
            <button class="btn btn-secondary btn-sm" (click)="resetFilters()">{{ ts.t('blog.clear_filter') }}</button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .blog-page {
      padding: 3rem 0 5rem 0;
    }
    .blog-header {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      margin-bottom: 2.5rem;
      flex-wrap: wrap;
      gap: 1.5rem;
    }
    .section-label {
      font-size: 0.85rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-muted);
      margin-bottom: 0.5rem;
      display: block;
    }
    .page-title {
      font-size: 2.75rem;
      color: var(--text-primary);
      margin-bottom: 0.5rem;
    }
    .page-subtitle {
      font-size: 1.05rem;
      color: var(--text-secondary);
      max-width: 620px;
      line-height: 1.6;
    }
    .filter-bar {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      margin-bottom: 2.5rem;
    }
    .search-box {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1.15rem;
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      color: var(--text-muted);
    }
    .search-input {
      flex: 1;
      border: none;
      background: none;
      outline: none;
      font-family: var(--font-body);
      font-size: 1rem;
      color: var(--text-primary);
    }
    .clear-search {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--text-muted);
      font-size: 1rem;
    }
    .tags-scroller {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      overflow-x: auto;
      padding-bottom: 0.35rem;
    }
    .tag-chip {
      padding: 0.35rem 0.85rem;
      font-size: 0.85rem;
      border-radius: var(--radius-full);
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      cursor: pointer;
      white-space: nowrap;
      transition: all var(--transition-fast);
    }
    .tag-chip:hover {
      background-color: var(--bg-card-hover);
      color: var(--text-primary);
    }
    .tag-chip.active {
      background-color: var(--bg-tint-peach);
      border-color: var(--color-warm-peach);
      color: var(--text-primary);
      font-weight: 600;
    }
    .posts-list {
      display: flex;
      flex-direction: column;
      gap: 1.75rem;
    }
    .blog-card {
      padding: 2rem;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }
    .blog-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .meta-row {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }
    .meta-date {
      font-size: 0.85rem;
      color: var(--text-muted);
    }
    .admin-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .action-link {
      font-size: 0.82rem;
      color: var(--text-accent);
      cursor: pointer;
      background: none;
      border: none;
    }
    .delete-link:hover {
      color: #EF4444;
    }
    .blog-post-title {
      font-size: 1.55rem;
      color: var(--text-primary);
      line-height: 1.3;
    }
    .title-link:hover {
      color: #E08E58;
    }
    .blog-post-excerpt {
      font-size: 0.98rem;
      color: var(--text-secondary);
      line-height: 1.7;
    }
    .blog-card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 0.5rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-subtle);
      flex-wrap: wrap;
      gap: 0.75rem;
    }
    .tags-group {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
    }
    .read-more-link {
      font-size: 0.92rem;
      font-weight: 600;
      color: var(--text-accent);
    }
    .read-more-link:hover {
      text-decoration: underline;
    }
    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      color: var(--text-muted);
    }
  `]
})
export class BlogComponent implements OnInit {
  blogService = inject(BlogService);
  authService = inject(AuthService);
  ts = inject(TranslationService);

  searchQuery = signal<string>('');
  selectedTag = signal<string | null>(null);

  ngOnInit(): void {
    this.blogService.syncWithBackend().subscribe();
  }

  filteredPosts(): typeof this.blogService.posts extends () => infer T ? T : never {
    return this.blogService.getPosts(this.selectedTag() || undefined, this.searchQuery() || undefined);
  }

  toggleTag(tag: string): void {
    if (this.selectedTag() === tag) {
      this.selectedTag.set(null);
    } else {
      this.selectedTag.set(tag);
    }
  }

  resetFilters(): void {
    this.searchQuery.set('');
    this.selectedTag.set(null);
  }

  onDelete(id: number, e: Event): void {
    e.stopPropagation();
    if (confirm(this.ts.t('blog.delete_confirm'))) {
      this.blogService.deletePost(id).subscribe();
    }
  }
}
