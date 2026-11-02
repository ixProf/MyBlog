import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LiteratureService } from '../services/literature.service';
import { TranslationService } from '../services/translation.service';
import { LiteraryPiece } from '../models/models';
import { LITERATURE_INTRO } from '../data/literature-intro';

interface VersePreview {
  isTwoPart: boolean;
  first: string;
  second?: string;
}

@Component({
  selector: 'app-literature-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="literature-page">
      <!-- Faint Background Diacritics Texture -->
      <div class="diacritics-watermark" aria-hidden="true">
        <span class="mark m-1">َ</span>
        <span class="mark m-2">ُ</span>
        <span class="mark m-3">ِ</span>
        <span class="mark m-4">ّ</span>
        <span class="mark m-5">ْ</span>
        <span class="mark m-6">ً</span>
        <span class="mark m-7">ٌ</span>
        <span class="mark m-8">ٍ</span>
      </div>

      <div class="container">
        <!-- Landing Header with Manuscript Frame -->
        <header class="manuscript-header">
          <div class="corner-ornament top-left" aria-hidden="true">
            <svg width="32" height="32" viewBox="0 0 40 40" fill="none" stroke="currentColor">
              <path d="M4 36 V12 C4 7.57 7.57 4 12 4 H36" stroke-width="1.5" stroke-linecap="round"/>
              <path d="M10 36 V16 C10 12.68 12.68 10 16 10 H36" stroke-width="1" stroke-dasharray="2 2"/>
              <circle cx="16" cy="16" r="2.5" fill="currentColor"/>
              <path d="M7 7 L13 13" stroke-width="1"/>
            </svg>
          </div>
          <div class="corner-ornament top-right" aria-hidden="true">
            <svg width="32" height="32" viewBox="0 0 40 40" fill="none" stroke="currentColor">
              <path d="M36 36 V12 C36 7.57 32.43 4 28 4 H4" stroke-width="1.5" stroke-linecap="round"/>
              <path d="M30 36 V16 C30 12.68 27.32 10 24 10 H4" stroke-width="1" stroke-dasharray="2 2"/>
              <circle cx="24" cy="16" r="2.5" fill="currentColor"/>
              <path d="M33 7 L27 13" stroke-width="1"/>
            </svg>
          </div>
          <div class="corner-ornament bottom-left" aria-hidden="true">
            <svg width="32" height="32" viewBox="0 0 40 40" fill="none" stroke="currentColor">
              <path d="M4 4 V28 C4 32.43 7.57 36 12 36 H36" stroke-width="1.5" stroke-linecap="round"/>
              <path d="M10 4 V24 C10 27.32 12.68 30 16 30 H36" stroke-width="1" stroke-dasharray="2 2"/>
              <circle cx="16" cy="24" r="2.5" fill="currentColor"/>
              <path d="M7 33 L13 27" stroke-width="1"/>
            </svg>
          </div>
          <div class="corner-ornament bottom-right" aria-hidden="true">
            <svg width="32" height="32" viewBox="0 0 40 40" fill="none" stroke="currentColor">
              <path d="M36 4 V28 C36 32.43 32.43 36 28 36 H4" stroke-width="1.5" stroke-linecap="round"/>
              <path d="M30 4 V24 C30 27.32 27.32 30 24 30 H4" stroke-width="1" stroke-dasharray="2 2"/>
              <circle cx="24" cy="24" r="2.5" fill="currentColor"/>
              <path d="M33 33 L27 27" stroke-width="1"/>
            </svg>
          </div>

          <span class="manuscript-badge">{{ ts.t('literature.badge') }}</span>
          <h1 class="manuscript-title">{{ ts.t('literature.landing_title') }}</h1>
          <p class="manuscript-subtitle">{{ ts.t('literature.landing_subtitle') }}</p>

          <!-- Egyptian Arabic Intro rendered dir="rtl" in Arabic font -->
          @if (landingIntro) {
            <div class="intro-proclamation" dir="rtl">
              <p class="intro-lead-text">{{ landingIntro }}</p>
            </div>
          }
        </header>

        <!-- Ornamental Central Divider -->
        <div class="manuscript-divider" aria-hidden="true">
          <span class="divider-line"></span>
          <span class="divider-knot">✦</span>
          <span class="divider-line"></span>
        </div>

        <!-- Two Prominent Navigation Cards: Poetry & Prose -->
        <section class="portals-grid" aria-label="Literature Sections">
          <!-- Poetry Portal Card -->
          <a routerLink="/literature/poetry" class="portal-card poetry-portal card-interactive" id="portal-poetry">
            <div class="portal-ornament" aria-hidden="true">
              <svg width="48" height="48" viewBox="0 0 64 64" fill="none" stroke="currentColor">
                <path d="M12 52 L28 12 L36 12 L52 52" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M18 38 H46" stroke-width="1.25"/>
                <circle cx="32" cy="24" r="3" fill="currentColor" opacity="0.6"/>
                <path d="M24 52 C28 48 36 48 40 52" stroke-width="1.5"/>
              </svg>
            </div>
            <div class="portal-content">
              <span class="portal-eyebrow">{{ ts.t('literature.badge') }}</span>
              <h2 class="portal-title">{{ ts.t('literature.explore_poetry') }}</h2>
              <p class="portal-desc">{{ ts.t('literature.explore_poetry_desc') }}</p>
              <span class="portal-cta">
                <span>{{ ts.t('literature.read_poem') }}</span>
                <span class="arrow-glyph" aria-hidden="true">→</span>
              </span>
            </div>
            <div class="portal-hover-motif" aria-hidden="true">
              <svg width="90" height="90" viewBox="0 0 100 100" fill="currentColor">
                <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="3 3"/>
                <path d="M50 10 L54 38 L82 42 L60 58 L68 86 L50 70 L32 86 L40 58 L18 42 L46 38 Z" opacity="0.12"/>
              </svg>
            </div>
          </a>

          <!-- Prose Portal Card -->
          <a routerLink="/literature/prose" class="portal-card prose-portal card-interactive" id="portal-prose">
            <div class="portal-ornament" aria-hidden="true">
              <svg width="48" height="48" viewBox="0 0 64 64" fill="none" stroke="currentColor">
                <rect x="14" y="10" width="36" height="44" rx="3" stroke-width="1.5"/>
                <line x1="22" y1="20" x2="42" y2="20" stroke-width="1.5" stroke-linecap="round"/>
                <line x1="22" y1="28" x2="42" y2="28" stroke-width="1.5" stroke-linecap="round"/>
                <line x1="22" y1="36" x2="36" y2="36" stroke-width="1.5" stroke-linecap="round"/>
                <circle cx="41" cy="44" r="2.5" fill="currentColor" opacity="0.6"/>
              </svg>
            </div>
            <div class="portal-content">
              <span class="portal-eyebrow">{{ ts.t('literature.badge') }}</span>
              <h2 class="portal-title">{{ ts.t('literature.explore_prose') }}</h2>
              <p class="portal-desc">{{ ts.t('literature.explore_prose_desc') }}</p>
              <span class="portal-cta">
                <span>{{ ts.t('literature.read_piece') }}</span>
                <span class="arrow-glyph" aria-hidden="true">→</span>
              </span>
            </div>
            <div class="portal-hover-motif" aria-hidden="true">
              <svg width="90" height="90" viewBox="0 0 100 100" fill="currentColor">
                <rect x="15" y="15" width="70" height="70" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="3 3" transform="rotate(45 50 50)"/>
                <circle cx="50" cy="50" r="20" fill="none" stroke="currentColor" stroke-width="1" opacity="0.2"/>
              </svg>
            </div>
          </a>
        </section>

        <!-- Featured Verse Preview (Only shown if at least one poem exists) -->
        @if (newestPoem(); as featured) {
          @if (getVersePreview(featured.content); as verse) {
            <section class="featured-verse-section card" id="featured-verse-card">
              <div class="featured-verse-badge">
                <span class="verse-star">✦</span>
                <span>{{ ts.t('literature.featured_verse_label') }}</span>
                <span class="verse-star">✦</span>
              </div>

              <div class="featured-verse-display" dir="auto">
                @if (verse.isTwoPart) {
                  <div class="featured-hemistichs">
                    <span class="featured-part">{{ verse.first }}</span>
                    <span class="featured-ornament">✱</span>
                    <span class="featured-part">{{ verse.second }}</span>
                  </div>
                } @else {
                  <div class="featured-single">{{ verse.first }}</div>
                }
              </div>

              <div class="featured-verse-footer">
                <span class="featured-poem-title">— {{ featured.title }}</span>
                <a [routerLink]="['/literature/poetry', featured.display_number]" class="featured-link">
                  {{ ts.t('literature.read_poem') }}
                </a>
              </div>
            </section>
          }
        }

        <!-- Latest Published Pieces Preview (2-3 items across both types, hidden if empty) -->
        @if (latestPieces().length > 0) {
          <section class="latest-section">
            <div class="section-heading-row">
              <div class="heading-group">
                <h2 class="section-title">{{ ts.t('literature.latest_pieces_title') }}</h2>
                <p class="section-subtitle">{{ ts.t('literature.latest_pieces_subtitle') }}</p>
              </div>
            </div>

            <div class="pieces-stream">
              @for (piece of latestPieces(); track piece.id) {
                <article class="stream-item card card-interactive">
                  <div class="item-header">
                    <div class="item-type-badge" [class.badge-poem]="piece.type === 'poem'" [class.badge-prose]="piece.type === 'prose'">
                      {{ piece.type === 'poem' ? ts.t('literature.poetry_title') : ts.t('literature.prose_title') }}
                      #{{ piece.display_number }}
                    </div>
                    @if (piece.published_at) {
                      <time class="item-date">{{ piece.published_at | date:'mediumDate' }}</time>
                    }
                  </div>

                  <h3 class="item-title" dir="auto">
                    <a [routerLink]="['/literature', piece.type === 'poem' ? 'poetry' : 'prose', piece.display_number]">
                      {{ piece.title }}
                    </a>
                  </h3>

                  <!-- Preview: verse for poem, excerpt for prose -->
                  @if (piece.type === 'poem') {
                    @if (getVersePreview(piece.content); as vp) {
                      <div class="item-verse-preview" dir="auto">
                        @if (vp.isTwoPart) {
                          <div class="vp-hemistichs">
                            <span>{{ vp.first }}</span>
                            <span class="vp-ornament">✱</span>
                            <span>{{ vp.second }}</span>
                          </div>
                        } @else {
                          <div class="vp-single">{{ vp.first }}</div>
                        }
                      </div>
                    }
                  } @else {
                    <p class="item-excerpt" dir="auto">
                      {{ piece.excerpt || getExcerptFallback(piece.content) }}
                    </p>
                  }

                  <div class="item-footer">
                    <div class="item-heart-count">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                      </svg>
                      <span>{{ piece.hearts_count }}</span>
                    </div>

                    <a [routerLink]="['/literature', piece.type === 'poem' ? 'poetry' : 'prose', piece.display_number]" class="item-read-link">
                      {{ piece.type === 'poem' ? ts.t('literature.read_poem') : ts.t('literature.read_piece') }}
                    </a>
                  </div>
                </article>
              }
            </div>
          </section>
        }
      </div>
    </div>
  `,
  styles: [`
    .literature-page {
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
      opacity: 0.045;
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
    .m-2 { top: 22%; right: 8%; font-size: 6rem; transform: rotate(15deg); }
    .m-3 { top: 45%; left: 4%; font-size: 8rem; }
    .m-4 { top: 58%; right: 5%; font-size: 7.5rem; transform: rotate(8deg); }
    .m-5 { top: 78%; left: 9%; font-size: 6.5rem; }
    .m-6 { top: 86%; right: 12%; font-size: 7rem; }
    .m-7 { top: 35%; left: 48%; font-size: 9rem; transform: rotate(-5deg); }
    .m-8 { top: 70%; right: 45%; font-size: 6rem; }

    .container {
      position: relative;
      z-index: 1;
      max-width: 960px;
      margin: 0 auto;
      padding: 0 1.5rem;
    }

    /* Manuscript Frame Header */
    .manuscript-header {
      position: relative;
      text-align: center;
      padding: 4rem 3rem;
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-surface);
      margin-bottom: 2.75rem;
      animation: fadeIn 0.4s ease-out;
    }
    @media (prefers-reduced-motion: reduce) {
      .manuscript-header, .portal-card {
        animation: none !important;
      }
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .corner-ornament {
      position: absolute;
      color: var(--interactive-accent);
      opacity: 0.45;
      pointer-events: none;
    }
    .top-left { top: 12px; left: 12px; }
    .top-right { top: 12px; right: 12px; }
    .bottom-left { bottom: 12px; left: 12px; }
    .bottom-right { bottom: 12px; right: 12px; }

    .manuscript-badge {
      display: inline-block;
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--interactive-accent);
      margin-bottom: 0.75rem;
    }
    .manuscript-title {
      font-size: 3rem;
      font-family: var(--font-heading);
      color: var(--text-primary);
      margin: 0 0 0.85rem 0;
      line-height: 1.25;
      letter-spacing: -0.02em;
    }
    .manuscript-subtitle {
      font-size: 1.15rem;
      color: var(--text-secondary);
      margin: 0 auto 1.75rem auto;
      max-width: 620px;
      line-height: 1.6;
    }

    .intro-proclamation {
      margin: 1.5rem auto 0 auto;
      padding: 1.25rem 1.75rem;
      background: var(--bg-surface-tint);
      border-right: 3px solid var(--interactive-accent);
      border-radius: var(--radius-xs);
      max-width: 720px;
      font-family: var(--font-ar-body);
    }
    .intro-lead-text {
      font-size: 1.25rem;
      line-height: 2;
      color: var(--text-primary);
      margin: 0;
    }

    /* Ornamental Divider */
    .manuscript-divider {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1.25rem;
      margin: 2.75rem auto;
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

    /* Portals Grid (Poetry & Prose Cards) */
    .portals-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 2rem;
      margin-bottom: 3.5rem;
    }
    .portal-card {
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 2.75rem 2.25rem;
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-surface);
      text-decoration: none;
      color: inherit;
      overflow: hidden;
      transition: transform var(--transition-fast), box-shadow var(--transition-fast), border-color var(--transition-fast);
      animation: fadeIn 0.4s ease-out;
    }
    .portal-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-elevated);
      border-color: var(--interactive-accent);
    }
    .portal-ornament {
      color: var(--interactive-accent);
      opacity: 0.85;
      margin-bottom: 1.5rem;
      transition: transform var(--transition-fast);
    }
    .portal-card:hover .portal-ornament {
      transform: scale(1.06);
    }

    .portal-eyebrow {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-muted);
      display: block;
      margin-bottom: 0.35rem;
    }
    .portal-title {
      font-size: 1.9rem;
      font-family: var(--font-heading);
      color: var(--text-primary);
      margin: 0 0 0.75rem 0;
      line-height: 1.3;
    }
    .portal-desc {
      font-size: 1rem;
      color: var(--text-secondary);
      line-height: 1.65;
      margin: 0 0 1.75rem 0;
    }
    .portal-cta {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--interactive-accent);
      transition: gap var(--transition-fast);
    }
    .portal-card:hover .portal-cta {
      gap: 0.75rem;
    }
    .arrow-glyph {
      font-family: sans-serif;
      transition: transform var(--transition-fast);
    }
    .portal-card:hover .arrow-glyph {
      transform: translateX(3px);
    }

    /* Subtle background ornament reveal on card hover */
    .portal-hover-motif {
      position: absolute;
      bottom: -15px;
      right: -15px;
      color: var(--interactive-accent);
      opacity: 0;
      transform: scale(0.9);
      transition: opacity 0.3s ease, transform 0.3s ease;
      pointer-events: none;
    }
    .portal-card:hover .portal-hover-motif {
      opacity: 0.4;
      transform: scale(1);
    }

    /* Featured Verse Preview */
    .featured-verse-section {
      padding: 2.75rem 2.5rem;
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-surface);
      margin-bottom: 3.5rem;
      text-align: center;
    }
    .featured-verse-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--interactive-accent);
      margin-bottom: 1.5rem;
    }
    .verse-star {
      font-size: 0.7rem;
      opacity: 0.8;
    }
    .featured-verse-display {
      font-size: 1.55rem;
      line-height: 2.5;
      color: var(--text-primary);
      font-family: var(--font-ar-body);
      margin-bottom: 1.75rem;
    }
    .featured-hemistichs {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1.5rem;
      flex-wrap: wrap;
    }
    .featured-part {
      flex: 1;
      min-width: 200px;
    }
    .featured-ornament {
      color: var(--text-muted);
      opacity: 0.6;
      font-size: 1.15rem;
      user-select: none;
    }
    .featured-single {
      text-align: center;
    }
    .featured-verse-footer {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1.5rem;
      font-size: 0.95rem;
      border-top: 1px solid var(--border-subtle);
      padding-top: 1.25rem;
      flex-wrap: wrap;
    }
    .featured-poem-title {
      color: var(--text-secondary);
      font-family: var(--font-heading);
      font-weight: 600;
    }
    .featured-link {
      color: var(--interactive-accent);
      text-decoration: none;
      font-weight: 600;
    }
    .featured-link:hover {
      text-decoration: underline;
    }

    /* Latest Section */
    .latest-section {
      margin-top: 2rem;
    }
    .section-heading-row {
      margin-bottom: 1.75rem;
    }
    .section-title {
      font-size: 1.85rem;
      font-family: var(--font-heading);
      color: var(--text-primary);
      margin: 0 0 0.35rem 0;
    }
    .section-subtitle {
      font-size: 0.95rem;
      color: var(--text-secondary);
      margin: 0;
    }

    .pieces-stream {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
    }
    .stream-item {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 1.75rem;
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-surface);
      transition: transform var(--transition-fast), box-shadow var(--transition-fast), border-color var(--transition-fast);
    }
    .stream-item:hover {
      transform: translateY(-3px);
      box-shadow: var(--shadow-elevated);
      border-color: var(--interactive-accent);
    }
    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.85rem;
    }
    .item-type-badge {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.2rem 0.65rem;
      border-radius: var(--radius-full);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .badge-poem {
      background: rgba(224, 142, 88, 0.15);
      color: var(--interactive-accent);
    }
    .badge-prose {
      background: var(--bg-surface-tint);
      color: var(--text-secondary);
      border: 1px solid var(--border-subtle);
    }
    .item-date {
      font-size: 0.8rem;
      color: var(--text-muted);
    }
    .item-title {
      font-size: 1.35rem;
      font-family: var(--font-heading);
      margin: 0 0 0.85rem 0;
      line-height: 1.35;
    }
    .item-title a {
      color: var(--text-primary);
      text-decoration: none;
      transition: color var(--transition-fast);
    }
    .item-title a:hover {
      color: var(--interactive-accent);
    }

    .item-verse-preview {
      background: var(--bg-surface-tint);
      border-radius: var(--radius-xs);
      padding: 0.75rem 1rem;
      margin-bottom: 1.25rem;
      font-family: var(--font-ar-body);
      font-size: 0.95rem;
      line-height: 2;
      color: var(--text-secondary);
    }
    .vp-hemistichs {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }
    .vp-ornament {
      color: var(--text-muted);
      opacity: 0.6;
      font-size: 0.8rem;
    }
    .item-excerpt {
      font-size: 0.925rem;
      line-height: 1.65;
      color: var(--text-secondary);
      margin: 0 0 1.25rem 0;
    }

    .item-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid var(--border-subtle);
      padding-top: 0.85rem;
      margin-top: auto;
    }
    .item-heart-count {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.85rem;
      color: #e0245e;
    }
    .item-read-link {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--interactive-accent);
      text-decoration: none;
    }
    .item-read-link:hover {
      text-decoration: underline;
    }

    @media (max-width: 768px) {
      .portals-grid {
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }
      .manuscript-header {
        padding: 3rem 1.5rem;
      }
      .manuscript-title {
        font-size: 2.2rem;
      }
      .corner-ornament {
        display: none;
      }
      .featured-hemistichs {
        flex-direction: column;
        gap: 0.25rem;
      }
      .featured-ornament {
        display: none;
      }
    }
  `]
})
export class LiteratureLandingComponent implements OnInit {
  literatureService = inject(LiteratureService);
  ts = inject(TranslationService);

  readonly landingIntro = LITERATURE_INTRO.landing.intro;

  latestPieces = signal<LiteraryPiece[]>([]);
  newestPoem = signal<LiteraryPiece | null>(null);

  ngOnInit(): void {
    this.loadLatestPieces();
    this.loadNewestPoem();
  }

  loadLatestPieces(): void {
    // Fetch latest 3 pieces across both types
    this.literatureService.getPieces(undefined, undefined, undefined, 3).subscribe({
      next: (data) => {
        this.latestPieces.set(data || []);
      },
      error: (err) => console.error('Failed to load latest literature:', err)
    });
  }

  loadNewestPoem(): void {
    // Fetch latest 1 poem for the featured verse
    this.literatureService.getPieces('poem', undefined, undefined, 1).subscribe({
      next: (poems) => {
        if (poems && poems.length > 0) {
          this.newestPoem.set(poems[0]);
        }
      },
      error: (err) => console.error('Failed to load newest poem:', err)
    });
  }

  getVersePreview(content: string): VersePreview | null {
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

  getExcerptFallback(content: string): string {
    if (!content) return '';
    const clean = content.replace(/#+\s+/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim();
    if (clean.length <= 140) return clean;
    return clean.slice(0, 140) + '...';
  }
}

