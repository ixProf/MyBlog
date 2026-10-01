import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { BlogService } from '../services/blog.service';
import { AuthService } from '../services/auth.service';
import { TranslationService } from '../services/translation.service';
import { BlogPost } from '../models/models';

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
              (ngModelChange)="onSearchChange($event)"
              class="search-input"
              id="blog-search-input"
            />
            @if (searchQuery()) {
              <button class="clear-search" (click)="onClearSearch()">✕</button>
            }
          </div>

          <div class="tags-scroller">
            <button 
              type="button" 
              class="tag-chip" 
              [class.active]="selectedTag() === null" 
              (click)="onSelectAllTopics()"
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
            @for (post of paginatedPosts(); track post.id) {
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

          <!-- Pagination Controls -->
          @if (totalPages() > 1 || filteredPosts().length > 0) {
            <nav class="pagination-nav" [attr.aria-label]="ts.t('blog.pagination_label')">
              <button 
                type="button" 
                class="pagination-btn pagination-prev" 
                [disabled]="currentPage() <= 1"
                (click)="goToPage(currentPage() - 1)"
                [attr.aria-label]="ts.t('blog.pagination_prev')"
              >
                <svg class="pagination-arrow" [class.rtl-flip]="ts.isRtl()" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
                <span>{{ ts.t('blog.pagination_prev') }}</span>
              </button>

              <div class="pagination-numbers">
                @for (item of getPageNumbers(); track $index) {
                  @if (item === '...') {
                    <span class="pagination-ellipsis">…</span>
                  } @else {
                    <button 
                      type="button" 
                      class="pagination-number" 
                      [class.active]="item === currentPage()"
                      (click)="goToPage(+item)"
                      [attr.aria-current]="item === currentPage() ? 'page' : null"
                    >
                      {{ item }}
                    </button>
                  }
                }
              </div>

              <button 
                type="button" 
                class="pagination-btn pagination-next" 
                [disabled]="currentPage() >= totalPages()"
                (click)="goToPage(currentPage() + 1)"
                [attr.aria-label]="ts.t('blog.pagination_next')"
              >
                <span>{{ ts.t('blog.pagination_next') }}</span>
                <svg class="pagination-arrow" [class.rtl-flip]="ts.isRtl()" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </nav>
          }
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
    .pagination-nav {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-top: 3rem;
      flex-wrap: wrap;
    }
    .pagination-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.55rem 1.1rem;
      font-size: 0.9rem;
      font-family: var(--font-body, inherit);
      font-weight: 500;
      border-radius: var(--radius-md);
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      cursor: pointer;
      transition: all var(--transition-fast, 0.15s ease);
      user-select: none;
    }
    .pagination-btn:hover:not(:disabled) {
      background-color: var(--bg-card-hover);
      border-color: var(--color-warm-peach);
      color: var(--text-primary);
    }
    .pagination-btn:disabled {
      opacity: 0.35;
      cursor: not-allowed;
      pointer-events: none;
    }
    .pagination-numbers {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
    }
    .pagination-number {
      min-width: 2.35rem;
      height: 2.35rem;
      padding: 0 0.5rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 0.9rem;
      font-family: var(--font-body, inherit);
      font-weight: 500;
      border-radius: var(--radius-md);
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      cursor: pointer;
      transition: all var(--transition-fast, 0.15s ease);
    }
    .pagination-number:hover:not(.active) {
      background-color: var(--bg-card-hover);
      color: var(--text-primary);
    }
    .pagination-number.active {
      background-color: var(--bg-tint-peach, rgba(255, 219, 187, 0.18));
      border-color: var(--color-warm-peach);
      color: var(--text-primary);
      font-weight: 600;
      box-shadow: 0 0 12px rgba(255, 219, 187, 0.2);
    }
    .pagination-ellipsis {
      padding: 0 0.4rem;
      color: var(--text-muted);
      font-size: 0.9rem;
    }
    .pagination-arrow {
      transition: transform var(--transition-fast, 0.15s ease);
      flex-shrink: 0;
    }
    .rtl-flip {
      transform: rotate(180deg);
    }
  `]
})
export class BlogComponent implements OnInit, OnDestroy {
  blogService = inject(BlogService);
  authService = inject(AuthService);
  ts = inject(TranslationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  searchQuery = signal<string>('');
  selectedTag = signal<string | null>(null);
  currentPage = signal<number>(1);
  readonly pageSize = 6;

  private queryParamsSub?: Subscription;

  allFilteredPosts = computed<BlogPost[]>(() => {
    return this.blogService.getPosts(this.selectedTag() || undefined, this.searchQuery() || undefined);
  });

  totalPages = computed<number>(() => {
    const total = this.allFilteredPosts().length;
    return Math.max(1, Math.ceil(total / this.pageSize));
  });

  paginatedPosts = computed<BlogPost[]>(() => {
    const posts = this.allFilteredPosts();
    const total = this.totalPages();
    const page = Math.min(Math.max(1, this.currentPage()), total);
    const start = (page - 1) * this.pageSize;
    return posts.slice(start, start + this.pageSize);
  });

  ngOnInit(): void {
    this.blogService.syncWithBackend().subscribe();
    this.queryParamsSub = this.route.queryParamMap.subscribe(params => {
      const pageParam = params.get('page');
      const pageNum = pageParam ? parseInt(pageParam, 10) : 1;
      if (!isNaN(pageNum) && pageNum > 0) {
        this.currentPage.set(pageNum);
      } else {
        this.currentPage.set(1);
      }
    });
  }

  ngOnDestroy(): void {
    this.queryParamsSub?.unsubscribe();
  }

  filteredPosts(): BlogPost[] {
    return this.allFilteredPosts();
  }

  goToPage(page: number, scroll: boolean = true): void {
    const total = this.totalPages();
    const validPage = Math.min(Math.max(1, page), total);
    this.currentPage.set(validPage);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: validPage === 1 ? null : validPage },
      queryParamsHandling: 'merge'
    });
    if (scroll && typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
    this.goToPage(1, false);
  }

  onClearSearch(): void {
    this.searchQuery.set('');
    this.goToPage(1, false);
  }

  onSelectAllTopics(): void {
    this.selectedTag.set(null);
    this.goToPage(1);
  }

  toggleTag(tag: string): void {
    if (this.selectedTag() === tag) {
      this.selectedTag.set(null);
    } else {
      this.selectedTag.set(tag);
    }
    this.goToPage(1);
  }

  resetFilters(): void {
    this.searchQuery.set('');
    this.selectedTag.set(null);
    this.goToPage(1);
  }

  getPageNumbers(): (number | string)[] {
    const total = this.totalPages();
    const current = Math.min(Math.max(1, this.currentPage()), total);
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [];
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i);
      pages.push('...');
      pages.push(total);
    } else if (current >= total - 3) {
      pages.push(1);
      pages.push('...');
      for (let i = total - 4; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push('...');
      pages.push(current - 1);
      pages.push(current);
      pages.push(current + 1);
      pages.push('...');
      pages.push(total);
    }
    return pages;
  }

  onDelete(id: number, e: Event): void {
    e.stopPropagation();
    if (confirm(this.ts.t('blog.delete_confirm'))) {
      this.blogService.deletePost(id).subscribe(() => {
        if (this.currentPage() > this.totalPages()) {
          this.goToPage(this.totalPages());
        }
      });
    }
  }
}

