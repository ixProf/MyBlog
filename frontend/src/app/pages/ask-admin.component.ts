import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AskService } from '../services/ask.service';
import { ThemeService } from '../services/theme.service';
import { Question } from '../models/models';

@Component({
  selector: 'app-ask-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <main class="admin-page-wrapper">
      <div class="container-narrow">
        <!-- Toast Notification -->
        @if (feedbackToast()) {
          <div class="floating-toast" role="status" aria-live="polite">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            <span>{{ feedbackToast() }}</span>
          </div>
        }

        <!-- 1. Logged Out State: Password Form -->
        @if (isAuthenticated() === false) {
          <div class="login-wrapper">
            <div class="card login-card">
              <div class="login-header">
                <div class="lock-icon-wrap">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
                <h1 class="login-title">
                  Ask Prof<span class="brand-accent">.</span> Admin
                </h1>
                <p class="login-subtitle">
                  Enter master password to access the moderation inbox.
                </p>
              </div>

              @if (authError()) {
                <div class="error-banner">
                  {{ authError() }}
                </div>
              }

              <form (ngSubmit)="handleLogin()" class="login-form">
                <div class="form-group">
                  <label for="admin-password">Password</label>
                  <input
                    id="admin-password"
                    type="password"
                    class="input-password"
                    placeholder="Enter password..."
                    [(ngModel)]="passwordInput"
                    name="password"
                    autocomplete="current-password"
                    required
                  />
                </div>

                <button
                  type="submit"
                  class="btn btn-primary login-btn"
                  [disabled]="isLoggingIn() || !passwordInput.trim()"
                >
                  <span>{{ isLoggingIn() ? 'Verifying...' : 'Access Dashboard' }}</span>
                </button>
              </form>

              <div class="login-footer">
                <a routerLink="/ask" class="return-link">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                  <span>Return to Public Q&amp;A</span>
                </a>
              </div>
            </div>
          </div>
        }

        <!-- 2. Loading Auth State -->
        @if (isAuthenticated() === null) {
          <div class="card loading-card">
            <p>Checking authentication...</p>
          </div>
        }

        <!-- 3. Logged In State: Moderation Dashboard -->
        @if (isAuthenticated() === true) {
          <div class="dashboard-wrapper">
            <!-- Top Bar Navigation -->
            <div class="dashboard-top-bar">
              <div class="branding-group">
                <h1 class="admin-wordmark">
                  Ask Prof<span class="brand-accent">.</span>
                </h1>
                <span class="admin-badge">Admin</span>
              </div>

              <div class="top-actions">
                <!-- Theme Switcher Button -->
                <button
                  type="button"
                  (click)="themeService.toggleTheme()"
                  class="theme-toggle-btn"
                  [title]="themeService.isDarkMode() ? 'Switch to light mode' : 'Switch to dark mode'"
                  aria-label="Toggle theme"
                >
                  @if (themeService.isDarkMode()) {
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                  } @else {
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                  }
                </button>

                <a routerLink="/ask" class="action-btn back-btn" title="Back to Q&A">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                  <span>Q&amp;A Feed</span>
                </a>

                <button type="button" (click)="handleLogout()" class="action-btn logout-btn">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  <span>Log Out</span>
                </button>
              </div>
            </div>

            <!-- Tabs Navigation -->
            <div class="dashboard-tabs-bar">
              <div class="tabs-group">
                <button
                  type="button"
                  (click)="setActiveTab('pending')"
                  class="tab-btn"
                  [class.active]="activeTab() === 'pending'"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
                  <span>Pending</span>
                  <span class="count-badge">{{ pendingQuestions().length }}</span>
                </button>

                <button
                  type="button"
                  (click)="setActiveTab('answered')"
                  class="tab-btn"
                  [class.active]="activeTab() === 'answered'"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
                  <span>Answered</span>
                  <span class="count-badge">{{ answeredQuestions().length }}</span>
                </button>
              </div>
            </div>

            <!-- Content for Pending Tab -->
            @if (activeTab() === 'pending') {
              <div class="questions-deck">
                @if (pendingQuestions().length === 0) {
                  <div class="card empty-deck">
                    <h3>All caught up!</h3>
                    <p>There are no pending questions waiting for your response.</p>
                  </div>
                } @else {
                  @for (q of pendingQuestions(); track q.id) {
                    <article class="admin-card card pending-card">
                      <header class="card-meta-header">
                        <span class="asker-tag">
                          {{ q.is_anonymous ? 'Anonymous' : q.asker_name }}
                        </span>
                        <time class="meta-date">
                          {{ formatTimestamp(q.created_at) }}
                        </time>
                      </header>

                      @if (q.parent_id && q.parent_question_text) {
                        <div class="follow-up-pill">
                          <span>Follow-up to &ldquo;{{ q.parent_question_text }}&rdquo;</span>
                        </div>
                      }

                      <div class="question-body">
                        {{ q.question_text }}
                      </div>

                      <!-- Composer Area -->
                      <div class="composer-wrap">
                        <textarea
                          class="admin-textarea"
                          placeholder="Write your answer to publish publicly..."
                          rows="4"
                          [ngModel]="draftAnswers()[q.id] || ''"
                          (ngModelChange)="onDraftChange(q.id, $event)"
                        ></textarea>
                      </div>

                      <div class="card-footer-actions">
                        <button
                          type="button"
                          (click)="handleDelete(q.id)"
                          [disabled]="isDeletingId() === q.id"
                          class="btn-delete"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                          <span>{{ isDeletingId() === q.id ? 'Dismissing...' : 'Dismiss' }}</span>
                        </button>

                        <button
                          type="button"
                          (click)="handlePublishAnswer(q.id)"
                          [disabled]="isPublishingId() === q.id || !getDraft(q.id).trim()"
                          class="btn btn-primary btn-sm"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                          <span>{{ isPublishingId() === q.id ? 'Publishing...' : 'Publish Answer' }}</span>
                        </button>
                      </div>
                    </article>
                  }
                }
              </div>
            }

            <!-- Content for Answered Tab -->
            @if (activeTab() === 'answered') {
              <div class="questions-deck">
                @if (answeredQuestions().length === 0) {
                  <div class="card empty-deck">
                    <h3>No answered questions yet</h3>
                    <p>Answer questions from the Pending tab to publish them here.</p>
                  </div>
                } @else {
                  @for (q of answeredQuestions(); track q.id) {
                    <article class="admin-card card answered-card">
                      <header class="card-meta-header">
                        <div class="asker-group">
                          <span class="asker-tag">
                            {{ q.is_anonymous ? 'Anonymous' : q.asker_name }}
                          </span>
                          <span class="likes-badge">
                            ♥ {{ q.likes_count }} likes
                          </span>
                        </div>
                        <time class="meta-date">
                          {{ formatTimestamp(q.answered_at || q.created_at) }}
                        </time>
                      </header>

                      @if (q.parent_id && q.parent_question_text) {
                        <div class="follow-up-pill">
                          <span>Follow-up to &ldquo;{{ q.parent_question_text }}&rdquo;</span>
                        </div>
                      }

                      <div class="question-body">
                        {{ q.question_text }}
                      </div>

                      <!-- Composer Area to edit -->
                      <div class="composer-wrap">
                        <textarea
                          class="admin-textarea"
                          rows="4"
                          [ngModel]="draftAnswers()[q.id] !== undefined ? draftAnswers()[q.id] : q.answer_text || ''"
                          (ngModelChange)="onDraftChange(q.id, $event)"
                        ></textarea>
                      </div>

                      <div class="card-footer-actions">
                        <button
                          type="button"
                          (click)="handleDelete(q.id)"
                          [disabled]="isDeletingId() === q.id"
                          class="btn-delete"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                          <span>{{ isDeletingId() === q.id ? 'Deleting...' : 'Delete' }}</span>
                        </button>

                        <button
                          type="button"
                          (click)="handlePublishAnswer(q.id)"
                          [disabled]="isPublishingId() === q.id"
                          class="btn btn-primary btn-sm"
                        >
                          <span>{{ isPublishingId() === q.id ? 'Saving...' : 'Save Changes' }}</span>
                        </button>
                      </div>
                    </article>
                  }
                }
              </div>
            }
          </div>
        }
      </div>
    </main>
  `,
  styles: [`
    .admin-page-wrapper {
      padding: 2.5rem 0 6rem 0;
      position: relative;
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

    /* Login View */
    .login-wrapper {
      display: flex;
      justify-content: center;
      padding: 4rem 1rem;
    }
    .login-card {
      width: 100%;
      max-width: 440px;
      padding: 2.5rem 2rem;
      background-color: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-surface);
      text-align: center;
    }
    .lock-icon-wrap {
      width: 50px;
      height: 50px;
      border-radius: var(--radius-pill);
      background-color: var(--bg-surface-tint);
      color: var(--interactive-accent);
      border: 1px solid var(--border-color);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.25rem;
    }
    .login-title {
      font-size: 1.75rem;
      color: var(--text-primary);
      margin-bottom: 0.5rem;
    }
    .brand-accent {
      color: var(--interactive-accent);
    }
    .login-subtitle {
      font-size: 0.92rem;
      color: var(--text-secondary);
      margin-bottom: 1.75rem;
      line-height: 1.5;
    }
    .login-form {
      text-align: left;
      margin-bottom: 1.5rem;
    }
    .form-group {
      margin-bottom: 1.25rem;
    }
    .form-group label {
      display: block;
      font-size: 0.85rem;
      color: var(--text-secondary);
      margin-bottom: 0.45rem;
      font-weight: 500;
    }
    .input-password {
      width: 100%;
      padding: 0.75rem 0.95rem;
      font-family: var(--font-primary);
      font-size: 1rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      background-color: var(--bg-surface-tint);
      color: var(--text-primary);
      outline: none;
      box-sizing: border-box;
      transition: all var(--transition-fast);
    }
    .input-password:focus {
      border-color: var(--interactive);
      background-color: var(--bg-surface);
      box-shadow: 0 0 0 3px rgba(168, 152, 138, 0.15);
    }
    .login-btn {
      width: 100%;
      padding: 0.75rem;
      font-size: 0.95rem;
    }
    .error-banner {
      padding: 0.65rem 0.85rem;
      border-radius: var(--radius-sm);
      background-color: rgba(220, 38, 38, 0.1);
      color: #b91c1c;
      border: 1px solid rgba(220, 38, 38, 0.25);
      font-size: 0.88rem;
      margin-bottom: 1.25rem;
      text-align: left;
    }
    :host-context(html.dark) .error-banner {
      background-color: rgba(239, 68, 68, 0.15);
      color: #f87171;
      border-color: rgba(239, 68, 68, 0.3);
    }
    .login-footer {
      border-top: 1px solid var(--border-subtle);
      padding-top: 1.25rem;
    }
    .return-link {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      font-size: 0.85rem;
      color: var(--text-muted);
      transition: color var(--transition-fast);
    }
    .return-link:hover {
      color: var(--text-primary);
    }

    /* Dashboard Header */
    .dashboard-top-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 2rem;
      flex-wrap: wrap;
    }
    .branding-group {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .admin-wordmark {
      font-size: 1.85rem;
      color: var(--text-primary);
    }
    .admin-badge {
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      background-color: var(--color-warm-peach);
      color: #2E2A26;
      padding: 0.2rem 0.55rem;
      border-radius: var(--radius-xs);
    }
    .top-actions {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }
    .theme-toggle-btn {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-sm);
      background-color: var(--bg-surface);
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .theme-toggle-btn:hover {
      color: var(--text-primary);
      border-color: var(--border-strong);
      background-color: var(--bg-surface-tint);
    }
    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-family: var(--font-primary);
      font-size: 0.85rem;
      padding: 0.45rem 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      background-color: var(--bg-surface);
      color: var(--text-secondary);
      cursor: pointer;
      text-decoration: none;
      transition: all var(--transition-fast);
    }
    .action-btn:hover {
      color: var(--text-primary);
      border-color: var(--border-strong);
      background-color: var(--bg-surface-tint);
    }
    .logout-btn:hover {
      color: #b91c1c;
      border-color: rgba(185, 28, 28, 0.4);
    }

    /* Tabs Bar */
    .dashboard-tabs-bar {
      margin-bottom: 2rem;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.75rem;
    }
    .tabs-group {
      display: flex;
      gap: 0.65rem;
    }
    .tab-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.55rem 1rem;
      font-family: var(--font-primary);
      font-size: 0.92rem;
      background: none;
      border: 1px solid transparent;
      border-radius: var(--radius-sm);
      color: var(--text-secondary);
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .tab-btn:hover {
      color: var(--text-primary);
      background-color: var(--bg-surface-tint);
    }
    .tab-btn.active {
      background-color: var(--interactive);
      color: var(--interactive-text);
      font-weight: 500;
    }
    .count-badge {
      background-color: rgba(0, 0, 0, 0.12);
      padding: 0.1rem 0.45rem;
      border-radius: var(--radius-pill);
      font-size: 0.78rem;
    }
    .tab-btn.active .count-badge {
      background-color: rgba(255, 255, 255, 0.25);
      color: inherit;
    }

    /* Question Cards Deck */
    .questions-deck {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .admin-card {
      padding: 1.75rem 2rem;
      background-color: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-surface);
    }
    .card-meta-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 0.85rem;
      flex-wrap: wrap;
    }
    .asker-group {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }
    .asker-tag {
      font-size: 0.82rem;
      font-weight: 600;
      background-color: var(--tag-bg);
      color: var(--tag-text);
      padding: 0.2rem 0.6rem;
      border-radius: var(--radius-xs);
    }
    .likes-badge {
      font-size: 0.8rem;
      color: var(--text-muted);
    }
    .meta-date {
      font-size: 0.82rem;
      color: var(--text-muted);
    }

    .follow-up-pill {
      font-size: 0.82rem;
      color: var(--interactive-accent);
      margin-bottom: 0.75rem;
      font-style: italic;
    }
    .question-body {
      font-size: 1.15rem;
      line-height: 1.55;
      color: var(--text-primary);
      margin-bottom: 1.25rem;
      font-weight: 500;
    }

    /* Composer */
    .composer-wrap {
      margin-bottom: 1.25rem;
    }
    .admin-textarea {
      width: 100%;
      padding: 0.85rem 1rem;
      font-family: var(--font-primary);
      font-size: 0.95rem;
      line-height: 1.6;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      background-color: var(--bg-surface-tint);
      color: var(--text-primary);
      outline: none;
      resize: vertical;
      box-sizing: border-box;
      transition: all var(--transition-fast);
    }
    .admin-textarea:focus {
      border-color: var(--interactive);
      background-color: var(--bg-surface);
      box-shadow: 0 0 0 3px rgba(168, 152, 138, 0.15);
    }

    /* Footer actions */
    .card-footer-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding-top: 0.85rem;
      border-top: 1px solid var(--border-subtle);
    }
    .btn-delete {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background: none;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-xs);
      padding: 0.35rem 0.7rem;
      font-family: var(--font-primary);
      font-size: 0.82rem;
      color: var(--text-muted);
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .btn-delete:hover:not(:disabled) {
      color: #b91c1c;
      border-color: rgba(185, 28, 28, 0.35);
      background-color: rgba(185, 28, 28, 0.05);
    }

    .empty-deck {
      text-align: center;
      padding: 3.5rem 1.5rem;
    }
    .empty-deck h3 {
      font-size: 1.25rem;
      color: var(--text-primary);
      margin-bottom: 0.5rem;
    }
    .empty-deck p {
      font-size: 0.92rem;
      color: var(--text-muted);
    }

    .loading-card {
      text-align: center;
      padding: 3rem;
    }

    @media (max-width: 640px) {
      .admin-card {
        padding: 1.25rem 1rem;
      }
    }
  `]
})
export class AskAdminComponent implements OnInit {
  private askService = inject(AskService);
  themeService = inject(ThemeService);
  private router = inject(Router);

  isAuthenticated = signal<boolean | null>(null);
  passwordInput = '';
  authError = signal<string | null>(null);
  isLoggingIn = signal<boolean>(false);

  activeTab = signal<'pending' | 'answered'>('pending');
  pendingQuestions = signal<Question[]>([]);
  answeredQuestions = signal<Question[]>([]);

  draftAnswers = signal<Record<string, string>>({});
  isPublishingId = signal<string | null>(null);
  isDeletingId = signal<string | null>(null);
  feedbackToast = signal<string | null>(null);

  ngOnInit(): void {
    this.checkAuth();
  }

  checkAuth(): void {
    this.askService.checkAdminAuth().subscribe({
      next: (res) => {
        const isAuth = Boolean(res && res.authenticated);
        this.isAuthenticated.set(isAuth);
        if (isAuth) {
          this.loadQuestions();
        }
      },
      error: () => this.isAuthenticated.set(false)
    });
  }

  loadQuestions(): void {
    this.askService.getAdminQuestions().subscribe({
      next: (res) => {
        if (res && res.success) {
          this.pendingQuestions.set(res.pending || []);
          this.answeredQuestions.set(res.answered || []);

          const drafts: Record<string, string> = {};
          (res.answered || []).forEach(q => {
            if (q.answer_text) drafts[q.id] = q.answer_text;
          });
          this.draftAnswers.update(m => ({ ...drafts, ...m }));
        }
      },
      error: (err) => console.error('Failed to load admin questions:', err)
    });
  }

  handleLogin(): void {
    if (!this.passwordInput.trim()) return;

    this.isLoggingIn.set(true);
    this.authError.set(null);

    this.askService.loginAdmin(this.passwordInput.trim()).subscribe({
      next: (res) => {
        this.isLoggingIn.set(false);
        if (res && res.success) {
          this.isAuthenticated.set(true);
          this.passwordInput = '';
          this.loadQuestions();
          this.showToast('Access granted.');
        } else {
          this.authError.set(res?.error || 'Invalid credentials.');
        }
      },
      error: (err) => {
        this.isLoggingIn.set(false);
        if (err.status === 429) {
          const waitMin = err.error?.resetInSeconds ? Math.ceil(err.error.resetInSeconds / 60) : 15;
          this.authError.set(`Too many failed attempts. Locked out for ${waitMin} minutes.`);
        } else {
          this.authError.set(err.error?.error || 'Invalid credentials.');
        }
      }
    });
  }

  handleLogout(): void {
    this.askService.logoutAdmin().subscribe({
      next: () => {
        this.isAuthenticated.set(false);
        this.showToast('Session closed.');
      },
      error: () => this.isAuthenticated.set(false)
    });
  }

  setActiveTab(tab: 'pending' | 'answered'): void {
    this.activeTab.set(tab);
  }

  onDraftChange(id: string, text: string): void {
    this.draftAnswers.update(m => ({ ...m, [id]: text }));
  }

  getDraft(id: string): string {
    return this.draftAnswers()[id] || '';
  }

  handlePublishAnswer(id: string): void {
    const text = (this.draftAnswers()[id] || '').trim();
    if (!text) return;

    this.isPublishingId.set(id);

    this.askService.answerAndPublish(id, text).subscribe({
      next: (res) => {
        this.isPublishingId.set(null);
        if (res && res.success) {
          this.showToast('Answer published to public feed.');
          this.loadQuestions();
        } else {
          this.showToast((res as any)?.error || 'Failed to publish answer.');
        }
      },
      error: (err) => {
        this.isPublishingId.set(null);
        this.showToast(err.error?.error || 'Failed to publish answer.');
      }
    });
  }

  handleDelete(id: string): void {
    if (!confirm('Are you sure you want to delete this question? This cannot be undone.')) {
      return;
    }

    this.isDeletingId.set(id);

    this.askService.deleteQuestion(id).subscribe({
      next: (res) => {
        this.isDeletingId.set(null);
        if (res && res.success) {
          this.showToast('Question dismissed and purged.');
          this.loadQuestions();
        } else {
          this.showToast((res as any)?.error || 'Failed to delete question.');
        }
      },
      error: (err) => {
        this.isDeletingId.set(null);
        this.showToast(err.error?.error || 'Failed to delete question.');
      }
    });
  }

  showToast(msg: string): void {
    this.feedbackToast.set(msg);
    setTimeout(() => this.feedbackToast.set(null), 3000);
  }

  formatTimestamp(dateStr?: string | null): string {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  }
}
