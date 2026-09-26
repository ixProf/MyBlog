import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { AskService } from '../services/ask.service';
import { Question } from '../models/models';

@Component({
  selector: 'app-answer-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <main class="detail-page-wrapper">
      <div class="container-narrow">
        <!-- Top Back Navigation -->
        <div class="back-nav-row">
          <a routerLink="/ask" class="back-link">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            <span>Back to Q&amp;A</span>
          </a>
        </div>

        @if (isLoading()) {
          <div class="card loading-card">
            <p>Loading answer...</p>
          </div>
        } @else if (question()) {
          <!-- Main Detail Card -->
          <article class="detail-card card">
            <!-- Thread Banner if follow-up -->
            @if (question()?.parent_id) {
              <div class="thread-banner">
                <span class="thread-label">Follow-up to</span>
                <a
                  [routerLink]="['/ask/answers', question()?.parent_id]"
                  class="thread-link"
                  [title]="question()?.parent_question_text || 'View parent question'"
                >
                  &ldquo;{{ question()?.parent_question_text || 'Original Question' }}&rdquo;
                </a>
              </div>
            }

            <!-- Submitter info & date -->
            <header class="detail-card-header">
              <div class="submitter-pill">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <span>{{ submitterName() }}</span>
              </div>

              <time class="full-date-label">
                Answered on {{ formattedFullDate() }}
              </time>
            </header>

            <!-- Question Headline -->
            <h1 class="question-headline">
              {{ question()?.question_text }}
            </h1>

            <hr class="visual-divider" />

            <!-- Answer Section -->
            <section class="answer-section" aria-label="Prof's Answer">
              <div class="verified-author-badge">
                <span class="badge-dot">●</span>
                <span>Prof • Verified Answer</span>
              </div>

              <div class="answer-body">
                @for (para of answerParagraphs(); track $index) {
                  <p class="answer-paragraph">{{ para }}</p>
                }
              </div>
            </section>

            <!-- Bottom Action Bar -->
            <footer class="detail-action-bar">
              <div class="actions-left">
                <!-- Like Button -->
                <button
                  type="button"
                  (click)="onLike()"
                  [disabled]="hasLiked()"
                  class="action-btn like-btn"
                  [class.active]="hasLiked()"
                  [title]="hasLiked() ? 'Liked' : 'Like this answer'"
                  [attr.aria-label]="'Like question (' + (question()?.likes_count || 0) + ')'"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    [attr.fill]="hasLiked() ? 'currentColor' : 'none'"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                  <span>{{ question()?.likes_count || 0 }}</span>
                </button>

                <!-- Follow Up Button -->
                <a
                  [routerLink]="['/ask']"
                  [queryParams]="{ replyTo: question()?.id }"
                  fragment="ask-section"
                  class="action-btn follow-up-btn"
                  title="Ask a follow-up question"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 10 4 15 9 20"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/></svg>
                  <span>Follow up</span>
                </a>
              </div>

              <div class="actions-right">
                <!-- Share Button -->
                <button
                  type="button"
                  (click)="onShare()"
                  class="action-btn share-btn"
                  [class.copied]="copied()"
                  title="Copy direct link to this answer"
                >
                  @if (copied()) {
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    <span>Copied!</span>
                  } @else {
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                    <span>Share</span>
                  }
                </button>
              </div>
            </footer>
          </article>
        } @else {
          <div class="card not-found-card">
            <h2>Answer Not Found</h2>
            <p>The requested question does not exist or has not been answered yet.</p>
            <a routerLink="/ask" class="btn btn-primary" style="margin-top: 1rem;">Back to Q&amp;A</a>
          </div>
        }

        <!-- Floating Confirmation Toast -->
        @if (toastVisible()) {
          <div class="floating-toast" role="status" aria-live="polite">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            <span>Direct link copied to clipboard</span>
          </div>
        }
      </div>
    </main>
  `,
  styles: [`
    .detail-page-wrapper {
      padding: 2.5rem 0 6rem 0;
      position: relative;
    }
    .back-nav-row {
      margin-bottom: 1.5rem;
    }
    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      font-size: 0.9rem;
      color: var(--text-secondary);
      transition: color var(--transition-fast), transform var(--transition-fast);
    }
    .back-link:hover {
      color: var(--text-primary);
      transform: translateX(-2px);
    }

    /* Detail Card */
    .detail-card {
      background-color: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-surface);
      padding: 2.25rem 2.5rem;
    }

    /* Thread banner */
    .thread-banner {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-bottom: 1.25rem;
      padding: 0.5rem 0.85rem;
      background-color: var(--bg-surface-tint);
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-subtle);
    }
    .thread-label {
      font-weight: 600;
      color: var(--interactive-accent);
      text-transform: uppercase;
      font-size: 0.75rem;
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

    /* Header */
    .detail-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }
    .submitter-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background-color: var(--bg-surface-tint);
      border: 1px solid var(--border-color);
      padding: 0.25rem 0.65rem;
      border-radius: var(--radius-pill);
      font-size: 0.85rem;
      color: var(--text-secondary);
    }
    .full-date-label {
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    /* Question Headline */
    .question-headline {
      font-size: 1.65rem;
      line-height: 1.4;
      color: var(--text-primary);
      margin-bottom: 1.5rem;
    }

    .visual-divider {
      border: none;
      height: 1px;
      background-color: var(--border-subtle);
      margin: 1.5rem 0 1.75rem 0;
    }

    /* Answer section */
    .answer-section {
      margin-bottom: 2rem;
    }
    .verified-author-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      background-color: var(--tag-bg);
      color: var(--tag-text);
      font-size: 0.8rem;
      font-weight: 600;
      padding: 0.25rem 0.75rem;
      border-radius: var(--radius-pill);
      margin-bottom: 1.25rem;
      border: 1px solid var(--border-strong);
    }
    .badge-dot {
      color: var(--interactive-accent);
      font-size: 0.7rem;
    }
    .answer-body {
      font-size: 1.05rem;
      line-height: 1.8;
      color: var(--text-primary);
    }
    .answer-paragraph {
      margin-bottom: 1.25rem;
    }
    .answer-paragraph:last-child {
      margin-bottom: 0;
    }

    /* Bottom Action Bar */
    .detail-action-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding-top: 1.25rem;
      border-top: 1px solid var(--border-subtle);
      flex-wrap: wrap;
    }
    .actions-left, .actions-right {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.4rem 0.85rem;
      font-family: var(--font-primary);
      font-size: 0.88rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      background-color: var(--bg-surface);
      color: var(--text-secondary);
      cursor: pointer;
      transition: all var(--transition-fast);
      text-decoration: none;
    }
    .action-btn:hover:not(:disabled) {
      color: var(--text-primary);
      border-color: var(--border-strong);
      background-color: var(--bg-surface-tint);
    }
    .like-btn.active {
      color: #e11d48;
      border-color: rgba(225, 29, 72, 0.3);
      background-color: rgba(225, 29, 72, 0.08);
      cursor: default;
    }
    .share-btn.copied {
      color: #16a34a;
      border-color: rgba(22, 163, 74, 0.3);
      background-color: rgba(22, 163, 74, 0.08);
    }

    /* Floating Toast */
    .floating-toast {
      position: fixed;
      bottom: 2.5rem;
      left: 50%;
      transform: translateX(-50%);
      background-color: var(--text-primary);
      color: var(--bg-main);
      padding: 0.75rem 1.4rem;
      border-radius: var(--radius-pill);
      display: flex;
      align-items: center;
      gap: 0.6rem;
      font-size: 0.9rem;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
      z-index: 1000;
      animation: toastFadeIn 220ms ease;
    }
    @keyframes toastFadeIn {
      from { opacity: 0; transform: translate(-50%, 10px); }
      to { opacity: 1; transform: translate(-50%, 0); }
    }

    .loading-card, .not-found-card {
      text-align: center;
      padding: 3rem 1.5rem;
    }

    @media (max-width: 640px) {
      .detail-card {
        padding: 1.5rem 1.25rem;
      }
      .question-headline {
        font-size: 1.35rem;
      }
    }
  `]
})
export class AnswerDetailComponent implements OnInit {
  private askService = inject(AskService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  question = signal<Question | null>(null);
  isLoading = signal<boolean>(true);
  hasLiked = signal<boolean>(false);
  copied = signal<boolean>(false);
  toastVisible = signal<boolean>(false);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.loadQuestion(id);
      }
    });
  }

  loadQuestion(id: string): void {
    this.isLoading.set(true);
    this.askService.getQuestion(id).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res && res.question) {
          this.question.set(res.question);
          this.checkLikeState(res.question.id);
        } else {
          this.question.set(null);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.question.set(null);
        console.error('Failed to load answer detail:', err);
      }
    });
  }

  checkLikeState(id: string): void {
    if (typeof window !== 'undefined') {
      const liked = localStorage.getItem(`prof_liked_${id}`);
      this.hasLiked.set(Boolean(liked));
    }
  }

  onLike(): void {
    const q = this.question();
    if (!q || this.hasLiked()) return;

    q.likes_count += 1;
    this.hasLiked.set(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`prof_liked_${q.id}`, 'true');
    }

    this.askService.likeQuestion(q.id).subscribe({
      next: (res) => {
        if (res && typeof res.likes_count === 'number') {
          q.likes_count = res.likes_count;
        }
      },
      error: (err) => console.error('Like error:', err)
    });
  }

  onShare(): void {
    const q = this.question();
    if (!q || typeof window === 'undefined') return;

    const targetNum = q.display_number ?? q.id;
    const directUrl = `${window.location.origin}/ask/answers/${targetNum}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(directUrl).then(() => {
        this.copied.set(true);
        this.toastVisible.set(true);
        setTimeout(() => this.copied.set(false), 2500);
        setTimeout(() => this.toastVisible.set(false), 2500);
      });
    }
  }

  submitterName(): string {
    const q = this.question();
    if (!q) return 'Anonymous';
    if (q.is_anonymous || !q.asker_name?.trim()) return 'Anonymous';
    return q.asker_name.trim();
  }

  formattedFullDate(): string {
    const q = this.question();
    if (!q) return '';
    const dateStr = q.answered_at || q.created_at;
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  }

  answerParagraphs(): string[] {
    const q = this.question();
    if (!q || !q.answer_text) return [];
    return q.answer_text
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(Boolean);
  }
}
