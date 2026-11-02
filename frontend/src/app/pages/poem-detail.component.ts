import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { LiteratureService } from '../services/literature.service';
import { TranslationService } from '../services/translation.service';
import { LiteraryPiece } from '../models/models';

interface PoemLine {
  isStanzaBreak: boolean;
  isTwoPart: boolean;
  first: string;
  second?: string;
}

@Component({
  selector: 'app-poem-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <article class="poem-page">
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
          <a routerLink="/literature/poetry" class="back-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            <span>{{ ts.t('literature.back_to_poetry') }}</span>
          </a>
        </div>

        @if (isLoading()) {
          <div class="loading-state">
            <div class="spinner"></div>
          </div>
        } @else if (poem()) {
          <!-- Manuscript-style frame with double border and corner motifs -->
          <div class="poem-content-wrapper manuscript-frame">
            <div class="corner-motif top-left" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none" stroke="currentColor">
                <path d="M4 28 V10 C4 6.68 6.68 4 10 4 H28" stroke-width="1.25"/>
                <circle cx="10" cy="10" r="2" fill="currentColor"/>
              </svg>
            </div>
            <div class="corner-motif top-right" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none" stroke="currentColor">
                <path d="M28 28 V10 C28 6.68 25.32 4 22 4 H4" stroke-width="1.25"/>
                <circle cx="22" cy="10" r="2" fill="currentColor"/>
              </svg>
            </div>
            <div class="corner-motif bottom-left" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none" stroke="currentColor">
                <path d="M4 4 V22 C4 25.32 6.68 28 10 28 H28" stroke-width="1.25"/>
                <circle cx="10" cy="22" r="2" fill="currentColor"/>
              </svg>
            </div>
            <div class="corner-motif bottom-right" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none" stroke="currentColor">
                <path d="M28 4 V22 C28 25.32 25.32 28 22 28 H4" stroke-width="1.25"/>
                <circle cx="22" cy="22" r="2" fill="currentColor"/>
              </svg>
            </div>

            <!-- Poem Title (Large bold centered title) -->
            <h1 class="poem-title" dir="auto">{{ poem()!.title }}</h1>

            <!-- Thin Horizontal Divider Underneath -->
            <hr class="poem-divider" />

            <!-- Verses Container (Plain text, no Markdown) -->
            <div class="verses-container">
              @for (line of parsedVerses(); track $index) {
                @if (line.isStanzaBreak) {
                  <div class="stanza-break" aria-hidden="true"></div>
                } @else if (line.isTwoPart) {
                  <div class="verse-row" dir="auto">
                    <div class="verse-hemistich hemistich-first">{{ line.first }}</div>
                    <div class="verse-gutter"><span class="verse-ornament">✱</span></div>
                    <div class="verse-hemistich hemistich-second">{{ line.second }}</div>
                  </div>
                } @else {
                  <div class="verse-single" dir="auto">{{ line.first }}</div>
                }
              }
            </div>

            <!-- Bottom Divider -->
            <hr class="bottom-divider" />

            <!-- Optional Tags (Pills) -->
            @if (tags().length > 0) {
              <div class="poem-tags">
                @for (tag of tags(); track tag) {
                  <span class="tag-pill">{{ tag }}</span>
                }
              </div>
            }

            <!-- Bottom Action Bar (Heart + Share ONLY) -->
            <div class="poem-actions">
              <button
                type="button"
                (click)="onToggleHeart()"
                class="action-btn heart-btn"
                [class.active]="hasHearted()"
                [attr.aria-label]="ts.t('literature.heart_btn_label')"
                id="btn-poem-heart"
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
                <span class="heart-count">{{ poem()!.hearts_count }}</span>
              </button>

              <button
                type="button"
                (click)="onShare()"
                class="action-btn share-btn"
                [class.copied]="copied()"
                [attr.aria-label]="ts.t('literature.share_btn_label')"
                id="btn-poem-share"
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
            <h2>{{ ts.t('literature.poem_not_found_title') }}</h2>
            <p>{{ ts.t('literature.poem_not_found_desc') }}</p>
            <a routerLink="/literature/poetry" class="btn btn-secondary">{{ ts.t('literature.back_to_poetry') }}</a>
          </div>
        }
      </div>
    </article>
  `,
  styles: [`
    .poem-page {
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
    .m-1 { top: 8%; left: 6%; font-size: 7rem; transform: rotate(-10deg); }
    .m-2 { top: 25%; right: 7%; font-size: 6rem; transform: rotate(15deg); }
    .m-3 { top: 50%; left: 8%; font-size: 8rem; }
    .m-4 { top: 75%; right: 6%; font-size: 7rem; transform: rotate(8deg); }
    .m-5 { top: 88%; left: 12%; font-size: 6.5rem; }

    .container-narrow {
      position: relative;
      z-index: 1;
      max-width: 820px;
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

    /* Manuscript Frame: Thin double border with corner motifs */
    .poem-content-wrapper {
      position: relative;
      background-color: var(--bg-surface);
      border: 1px solid var(--border-color);
      outline: 1px solid var(--border-subtle);
      outline-offset: -6px;
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-surface);
      padding: 4rem 3.5rem;
    }

    .corner-motif {
      position: absolute;
      color: var(--interactive-accent);
      opacity: 0.45;
      pointer-events: none;
    }
    .top-left { top: 12px; left: 12px; }
    .top-right { top: 12px; right: 12px; }
    .bottom-left { bottom: 12px; left: 12px; }
    .bottom-right { bottom: 12px; right: 12px; }

    /* Poem Title */
    .poem-title {
      text-align: center;
      font-size: 2.75rem;
      font-weight: 700;
      font-family: var(--font-heading);
      color: var(--text-primary);
      margin: 0 0 1.75rem 0;
      line-height: 1.35;
      letter-spacing: -0.01em;
    }

    /* Thin Horizontal Divider */
    .poem-divider {
      border: 0;
      border-top: 1px solid var(--border-subtle);
      margin: 0 auto 3rem auto;
      width: 100%;
      opacity: 0.8;
    }

    /* Verses */
    .verses-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
      margin: 0 auto;
    }
    .verse-row {
      display: grid;
      grid-template-columns: 1fr 40px 1fr;
      align-items: center;
      width: 100%;
      margin-bottom: 0.65rem;
    }
    .verse-hemistich {
      text-align: center;
      font-size: 1.4rem;
      line-height: 2.8;
      color: var(--text-primary);
      font-family: var(--font-ar-body);
      word-break: normal;
      overflow-wrap: break-word;
      padding: 0 0.5rem;
    }
    .verse-gutter {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
    }
    .verse-ornament {
      color: var(--text-muted);
      opacity: 0.55;
      font-size: 1rem;
      user-select: none;
    }

    .verse-single {
      text-align: center;
      font-size: 1.4rem;
      line-height: 2.8;
      color: var(--text-primary);
      font-family: var(--font-ar-body);
      margin-bottom: 0.65rem;
      width: 100%;
      padding: 0 0.5rem;
    }
    .stanza-break {
      height: 2.25rem;
      width: 100%;
    }

    /* Bottom Divider & Tags */
    .bottom-divider {
      border: 0;
      border-top: 1px solid var(--border-subtle);
      margin: 3rem auto 1.5rem auto;
      width: 100%;
      opacity: 0.8;
    }
    .poem-tags {
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

    /* Action Bar (Heart + Share) */
    .poem-actions {
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
      .poem-content-wrapper {
        padding: 2.5rem 1.25rem;
        outline: none;
      }
      .corner-motif {
        display: none;
      }
      .poem-title {
        font-size: 2.1rem;
      }
      .verse-row {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
        margin-bottom: 1.25rem;
      }
      .verse-gutter {
        display: none;
      }
      .verse-hemistich {
        width: 100%;
        text-align: center;
        font-size: 1.2rem;
        line-height: 2.4;
      }
      .verse-single {
        font-size: 1.2rem;
        line-height: 2.4;
      }
    }
  `]
})
export class PoemDetailComponent implements OnInit {
  route = inject(ActivatedRoute);
  literatureService = inject(LiteratureService);
  ts = inject(TranslationService);

  poem = signal<LiteraryPiece | null>(null);
  isLoading = signal<boolean>(true);
  hasHearted = signal<boolean>(false);
  copied = signal<boolean>(false);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');
      if (idParam) {
        const num = parseInt(idParam, 10);
        if (!isNaN(num)) {
          this.loadPoem(num);
        } else {
          this.isLoading.set(false);
          this.poem.set(null);
        }
      }
    });
  }

  loadPoem(displayNumber: number): void {
    this.isLoading.set(true);
    this.literatureService.getPieceByDisplayNumber('poem', displayNumber).subscribe({
      next: (piece) => {
        this.poem.set(piece);
        this.isLoading.set(false);
        if (piece) {
          this.hasHearted.set(this.literatureService.hasHearted('poem', piece.id));
        }
      },
      error: (err) => {
        console.error('Failed to load poem:', err);
        this.poem.set(null);
        this.isLoading.set(false);
      }
    });
  }

  parsedVerses = computed<PoemLine[]>(() => {
    const content = this.poem()?.content;
    if (!content) return [];
    const rawLines = content.split(/\r?\n/);
    const result: PoemLine[] = [];

    for (const rawLine of rawLines) {
      const trimmed = rawLine.trim();
      if (!trimmed) {
        if (result.length > 0 && !result[result.length - 1].isStanzaBreak) {
          result.push({ isStanzaBreak: true, isTwoPart: false, first: '' });
        }
        continue;
      }

      if (trimmed.includes('|')) {
        const parts = trimmed.split('|');
        result.push({
          isStanzaBreak: false,
          isTwoPart: true,
          first: parts[0]?.trim() || '',
          second: parts[1]?.trim() || ''
        });
      } else {
        result.push({
          isStanzaBreak: false,
          isTwoPart: false,
          first: trimmed
        });
      }
    }

    while (result.length > 0 && result[result.length - 1].isStanzaBreak) {
      result.pop();
    }

    return result;
  });

  tags = computed(() => {
    const raw = this.poem()?.tags;
    if (!raw) return [];
    return raw.split(',').map((t) => t.trim()).filter((t) => t.length > 0);
  });

  onToggleHeart(): void {
    const p = this.poem();
    if (!p) return;

    const currentlyHearted = this.hasHearted();
    const action: 'add' | 'remove' = currentlyHearted ? 'remove' : 'add';

    // Optimistic update
    const nextCount = currentlyHearted ? Math.max(0, p.hearts_count - 1) : p.hearts_count + 1;
    this.poem.update((prev) => prev ? { ...prev, hearts_count: nextCount } : null);
    this.hasHearted.set(!currentlyHearted);
    this.literatureService.setHearted('poem', p.id, !currentlyHearted);

    this.literatureService.heartPiece(p.id, action).subscribe({
      next: (res) => {
        if (res && typeof res.hearts_count === 'number') {
          this.poem.update((prev) => prev ? { ...prev, hearts_count: res.hearts_count } : null);
        }
      },
      error: (err) => {
        console.error('Failed to heart poem:', err);
        // Rollback on error
        this.poem.update((prev) => prev ? { ...prev, hearts_count: p.hearts_count } : null);
        this.hasHearted.set(currentlyHearted);
        this.literatureService.setHearted('poem', p.id, currentlyHearted);
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
