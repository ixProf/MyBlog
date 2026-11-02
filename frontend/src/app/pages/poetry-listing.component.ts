import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LiteratureService } from '../services/literature.service';
import { AuthService } from '../services/auth.service';
import { TranslationService } from '../services/translation.service';
import { LiteraryPiece } from '../models/models';
import { LITERATURE_INTRO } from '../data/literature-intro';

interface VersePreview {
  isTwoPart: boolean;
  first: string;
  second?: string;
}

@Component({
  selector: 'app-poetry-listing',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="poetry-page">
      <!-- Faint Background Diacritics Texture -->
      <div class="diacritics-watermark" aria-hidden="true">
        <span class="mark m-1">َ</span>
        <span class="mark m-2">ُ</span>
        <span class="mark m-3">ِ</span>
        <span class="mark m-4">ّ</span>
        <span class="mark m-5">ْ</span>
      </div>

      <div class="container">
        <!-- Header -->
        <header class="page-header">
          <div class="header-left">
            <span class="section-label">{{ ts.t('literature.badge') }}</span>
            <h1 class="page-title">{{ ts.t('literature.poetry_title') }}</h1>
            <p class="page-subtitle">{{ ts.t('literature.poetry_subtitle') }}</p>
          </div>
          @if (authService.isAdmin()) {
            <a routerLink="/editor" [queryParams]="{ type: 'literature', litType: 'poem' }" class="btn btn-primary" id="btn-write-poem">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              <span>+ {{ ts.t('literature.poetry_title') }}</span>
            </a>
          }
        </header>

        <!-- Static Egyptian Arabic Intro Blocks (dir="rtl", Arabic font in both languages) -->
        <section class="intro-blocks-container" aria-label="About Poetry">
          @if (poetryIntro.intro) {
            <div class="intro-card card" dir="rtl">
              <h2 class="intro-card-title">{{ ts.t('literature.what_you_find_here') }}</h2>
              <p class="intro-card-text">{{ poetryIntro.intro }}</p>
            </div>
          }

          @if (poetryIntro.school) {
            <div class="intro-card card" dir="rtl">
              <h2 class="intro-card-title">{{ ts.t('literature.closest_school') }}</h2>
              <p class="intro-card-text">{{ poetryIntro.school }}</p>
            </div>
          }

          @if (poetryIntro.inspirations) {
            <div class="intro-card card" dir="rtl">
              <h2 class="intro-card-title">{{ ts.t('literature.what_inspires_me') }}</h2>
              <p class="intro-card-text">{{ poetryIntro.inspirations }}</p>
            </div>
          }

          @if (poetryIntro.favoritePoets && poetryIntro.favoritePoets.length > 0) {
            <div class="intro-card card poets-card" dir="rtl">
              <h2 class="intro-card-title">{{ ts.t('literature.favorite_poets') }}</h2>
              <div class="poets-chips-grid">
                @for (poet of poetryIntro.favoritePoets; track poet) {
                  <span class="poet-chip">{{ poet }}</span>
                }
              </div>
            </div>
          }
        </section>

        <!-- Ornamental Central Divider -->
        <div class="manuscript-divider" aria-hidden="true">
          <span class="divider-line"></span>
          <span class="divider-knot">✦</span>
          <span class="divider-line"></span>
        </div>

        <!-- Search & Filter Bar -->
        <div class="filter-bar">
          <div class="search-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              type="text"
              [placeholder]="ts.t('literature.search_poetry_placeholder')"
              [ngModel]="searchQuery()"
              (ngModelChange)="searchQuery.set($event)"
              class="search-input"
              id="poetry-search-input"
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
              {{ ts.t('literature.all_tags') }}
            </button>
            @for (tag of allTags(); track tag) {
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

        <!-- Poems Grid -->
        @if (isLoading()) {
          <div class="loading-state">
            <div class="spinner"></div>
          </div>
        } @else if (filteredPoems().length > 0) {
          <div class="poems-grid" id="poems-grid">
            @for (poem of filteredPoems(); track poem.id) {
              <article class="poem-card card card-interactive" [id]="'poem-card-' + poem.display_number">
                <div class="poem-card-header">
                  <div class="meta-row">
                    <span class="badge badge-peach">#{{ poem.display_number }}</span>
                    @if (poem.published_at) {
                      <time class="meta-date">{{ poem.published_at | date:'mediumDate' }}</time>
                    }
                  </div>
                  @if (authService.isAdmin()) {
                    <div class="admin-actions">
                      <a [routerLink]="['/editor']" [queryParams]="{ editId: poem.id, type: 'literature', litType: 'poem' }" class="action-link">{{ ts.t('blog.edit') }}</a>
                      <button type="button" class="action-link delete-link" (click)="onDelete(poem.id, $event)">{{ ts.t('blog.delete') }}</button>
                    </div>
                  }
                </div>

                <h2 class="poem-card-title" dir="auto">
                  <a [routerLink]="['/literature/poetry', poem.display_number]" class="title-link">{{ poem.title }}</a>
                </h2>

                <!-- First Verse Preview -->
                @if (getFirstVersePreview(poem.content); as preview) {
                  <div class="verse-preview-box" dir="auto">
                    @if (preview.isTwoPart) {
                      <div class="preview-hemistichs">
                        <span class="preview-part">{{ preview.first }}</span>
                        <span class="preview-ornament">✱</span>
                        <span class="preview-part">{{ preview.second }}</span>
                      </div>
                    } @else {
                      <div class="preview-single">{{ preview.first }}</div>
                    }
                  </div>
                }

                <div class="poem-card-footer">
                  <div class="tags-group">
                    @for (tag of getTagsList(poem.tags); track tag) {
                      <span class="tag-pill">{{ tag }}</span>
                    }
                  </div>

                  <div class="footer-stats">
                    <div class="heart-indicator" [title]="ts.t('literature.heart_btn_label')">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                      </svg>
                      <span>{{ poem.hearts_count }}</span>
                    </div>

                    <a [routerLink]="['/literature/poetry', poem.display_number]" class="read-link">
                      {{ ts.t('literature.read_poem') }}
                    </a>
                  </div>
                </div>
              </article>
            }
          </div>
        } @else {
          <div class="empty-state card">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="empty-icon"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            <h3>{{ ts.t('literature.empty_poetry_title') }}</h3>
            <p>{{ ts.t('literature.empty_poetry_desc') }}</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .poetry-page {
      padding: 3rem 0 6rem 0;
      min-height: 85vh;
      position: relative;
      overflow: hidden;
    }

    /* Diacritics Watermark Texture */
    .diacritics-watermark {
      position: absolute;
      inset: 0;
      pointer-events: none;
      user-select: none;
      z-index: 0;
      opacity: 0.04;
      font-family: var(--font-ar-body);
      font-size: 5rem;
      line-height: 1;
      color: var(--text-primary);
      overflow: hidden;
    }
    .dark .diacritics-watermark {
      opacity: 0.06;
    }
    .diacritics-watermark .mark {
      position: absolute;
      display: inline-block;
    }
    .m-1 { top: 10%; left: 5%; font-size: 7rem; transform: rotate(-10deg); }
    .m-2 { top: 25%; right: 7%; font-size: 6rem; transform: rotate(15deg); }
    .m-3 { top: 50%; left: 8%; font-size: 8rem; }
    .m-4 { top: 75%; right: 6%; font-size: 7rem; transform: rotate(8deg); }
    .m-5 { top: 88%; left: 12%; font-size: 6.5rem; }

    .container {
      position: relative;
      z-index: 1;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 2.5rem;
      gap: 1.5rem;
      flex-wrap: wrap;
      animation: fadeIn 0.4s ease-out;
    }
    @media (prefers-reduced-motion: reduce) {
      .page-header, .intro-card, .poem-card {
        animation: none !important;
      }
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .section-label {
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--interactive-accent);
      margin-bottom: 0.5rem;
      display: inline-block;
    }
    .page-title {
      font-size: 2.8rem;
      margin: 0 0 0.5rem 0;
      color: var(--text-primary);
      font-family: var(--font-heading);
      letter-spacing: -0.02em;
    }
    .page-subtitle {
      font-size: 1.05rem;
      color: var(--text-secondary);
      margin: 0;
      max-width: 600px;
      line-height: 1.6;
    }

    /* Intro Blocks (Egyptian Arabic static text) */
    .intro-blocks-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.25rem;
      margin-bottom: 2.5rem;
    }
    .intro-card {
      padding: 1.65rem 1.75rem;
      background-color: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-surface);
      font-family: var(--font-ar-body);
      animation: fadeIn 0.4s ease-out;
    }
    .intro-card-title {
      font-size: 1.15rem;
      font-family: var(--font-ar-heading);
      color: var(--interactive-accent);
      margin: 0 0 0.65rem 0;
      font-weight: 700;
    }
    .intro-card-text {
      font-size: 1.05rem;
      line-height: 1.9;
      color: var(--text-primary);
      margin: 0;
    }
    .poets-card {
      grid-column: 1 / -1;
    }
    .poets-chips-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }
    .poet-chip {
      font-size: 0.95rem;
      padding: 0.35rem 0.85rem;
      background-color: var(--bg-surface-tint);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-full);
      color: var(--text-primary);
      font-family: var(--font-ar-body);
      transition: border-color var(--transition-fast), background-color var(--transition-fast);
    }
    .poet-chip:hover {
      border-color: var(--interactive-accent);
      background-color: var(--bg-surface-accent);
    }

    /* Ornamental Divider */
    .manuscript-divider {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1.25rem;
      margin: 2.5rem auto;
      max-width: 480px;
      color: var(--border-strong);
    }
    .divider-line {
      flex: 1;
      height: 1px;
      background: currentColor;
      opacity: 0.6;
    }
    .divider-knot {
      font-size: 0.95rem;
      color: var(--interactive-accent);
      opacity: 0.75;
      user-select: none;
    }

    /* Filter Bar */
    .filter-bar {
      margin-bottom: 2.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .search-box {
      position: relative;
      width: 100%;
    }
    .search-box svg {
      position: absolute;
      top: 50%;
      inset-inline-start: 1.25rem;
      transform: translateY(-50%);
      color: var(--text-muted);
      pointer-events: none;
    }
    .search-input {
      width: 100%;
      padding: 0.85rem 1.25rem;
      padding-inline-start: 3.25rem;
      padding-inline-end: 2.5rem;
      background-color: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      color: var(--text-primary);
      font-size: 0.95rem;
      transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
    }
    .search-input:focus {
      outline: none;
      border-color: var(--interactive-accent);
      box-shadow: 0 0 0 3px rgba(204, 190, 177, 0.25);
    }
    .clear-search {
      position: absolute;
      top: 50%;
      inset-inline-end: 1rem;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 0.95rem;
      padding: 0.25rem 0.5rem;
    }

    .tags-scroller {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .tag-chip {
      background-color: var(--bg-surface-tint);
      border: 1px solid var(--border-subtle);
      color: var(--text-secondary);
      padding: 0.35rem 0.85rem;
      border-radius: var(--radius-full);
      font-size: 0.825rem;
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .tag-chip:hover {
      border-color: var(--border-color);
      color: var(--text-primary);
    }
    .tag-chip.active {
      background-color: var(--interactive-accent);
      color: #fff;
      border-color: var(--interactive-accent);
    }

    /* Grid */
    .poems-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 1.75rem;
    }
    .poem-card {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 1.85rem 2rem;
      border-radius: var(--radius-md);
      background-color: var(--bg-surface);
      border: 1px solid var(--border-color);
      box-shadow: var(--shadow-surface);
      transition: transform var(--transition-fast), box-shadow var(--transition-fast), border-color var(--transition-fast);
      animation: fadeIn 0.35s ease-out;
    }
    .poem-card:hover {
      transform: translateY(-3px);
      box-shadow: var(--shadow-elevated);
      border-color: var(--interactive-accent);
    }
    .poem-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    .meta-row {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }
    .meta-date {
      font-size: 0.825rem;
      color: var(--text-muted);
    }
    .admin-actions {
      display: flex;
      gap: 0.5rem;
      font-size: 0.8rem;
    }
    .action-link {
      color: var(--text-secondary);
      text-decoration: underline;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      font-size: 0.8rem;
    }
    .delete-link {
      color: #dc3545;
    }

    .poem-card-title {
      font-size: 1.45rem;
      font-family: var(--font-heading);
      margin: 0 0 1.25rem 0;
      line-height: 1.35;
    }
    .title-link {
      color: var(--text-primary);
      text-decoration: none;
      transition: color var(--transition-fast);
    }
    .title-link:hover {
      color: var(--interactive-accent);
    }

    /* Verse Preview */
    .verse-preview-box {
      background-color: var(--bg-surface-tint);
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-subtle);
      padding: 1.15rem 1.25rem;
      margin-bottom: 1.5rem;
      font-size: 1.05rem;
      line-height: 2.2;
      color: var(--text-secondary);
      font-family: var(--font-ar-body);
    }
    .preview-hemistichs {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
    }
    .preview-part {
      flex: 1;
      text-align: center;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .preview-ornament {
      color: var(--text-muted);
      opacity: 0.65;
      font-size: 0.9rem;
    }
    .preview-single {
      text-align: center;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* Card Footer */
    .poem-card-footer {
      border-top: 1px solid var(--border-subtle);
      padding-top: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }
    .tags-group {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
    }
    .tag-pill {
      font-size: 0.75rem;
      padding: 0.15rem 0.55rem;
      background-color: var(--bg-surface-tint);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-full);
      color: var(--text-muted);
    }
    .footer-stats {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .heart-indicator {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.85rem;
      color: #e0245e;
    }
    .read-link {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--interactive-accent);
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      transition: gap var(--transition-fast);
    }
    .read-link:hover {
      gap: 0.45rem;
    }

    /* Loading & Empty */
    .loading-state {
      display: flex;
      justify-content: center;
      padding: 4rem 0;
    }
    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      color: var(--text-secondary);
    }
    .empty-icon {
      color: var(--text-muted);
      margin-bottom: 1rem;
    }
    .empty-state h3 {
      font-size: 1.35rem;
      color: var(--text-primary);
      margin-bottom: 0.5rem;
    }

    @media (max-width: 640px) {
      .poems-grid {
        grid-template-columns: 1fr;
      }
      .page-title {
        font-size: 2rem;
      }
      .preview-hemistichs {
        flex-direction: column;
        gap: 0.25rem;
      }
      .preview-ornament {
        display: none;
      }
    }
  `]
})
export class PoetryListingComponent implements OnInit {
  literatureService = inject(LiteratureService);
  authService = inject(AuthService);
  ts = inject(TranslationService);

  readonly poetryIntro = LITERATURE_INTRO.poetry;

  poems = signal<LiteraryPiece[]>([]);
  searchQuery = signal<string>('');
  selectedTag = signal<string | null>(null);
  isLoading = signal<boolean>(true);

  ngOnInit(): void {
    this.loadPoems();
  }

  loadPoems(): void {
    this.isLoading.set(true);
    this.literatureService.getPieces('poem').subscribe({
      next: (data) => {
        this.poems.set(data || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load poems:', err);
        this.isLoading.set(false);
      }
    });
  }

  allTags = computed(() => {
    const set = new Set<string>();
    for (const p of this.poems()) {
      if (p.tags) {
        p.tags.split(',').forEach((t) => {
          const trimmed = t.trim();
          if (trimmed) set.add(trimmed);
        });
      }
    }
    return Array.from(set).sort();
  });

  filteredPoems = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const tag = this.selectedTag();

    return this.poems().filter((poem) => {
      const matchesTag = !tag || (poem.tags && poem.tags.toLowerCase().includes(tag.toLowerCase()));
      if (!matchesTag) return false;

      if (!q) return true;
      const inTitle = poem.title.toLowerCase().includes(q);
      const inTags = poem.tags ? poem.tags.toLowerCase().includes(q) : false;
      const inContent = poem.content.toLowerCase().includes(q);
      return inTitle || inTags || inContent;
    });
  });

  toggleTag(tag: string): void {
    if (this.selectedTag() === tag) {
      this.selectedTag.set(null);
    } else {
      this.selectedTag.set(tag);
    }
  }

  getFirstVersePreview(content: string): VersePreview | null {
    if (!content) return null;
    const lines = content.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length === 0) return null;
    const firstLine = lines[0];

    if (firstLine.includes('|')) {
      const parts = firstLine.split('|');
      return {
        isTwoPart: true,
        first: parts[0]?.trim() || '',
        second: parts[1]?.trim() || ''
      };
    }
    return {
      isTwoPart: false,
      first: firstLine
    };
  }

  getTagsList(tags: string | null | undefined): string[] {
    if (!tags) return [];
    return tags.split(',').map((t) => t.trim()).filter((t) => t.length > 0);
  }

  onDelete(id: number, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (confirm(this.ts.t('blog.delete_confirm'))) {
      this.literatureService.deletePiece(id).subscribe({
        next: () => {
          this.poems.update((list) => list.filter((p) => p.id !== id));
        },
        error: (err) => console.error('Failed to delete poem:', err)
      });
    }
  }
}
