import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { LiteratureService } from '../services/literature.service';
import { MarkdownService } from '../services/markdown.service';
import { TranslationService } from '../services/translation.service';
import { LiteraryPiece } from '../models/models';

@Component({
  selector: 'app-prose-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <article class="prose-page">
      <!-- Faint Background Diacritics Texture -->
      <div class="diacritics-watermark" aria-hidden="true">
        <span class="mark m-1">َ</span>
        <span class="mark m-2">ُ</span>
        <span class="mark m-3">ِ</span>
        <span class="mark m-4">ّ</span>
        <span class="mark m-5">ْ</span>
      </div>

      <div class="container-narrow">
        <!-- Back Navigation -->
        <div class="back-nav">
          <a routerLink="/literature/prose" class="back-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            <span>{{ ts.t('literature.back_to_prose') }}</span>
          </a>
        </div>

        @if (isLoading()) {
          <div class="loading-state">
            <div class="spinner"></div>
          </div>
        } @else if (piece()) {
          <div class="prose-reading-container">
            <!-- Header -->
            <header class="prose-header">
              <h1 class="prose-title" dir="auto">{{ piece()!.title }}</h1>

              <div class="prose-meta">
                <span class="meta-pill">#{{ piece()!.display_number }}</span>
                @if (piece()!.published_at) {
                  <span class="meta-dot">•</span>
                  <time class="meta-date">{{ piece()!.published_at | date:'mediumDate' }}</time>
                }
              </div>
            </header>

            <hr class="prose-divider" />

            <!-- Prose Markdown Content -->
            <div
              class="prose-body markdown-content"
              dir="auto"
              [innerHTML]="renderedContent()"
            ></div>

            <hr class="bottom-divider" />

            <!-- Optional Tags (Pills) -->
            @if (tags().length > 0) {
              <div class="prose-tags">
                @for (tag of tags(); track tag) {
                  <span class="tag-pill">{{ tag }}</span>
                }
              </div>
            }

            <!-- Bottom Action Bar (Heart + Share ONLY) -->
            <div class="prose-actions">
              <button
                type="button"
                (click)="onToggleHeart()"
                class="action-btn heart-btn"
                [class.active]="hasHearted()"
                [attr.aria-label]="ts.t('literature.heart_btn_label')"
                id="btn-prose-heart"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  [attr.fill]="hasHearted() ? 'currentColor' : 'none'"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                <span class="heart-count">{{ piece()!.hearts_count }}</span>
              </button>

              <button
                type="button"
                (click)="onShare()"
                class="action-btn share-btn"
                [class.copied]="copied()"
                [attr.aria-label]="ts.t('literature.share_btn_label')"
                id="btn-prose-share"
              >
                @if (copied()) {
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>{{ ts.t('literature.copied') }}</span>
                } @else {
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                  <span>{{ ts.t('literature.share_btn_label') }}</span>
                }
              </button>
            </div>
          </div>
        } @else {
          <div class="not-found-card card">
            <h2>{{ ts.t('literature.prose_not_found_title') }}</h2>
            <p>{{ ts.t('literature.prose_not_found_desc') }}</p>
            <a routerLink="/literature/prose" class="btn btn-secondary">{{ ts.t('literature.back_to_prose') }}</a>
          </div>
        }
      </div>
    </article>
  `,
  styles: [`
    .prose-page {
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
    .m-1 { top: 10%; left: 6%; font-size: 7rem; transform: rotate(-10deg); }
    .m-2 { top: 30%; right: 7%; font-size: 6rem; transform: rotate(15deg); }
    .m-3 { top: 55%; left: 8%; font-size: 8rem; }
    .m-4 { top: 78%; right: 6%; font-size: 7rem; transform: rotate(8deg); }
    .m-5 { top: 90%; left: 12%; font-size: 6.5rem; }

    .container-narrow {
      position: relative;
      z-index: 1;
      max-width: 800px;
      margin: 0 auto;
      padding: 0 1.5rem;
    }

    .back-nav {
      margin-bottom: 2.5rem;
    }
    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--text-secondary);
      font-size: 0.95rem;
      font-weight: 500;
      text-decoration: none;
      transition: color var(--transition-fast), transform var(--transition-fast);
    }
    .back-link:hover {
      color: var(--text-primary);
      transform: translateX(-2px);
    }

    .prose-reading-container {
      background-color: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-surface);
      padding: 3.5rem 3.5rem;
    }

    /* Header */
    .prose-header {
      margin-bottom: 2rem;
      text-align: center;
    }
    .prose-title {
      font-size: 2.5rem;
      font-weight: 700;
      font-family: var(--font-heading);
      color: var(--text-primary);
      margin: 0 0 1rem 0;
      line-height: 1.35;
      letter-spacing: -0.01em;
    }
    .prose-meta {
      display: inline-flex;
      align-items: center;
      gap: 0.65rem;
      font-size: 0.85rem;
      color: var(--text-muted);
    }
    .meta-pill {
      font-weight: 600;
      color: var(--interactive-accent);
    }
    .meta-dot {
      color: var(--border-color);
    }

    /* Dividers */
    .prose-divider {
      border: 0;
      border-top: 1px solid var(--border-subtle);
      margin: 0 auto 2.5rem auto;
      width: 100%;
      opacity: 0.8;
    }
    .bottom-divider {
      border: 0;
      border-top: 1px solid var(--border-subtle);
      margin: 3rem auto 1.5rem auto;
      width: 100%;
      opacity: 0.8;
    }

    /* Markdown Body */
    .prose-body {
      font-size: 1.15rem;
      line-height: 2;
      color: var(--text-primary);
      margin-bottom: 2.5rem;
    }
    .prose-body p {
      margin-bottom: 1.5rem;
    }

    /* Tags */
    .prose-tags {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 0.5rem;
      margin-bottom: 2rem;
    }
    .tag-pill {
      font-size: 0.8rem;
      padding: 0.25rem 0.75rem;
      background-color: var(--bg-surface-tint);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-full);
      color: var(--text-muted);
    }

    /* Actions (Heart + Share) */
    .prose-actions {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1.25rem;
      padding-top: 0.5rem;
    }
    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.65rem 1.25rem;
      border-radius: var(--radius-full);
      border: 1px solid var(--border-color);
      background-color: var(--bg-surface);
      color: var(--text-secondary);
      font-size: 0.95rem;
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition-fast);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }
    .action-btn:hover {
      border-color: var(--interactive-accent);
      color: var(--text-primary);
      transform: translateY(-1px);
    }
    .heart-btn.active {
      background-color: rgba(224, 36, 94, 0.08);
      border-color: #e0245e;
      color: #e0245e;
    }
    .heart-btn.active svg {
      fill: #e0245e;
    }
    .share-btn.copied {
      background-color: rgba(46, 125, 50, 0.08);
      border-color: #2e7d32;
      color: #2e7d32;
    }

    /* Loading & Not Found */
    .loading-state {
      display: flex;
      justify-content: center;
      padding: 6rem 0;
    }
    .not-found-card {
      text-align: center;
      padding: 4rem 2rem;
    }
    .not-found-card h2 {
      margin-bottom: 0.75rem;
    }
    .not-found-card p {
      color: var(--text-secondary);
      margin-bottom: 2rem;
    }

    @media (max-width: 640px) {
      .prose-reading-container {
        padding: 2.25rem 1.25rem;
      }
      .prose-title {
        font-size: 2rem;
      }
      .prose-body {
        font-size: 1.05rem;
        line-height: 1.85;
      }
    }
  `]
})
export class ProseDetailComponent implements OnInit {
  route = inject(ActivatedRoute);
  literatureService = inject(LiteratureService);
  markdownService = inject(MarkdownService);
  ts = inject(TranslationService);

  piece = signal<LiteraryPiece | null>(null);
  renderedContent = signal<any>('');
  isLoading = signal<boolean>(true);
  hasHearted = signal<boolean>(false);
  copied = signal<boolean>(false);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');
      if (idParam) {
        const num = parseInt(idParam, 10);
        if (!isNaN(num)) {
          this.loadPiece(num);
        } else {
          this.isLoading.set(false);
          this.piece.set(null);
        }
      }
    });
  }

  loadPiece(displayNumber: number): void {
    this.isLoading.set(true);
    this.literatureService.getPieceByDisplayNumber('prose', displayNumber).subscribe({
      next: (piece) => {
        this.piece.set(piece);
        if (piece) {
          this.renderedContent.set(this.markdownService.render(piece.content));
          this.hasHearted.set(this.literatureService.hasHearted('prose', piece.id));
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load prose piece:', err);
        this.piece.set(null);
        this.isLoading.set(false);
      }
    });
  }

  tags = computed(() => {
    const raw = this.piece()?.tags;
    if (!raw) return [];
    return raw.split(',').map((t) => t.trim()).filter((t) => t.length > 0);
  });

  onToggleHeart(): void {
    const p = this.piece();
    if (!p) return;

    const currentlyHearted = this.hasHearted();
    const action: 'add' | 'remove' = currentlyHearted ? 'remove' : 'add';

    const nextCount = currentlyHearted ? Math.max(0, p.hearts_count - 1) : p.hearts_count + 1;
    this.piece.update((prev) => prev ? { ...prev, hearts_count: nextCount } : null);
    this.hasHearted.set(!currentlyHearted);
    this.literatureService.setHearted('prose', p.id, !currentlyHearted);

    this.literatureService.heartPiece(p.id, action).subscribe({
      next: (res) => {
        if (res && typeof res.hearts_count === 'number') {
          this.piece.update((prev) => prev ? { ...prev, hearts_count: res.hearts_count } : null);
        }
      },
      error: (err) => {
        console.error('Failed to heart prose:', err);
        this.piece.update((prev) => prev ? { ...prev, hearts_count: p.hearts_count } : null);
        this.hasHearted.set(currentlyHearted);
        this.literatureService.setHearted('prose', p.id, currentlyHearted);
      }
    });
  }

  onShare(): void {
    if (typeof window === 'undefined') return;
    const url = window.location.href;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        this.copied.set(true);
        setTimeout(() => this.copied.set(false), 2000);
      }).catch((err) => console.error('Failed to copy URL:', err));
    }
  }
}
