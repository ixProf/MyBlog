import { Component, OnInit, inject, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { AskService } from '../services/ask.service';
import { Question, FeedStats, ProfileBio } from '../models/models';

@Component({
  selector: 'app-ask',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="ask-page-wrapper">
      <div class="container-narrow">
        <!-- 1. Hero Masthead -->
        <header class="ask-hero">
          <div class="hero-top-row">
            <span class="system-tag">Q&amp;A / DIRECT</span>
            <a routerLink="/ask/about" class="about-prof-link">
              <span>About Prof</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
            </a>
          </div>

          <h1 class="hero-title">
            <svg class="smiley-icon" width="34" height="34" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <path d="M23.5 7.8C19 4.3 11.2 4.8 7 10.2C2.8 15.8 4.2 24.2 10.2 27.2C16.2 30.2 24.8 27.2 27.5 20.5C29.8 14.5 26.2 7.5 19.8 6.2" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
              <ellipse cx="12.2" cy="13.6" rx="1.3" ry="1.7" fill="currentColor"/>
              <ellipse cx="19.8" cy="13.6" rx="1.3" ry="1.7" fill="currentColor"/>
              <path d="M11.8 18.8C13.6 22.4 18.4 22.4 20.2 18.8" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
            </svg>
            <span>Ask Prof<span class="brand-accent">.</span></span>
          </h1>

          <p class="hero-subtitle">
            {{ profile().name_en || 'Mahmoud Sayed Mohamed' }}
            <span class="accent-dot">•</span>
            Backend Developer
          </p>
        </header>

        <!-- 2. Primary Focal Point: Ask Question Card -->
        <section id="ask-section" class="ask-card card" aria-labelledby="ask-heading">
          <div class="card-intro">
            <h2 id="ask-heading" class="card-heading">
              What's on your mind<span class="brand-accent">?</span>
            </h2>
            <p class="card-subheading">
              Got a question? Ask away — anonymously. I read every question and publish the answers here.
            </p>
          </div>

          <!-- Success State -->
          @if (submitSuccess()) {
            <div class="success-box">
              <div class="success-icon-wrap">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h3 class="success-title">Question sent!</h3>
              <p class="success-desc">
                Thanks for reaching out. Prof will review your question and publish an answer on the feed soon.
              </p>
              <button type="button" (click)="resetForm()" class="btn btn-secondary btn-sm ask-another-btn">
                Ask another question
              </button>
            </div>
          } @else {
            <!-- Form View -->
            <form (ngSubmit)="onSubmitQuestion()" class="ask-form">
              <!-- Replying context banner -->
              @if (replyToQuestion()) {
                <div class="reply-banner">
                  <div class="reply-content">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 10 4 15 9 20"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/></svg>
                    <span>REPLYING TO: &ldquo;{{ replyToQuestion()?.question_text }}&rdquo;</span>
                  </div>
                  <button type="button" (click)="clearReplyTo()" class="cancel-reply-btn" title="Cancel replying">
                    Cancel
                  </button>
                </div>
              }

              <!-- Error Banner -->
              @if (errorMessage()) {
                <div class="error-banner">
                  {{ errorMessage() }}
                </div>
              }

              <!-- Large Textarea -->
              <div class="textarea-container">
                <textarea
                  #questionTextarea
                  id="landing-question-input"
                  class="prominent-textarea"
                  placeholder="Type your question here..."
                  rows="4"
                  maxlength="2000"
                  [(ngModel)]="questionText"
                  name="questionText"
                  required
                ></textarea>
              </div>

              <!-- Bottom Bar: Name Input + Live Counter + Submit Button -->
              <div class="form-bottom-bar">
                <div class="bottom-left-controls">
                  <input
                    type="text"
                    class="name-input"
                    placeholder="Name (optional)"
                    maxlength="40"
                    [(ngModel)]="askerName"
                    name="askerName"
                  />
                  <span class="meta-separator">•</span>
                  <span class="char-counter" [class.char-warning]="charactersLeft() < 100">
                    {{ charactersLeft() }} left
                  </span>
                </div>

                <button
                  type="submit"
                  class="btn btn-primary send-btn"
                  [disabled]="isSubmitting() || questionText.trim().length === 0"
                >
                  <span>{{ isSubmitting() ? 'Sending...' : 'Send question' }}</span>
                </button>
              </div>
            </form>
          }
        </section>

        <!-- 3. Subtle Visual Section Break -->
        <div class="section-divider">
          <div class="divider-line"></div>
          <span class="divider-label">
            Public Archive <span class="divider-dot">•</span> Q&amp;A
          </span>
          <div class="divider-line"></div>
        </div>

        <!-- 4. Filter Bar (Search + Sort Tabs) -->
        <section class="feed-section" aria-label="Public Q&A Feed">
          <div class="feed-controls-bar">
            <div class="controls-top">
              <h2 class="feed-title">Public Archive</h2>

              <!-- Sort Tabs -->
              <div class="tabs-group" role="tablist">
                <button
                  type="button"
                  class="tab-btn"
                  [class.active]="sortTab() === 'recent'"
                  (click)="setSortTab('recent')"
                  role="tab"
                  [attr.aria-selected]="sortTab() === 'recent'"
                >
                  Recent
                </button>
                <button
                  type="button"
                  class="tab-btn"
                  [class.active]="sortTab() === 'liked'"
                  (click)="setSortTab('liked')"
                  role="tab"
                  [attr.aria-selected]="sortTab() === 'liked'"
                >
                  Most Liked
                </button>
              </div>
            </div>

            <!-- Search input -->
            <div class="search-wrap">
              <svg class="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                type="text"
                class="search-input"
                placeholder="Search questions or answers..."
                [(ngModel)]="searchQuery"
                (ngModelChange)="onSearchChange($event)"
              />
              @if (searchQuery.trim().length > 0) {
                <button type="button" class="clear-search-btn" (click)="clearSearch()" aria-label="Clear search">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              }
            </div>
          </div>

          <!-- 5. Questions Feed List -->
          @if (filteredAndSortedQuestions().length > 0) {
            <div class="questions-list">
              @for (q of filteredAndSortedQuestions(); track q.id) {
                <article
                  [id]="'q-' + q.id"
                  class="question-card card"
                  [class.highlighted]="highlightedId() === q.id"
                  (click)="onCardClick($event, q)"
                >
                  <!-- Thread context banner if follow-up -->
                  @if (q.parent_id && q.parent_question_text) {
                    <div class="card-thread-banner">
                      <span class="thread-label">Follow-up to</span>
                      <a
                        [routerLink]="['/ask/answers', q.parent_id]"
                        (click)="$event.stopPropagation()"
                        class="thread-link"
                        [title]="q.parent_question_text"
                      >
                        &ldquo;{{ q.parent_question_text }}&rdquo;
                      </a>
                    </div>
                  }

                  <!-- Question Headline -->
                  <h3 class="question-headline">
                    <a
                      [routerLink]="['/ask/answers', q.display_number ?? q.id]"
                      (click)="$event.stopPropagation()"
                      class="headline-link"
                    >
                      {{ q.question_text }}
                    </a>
                  </h3>

                  <!-- Answer Preview Snippet -->
                  @if (q.answer_text) {
                    <p class="answer-snippet">
                      {{ getSnippet(q.answer_text) }}
                    </p>
                  }

                  <!-- Card Bottom Row -->
                  <div class="card-bottom">
                    <div class="bottom-meta">
                      <span class="answered-date">
                        Answered {{ formatDate(q.answered_at || q.created_at) }}
                      </span>

                      <!-- Like button -->
                      <button
                        type="button"
                        class="card-action-btn like-btn"
                        [class.active]="hasLiked(q.id)"
                        [disabled]="hasLiked(q.id)"
                        (click)="onLikeQuestion($event, q)"
                        [title]="hasLiked(q.id) ? 'Liked' : 'Like question'"
                        [attr.aria-label]="'Like question (' + q.likes_count + ')'"
                      >
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          [attr.fill]="hasLiked(q.id) ? 'currentColor' : 'none'"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                        <span>{{ q.likes_count }}</span>
                      </button>

                      <!-- Share button -->
                      <button
                        type="button"
                        class="card-action-btn share-btn"
                        (click)="onShareQuestion($event, q)"
                        title="Copy direct link"
                      >
                        @if (copiedMap()[q.id]) {
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                          <span class="copied-text">Copied!</span>
                        } @else {
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                          <span>Share</span>
                        }
                      </button>
                    </div>

                    @if (q.answer_text) {
                      <a
                        [routerLink]="['/ask/answers', q.display_number ?? q.id]"
                        (click)="$event.stopPropagation()"
                        class="read-answer-link"
                      >
                        <span>Read answer</span>
                        <span class="arrow-glyph">→</span>
                      </a>
                    }
                  </div>
                </article>
              }
            </div>
          } @else {
            <div class="empty-state card">
              <p class="empty-title">No answered questions found</p>
              <p class="empty-desc">
                {{ searchQuery.trim() ? 'Try a different search keyword.' : 'Be the first to ask a question above!' }}
              </p>
            </div>
          }
        </section>
      </div>
    </div>
  `,
  styles: [`
    .ask-page-wrapper {
      padding: 2.5rem 0 6rem 0;
    }

    /* Hero Header */
    .ask-hero {
      margin-bottom: 2rem;
    }
    .hero-top-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.85rem;
    }
    .system-tag {
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--text-muted);
    }
    .about-prof-link {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.85rem;
      color: var(--text-secondary);
      border: 1px solid var(--border-color);
      padding: 0.25rem 0.65rem;
      border-radius: var(--radius-sm);
      background-color: var(--bg-surface);
      transition: all var(--transition-fast);
    }
    .about-prof-link:hover {
      color: var(--text-primary);
      border-color: var(--border-strong);
      background-color: var(--bg-surface-tint);
    }
    .hero-title {
      font-size: 2.4rem;
      display: flex;
      align-items: center;
      gap: 0.65rem;
      margin-bottom: 0.35rem;
      color: var(--text-primary);
    }
    .smiley-icon {
      color: var(--interactive-accent);
      flex-shrink: 0;
    }
    .brand-accent {
      color: var(--interactive-accent);
    }
    .hero-subtitle {
      font-size: 1.05rem;
      color: var(--text-secondary);
    }
    .accent-dot {
      margin: 0 0.4rem;
      color: var(--color-warm-taupe);
    }

    /* Ask Question Card */
    .ask-card {
      padding: 1.75rem 2rem;
      background-color: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-surface);
      margin-bottom: 3rem;
      transition: border-color var(--transition-fast);
    }
    .card-intro {
      margin-bottom: 1.25rem;
    }
    .card-heading {
      font-size: 1.5rem;
      margin-bottom: 0.35rem;
      color: var(--text-primary);
    }
    .card-subheading {
      font-size: 0.95rem;
      color: var(--text-secondary);
      line-height: 1.5;
    }

    /* Replying context banner */
    .reply-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 0.6rem 0.85rem;
      background-color: var(--bg-surface-tint);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-sm);
      margin-bottom: 1rem;
      font-size: 0.85rem;
    }
    .reply-content {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--text-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .cancel-reply-btn {
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 0.8rem;
      padding: 0.2rem 0.5rem;
      border-radius: var(--radius-xs);
      transition: color var(--transition-fast);
      flex-shrink: 0;
    }
    .cancel-reply-btn:hover {
      color: var(--text-primary);
      text-decoration: underline;
    }

    /* Error banner */
    .error-banner {
      padding: 0.65rem 0.9rem;
      border-radius: var(--radius-sm);
      background-color: rgba(220, 38, 38, 0.1);
      color: #b91c1c;
      border: 1px solid rgba(220, 38, 38, 0.25);
      font-size: 0.88rem;
      margin-bottom: 1rem;
    }
    :host-context(html.dark) .error-banner {
      background-color: rgba(239, 68, 68, 0.15);
      color: #f87171;
      border-color: rgba(239, 68, 68, 0.3);
    }

    /* Textarea */
    .textarea-container {
      margin-bottom: 1rem;
    }
    .prominent-textarea {
      width: 100%;
      padding: 0.95rem 1.1rem;
      font-family: var(--font-primary);
      font-size: 1rem;
      line-height: 1.6;
      color: var(--text-primary);
      background-color: var(--bg-surface-tint);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      resize: vertical;
      min-height: 110px;
      transition: border-color var(--transition-fast), background-color var(--transition-fast);
      outline: none;
      box-sizing: border-box;
    }
    .prominent-textarea:focus {
      border-color: var(--interactive);
      background-color: var(--bg-surface);
      box-shadow: 0 0 0 3px rgba(168, 152, 138, 0.15);
    }

    /* Bottom Bar */
    .form-bottom-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .bottom-left-controls {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }
    .name-input {
      font-family: var(--font-primary);
      font-size: 0.88rem;
      padding: 0.45rem 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      background-color: var(--bg-surface-tint);
      color: var(--text-primary);
      outline: none;
      width: 160px;
      transition: all var(--transition-fast);
    }
    .name-input:focus {
      border-color: var(--interactive);
      background-color: var(--bg-surface);
    }
    .meta-separator {
      color: var(--text-muted);
    }
    .char-counter {
      font-size: 0.82rem;
      color: var(--text-muted);
    }
    .char-warning {
      color: #b91c1c;
      font-weight: bold;
    }
    .send-btn {
      padding: 0.55rem 1.35rem;
      font-size: 0.92rem;
    }

    /* Success State */
    .success-box {
      text-align: center;
      padding: 2.2rem 1.5rem;
    }
    .success-icon-wrap {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-pill);
      background-color: rgba(34, 197, 94, 0.15);
      color: #16a34a;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 0.85rem;
    }
    .success-title {
      font-size: 1.35rem;
      margin-bottom: 0.5rem;
      color: var(--text-primary);
    }
    .success-desc {
      font-size: 0.95rem;
      color: var(--text-secondary);
      max-width: 460px;
      margin: 0 auto 1.25rem auto;
      line-height: 1.6;
    }

    /* Section Break */
    .section-divider {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 2.5rem;
    }
    .divider-line {
      flex: 1;
      height: 1px;
      background-color: var(--border-color);
    }
    .divider-label {
      font-size: 0.8rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--text-muted);
      white-space: nowrap;
    }
    .divider-dot {
      margin: 0 0.25rem;
      color: var(--color-warm-taupe);
    }

    /* Feed Controls */
    .feed-controls-bar {
      margin-bottom: 1.75rem;
    }
    .controls-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
    }
    .feed-title {
      font-size: 1.35rem;
      color: var(--text-primary);
    }
    .tabs-group {
      display: flex;
      gap: 0.35rem;
      background-color: var(--bg-surface);
      border: 1px solid var(--border-color);
      padding: 0.2rem;
      border-radius: var(--radius-sm);
    }
    .tab-btn {
      padding: 0.35rem 0.85rem;
      font-family: var(--font-primary);
      font-size: 0.85rem;
      background: none;
      border: none;
      color: var(--text-secondary);
      border-radius: var(--radius-xs);
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .tab-btn:hover {
      color: var(--text-primary);
    }
    .tab-btn.active {
      background-color: var(--interactive);
      color: var(--interactive-text);
      font-weight: 500;
    }

    /* Search wrap */
    .search-wrap {
      position: relative;
      width: 100%;
    }
    .search-icon {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
      pointer-events: none;
    }
    .search-input {
      width: 100%;
      padding: 0.65rem 2.4rem 0.65rem 2.4rem;
      font-family: var(--font-primary);
      font-size: 0.95rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      background-color: var(--bg-surface);
      color: var(--text-primary);
      outline: none;
      box-sizing: border-box;
      transition: border-color var(--transition-fast), background-color var(--transition-fast);
    }
    .search-input:focus {
      border-color: var(--interactive);
      background-color: var(--bg-surface-tint);
    }
    .clear-search-btn {
      position: absolute;
      right: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 0.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .clear-search-btn:hover {
      color: var(--text-primary);
    }

    /* Questions List */
    .questions-list {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .question-card {
      padding: 1.5rem 1.75rem;
      background-color: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      transition: transform var(--transition-fast), border-color var(--transition-fast), box-shadow var(--transition-fast);
      cursor: pointer;
    }
    .question-card:hover {
      border-color: var(--card-hover-border);
      box-shadow: var(--shadow-card-hover);
      transform: translateY(-1px);
    }
    .question-card.highlighted {
      border-color: var(--interactive);
      box-shadow: 0 0 0 2px var(--color-warm-peach);
    }

    /* Thread banner */
    .card-thread-banner {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-bottom: 0.65rem;
    }
    .thread-label {
      font-weight: 600;
      color: var(--interactive-accent);
      text-transform: uppercase;
      font-size: 0.72rem;
      letter-spacing: 0.04em;
    }
    .thread-link {
      color: var(--text-secondary);
      font-style: italic;
      text-decoration: underline;
      text-underline-offset: 3px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .thread-link:hover {
      color: var(--text-primary);
    }

    /* Question Headline */
    .question-headline {
      font-size: 1.2rem;
      margin-bottom: 0.5rem;
      line-height: 1.45;
    }
    .headline-link {
      color: var(--text-primary);
      text-decoration: none;
      transition: color var(--transition-fast);
    }
    .headline-link:hover {
      color: var(--interactive-accent);
    }

    /* Answer Snippet */
    .answer-snippet {
      font-size: 0.95rem;
      color: var(--text-secondary);
      line-height: 1.6;
      margin-bottom: 1.15rem;
    }

    /* Bottom row */
    .card-bottom {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
      padding-top: 0.85rem;
      border-top: 1px solid var(--border-subtle);
    }
    .bottom-meta {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.82rem;
      color: var(--text-muted);
    }
    .card-action-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background: none;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-xs);
      padding: 0.25rem 0.55rem;
      font-family: var(--font-primary);
      font-size: 0.8rem;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .card-action-btn:hover:not(:disabled) {
      border-color: var(--interactive);
      color: var(--text-primary);
      background-color: var(--bg-surface-tint);
    }
    .like-btn.active {
      color: #e11d48;
      border-color: rgba(225, 29, 72, 0.3);
      background-color: rgba(225, 29, 72, 0.08);
      cursor: default;
    }
    .copied-text {
      color: #16a34a;
      font-weight: 500;
    }
    .read-answer-link {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.85rem;
      color: var(--text-secondary);
      font-weight: 500;
      transition: all var(--transition-fast);
    }
    .read-answer-link:hover {
      color: var(--text-primary);
      transform: translateX(2px);
    }
    .arrow-glyph {
      transition: transform var(--transition-fast);
    }
    .read-answer-link:hover .arrow-glyph {
      transform: translateX(3px);
    }

    /* Empty state */
    .empty-state {
      text-align: center;
      padding: 3rem 1.5rem;
    }
    .empty-title {
      font-size: 1.15rem;
      color: var(--text-primary);
      margin-bottom: 0.35rem;
    }
    .empty-desc {
      font-size: 0.9rem;
      color: var(--text-muted);
    }

    @media (max-width: 640px) {
      .ask-card {
        padding: 1.25rem 1rem;
      }
      .form-bottom-bar {
        flex-direction: column;
        align-items: stretch;
      }
      .bottom-left-controls {
        justify-content: space-between;
      }
      .name-input {
        width: 140px;
      }
      .send-btn {
        width: 100%;
      }
    }
  `]
})
export class AskComponent implements OnInit {
  private askService = inject(AskService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  @ViewChild('questionTextarea') questionTextarea?: ElementRef<HTMLTextAreaElement>;

  // Questions loaded once from backend
  allQuestions = signal<Question[]>([]);
  stats = signal<FeedStats>({ total_answered: 0, total_likes: 0 });
  profile = signal<ProfileBio>({
    alias_ar: 'بروف',
    alias_en: 'Prof',
    name_ar: 'محمود سيد محمد',
    name_en: 'Mahmoud Sayed Mohamed',
    bio_ar: '',
    bio_en: '',
    linkedin: '',
    github: ''
  });

  // Client-side search and sort tab
  searchQuery = '';
  sortTab = signal<'recent' | 'liked'>('recent');
  highlightedId = signal<string | null>(null);

  // Ask form state
  questionText = '';
  askerName = '';
  isSubmitting = signal<boolean>(false);
  submitSuccess = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  replyToQuestion = signal<Question | null>(null);

  // Copied share state map
  copiedMap = signal<Record<string, boolean>>({});

  charactersLeft = computed(() => 2000 - this.questionText.length);

  // 100% client-side filtered and sorted list (Requirement 3)
  filteredAndSortedQuestions = computed(() => {
    let list = [...this.allQuestions()];
    const query = this.searchQuery.toLowerCase().trim();

    if (query) {
      list = list.filter(q =>
        q.question_text.toLowerCase().includes(query) ||
        (q.answer_text && q.answer_text.toLowerCase().includes(query)) ||
        q.asker_name.toLowerCase().includes(query)
      );
    }

    if (this.sortTab() === 'liked') {
      list.sort((a, b) =>
        b.likes_count - a.likes_count ||
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else {
      list.sort((a, b) => {
        const timeA = a.answered_at ? new Date(a.answered_at).getTime() : new Date(a.created_at).getTime();
        const timeB = b.answered_at ? new Date(b.answered_at).getTime() : new Date(b.created_at).getTime();
        return timeB - timeA;
      });
    }

    return list;
  });

  ngOnInit(): void {
    // 1. Fetch answered questions once
    this.askService.getFeed().subscribe({
      next: (res) => {
        if (res && res.questions) {
          this.allQuestions.set(res.questions);
          if (res.stats) this.stats.set(res.stats);
          if (res.profile) this.profile.set(res.profile);

          // Check if replyTo query param is present
          this.checkReplyToQueryParam(res.questions);
        }
      },
      error: (err) => console.error('Failed to load feed:', err)
    });

    // Hash anchor scroll handling
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#q-')) {
        const id = hash.replace('#q-', '');
        this.highlightedId.set(id);
        setTimeout(() => {
          const el = document.getElementById(`q-${id}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 400);
      }
    }
  }

  private checkReplyToQueryParam(questions: Question[]): void {
    this.route.queryParams.subscribe((params) => {
      const replyToId = params['replyTo'];
      if (replyToId) {
        const target = questions.find(q => q.id === replyToId || q.display_number === Number(replyToId));
        if (target) {
          this.setReplyTo(target);
        } else {
          // If not in feed, fetch directly
          this.askService.getQuestion(replyToId).subscribe({
            next: (res) => {
              if (res && res.question) {
                this.setReplyTo(res.question);
              }
            }
          });
        }
      }
    });
  }

  setReplyTo(q: Question): void {
    this.replyToQuestion.set(q);
    setTimeout(() => {
      const askSection = document.getElementById('ask-section');
      if (askSection) {
        askSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      this.questionTextarea?.nativeElement.focus();
    }, 150);
  }

  clearReplyTo(): void {
    this.replyToQuestion.set(null);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { replyTo: null },
      queryParamsHandling: 'merge'
    });
  }

  setSortTab(tab: 'recent' | 'liked'): void {
    this.sortTab.set(tab);
  }

  onSearchChange(val: string): void {
    this.searchQuery = val;
  }

  clearSearch(): void {
    this.searchQuery = '';
  }

  onSubmitQuestion(): void {
    const text = this.questionText.trim();
    if (!text) {
      this.errorMessage.set('Please type a question before sending.');
      this.questionTextarea?.nativeElement.focus();
      return;
    }

    if (text.length < 8) {
      this.errorMessage.set('Please write a question with at least 8 characters.');
      this.questionTextarea?.nativeElement.focus();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const submission = {
      question_text: text,
      asker_name: this.askerName.trim() || undefined,
      is_anonymous: !this.askerName.trim(),
      parent_id: this.replyToQuestion()?.id || null
    };

    this.askService.submitQuestion(submission).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        if (res && res.success) {
          this.submitSuccess.set(true);
          this.questionText = '';
          this.askerName = '';
          this.clearReplyTo();
        } else {
          this.errorMessage.set(res?.error || 'Failed to submit question. Please try again.');
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        if (err.status === 429) {
          this.errorMessage.set('Too many submissions. Please wait a few minutes.');
        } else {
          this.errorMessage.set(err.error?.error || 'Network error. Please try again.');
        }
      }
    });
  }

  resetForm(): void {
    this.submitSuccess.set(false);
    this.errorMessage.set(null);
  }

  // Liking (Requirement 2)
  hasLiked(id: string): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean(localStorage.getItem(`prof_liked_${id}`));
  }

  onLikeQuestion(e: MouseEvent, q: Question): void {
    e.stopPropagation();
    if (this.hasLiked(q.id)) return;

    // Optimistic UI update
    q.likes_count += 1;
    localStorage.setItem(`prof_liked_${q.id}`, 'true');

    this.askService.likeQuestion(q.id).subscribe({
      next: (res) => {
        if (res && typeof res.likes_count === 'number') {
          q.likes_count = res.likes_count;
        }
      },
      error: (err) => console.error('Like error:', err)
    });
  }

  // Sharing (Requirement 5)
  onShareQuestion(e: MouseEvent, q: Question): void {
    e.stopPropagation();
    if (typeof window === 'undefined') return;

    const targetNum = q.display_number ?? q.id;
    const url = `${window.location.origin}/ask/answers/${targetNum}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        this.copiedMap.update(m => ({ ...m, [q.id]: true }));
        setTimeout(() => {
          this.copiedMap.update(m => {
            const copy = { ...m };
            delete copy[q.id];
            return copy;
          });
        }, 2000);
      });
    }
  }

  onCardClick(e: MouseEvent, q: Question): void {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) {
      return;
    }
    const targetNum = q.display_number ?? q.id;
    this.router.navigate(['/ask/answers', targetNum]);
  }

  getSnippet(text: string, maxLength = 175): string {
    const trimmed = text.trim();
    if (trimmed.length <= maxLength) return trimmed;
    const slice = trimmed.slice(0, maxLength);
    const lastSpace = slice.lastIndexOf(' ');
    const cleanSlice = lastSpace > 110 ? slice.slice(0, lastSpace) : slice;
    return `${cleanSlice}...`;
  }

  formatDate(dateStr?: string | null): string {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  }
}
