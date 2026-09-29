import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AskService } from '../services/ask.service';
import { AuthService } from '../services/auth.service';
import { ThemeService } from '../services/theme.service';
import { TranslationService } from '../services/translation.service';
import { NotesService } from '../services/notes.service';
import { Question } from '../models/models';
import { AdminEditorComponent } from './admin-editor.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AdminEditorComponent],
  template: `
    <main class="admin-page-wrapper">
      <div class="container-admin">
        <!-- Toast Notification -->
        @if (feedbackToast()) {
          <div class="floating-toast" role="status" aria-live="polite">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            <span>{{ feedbackToast() }}</span>
          </div>
        }

        <!-- 1. Logged Out State: Secret Master Password Form -->
        @if (isAuthenticated() === false) {
          <div class="login-wrapper">
            <div class="card login-card">
              <div class="login-header">
                <div class="lock-icon-wrap">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
                <h1 class="login-title">
                  Prof<span class="brand-accent">.</span> Vault
                </h1>
                <p class="login-subtitle">
                  Enter master password to access the administrative console.
                </p>
              </div>

              @if (authError()) {
                <div class="error-banner">
                  {{ authError() }}
                </div>
              }

              <form (ngSubmit)="handleLogin()" class="login-form">
                <div class="form-group">
                  <label for="vault-password">{{ ts.t('ask_admin.password') }}</label>
                  <input
                    id="vault-password"
                    type="password"
                    class="input-password"
                    placeholder="Enter configured admin password"
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
                  <span>{{ isLoggingIn() ? 'Authenticating...' : 'Unlock Console' }}</span>
                </button>
              </form>

              <div class="login-footer">
                <a routerLink="/" class="return-link">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                  <span>Return to Site</span>
                </a>
              </div>
            </div>
          </div>
        }

        <!-- 2. Loading Auth State -->
        @if (isAuthenticated() === null) {
          <div class="card loading-card">
            <p>{{ ts.t('ask_admin.checking_auth') }}</p>
          </div>
        }

        <!-- 3. Logged In State: Unified Administrative Console -->
        @if (isAuthenticated() === true) {
          <div class="dashboard-wrapper">
            <!-- Top Bar Navigation -->
            <div class="dashboard-top-bar">
              <div class="branding-group">
                <h1 class="admin-wordmark">
                  Prof<span class="brand-accent">.</span> Vault
                </h1>
                <span class="admin-badge">Console</span>
              </div>

              <!-- Main Section Navigation Tabs -->
              <div class="main-sections-nav">
                <button
                  type="button"
                  (click)="mainSection.set('ask')"
                  class="section-nav-btn"
                  [class.active]="mainSection() === 'ask'"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  <span>Ask Moderation</span>
                  @if (pendingQuestions().length > 0) {
                    <span class="count-pill">{{ pendingQuestions().length }}</span>
                  }
                </button>

                <button
                  type="button"
                  (click)="mainSection.set('studio')"
                  class="section-nav-btn"
                  [class.active]="mainSection() === 'studio'"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                  <span>Studio & Editor</span>
                </button>

                <button
                  type="button"
                  (click)="mainSection.set('folders')"
                  class="section-nav-btn"
                  [class.active]="mainSection() === 'folders'"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                  <span>Academic Folders</span>
                </button>
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

                <a routerLink="/" class="action-btn back-btn" title="View Public Website">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                  <span>View Site</span>
                </a>

                <button type="button" (click)="handleLogout()" class="action-btn logout-btn">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  <span>Lock Console</span>
                </button>
              </div>
            </div>

            <!-- SECTION 1: ASK MODERATION -->
            @if (mainSection() === 'ask') {
              <!-- Tabs Navigation -->
              <div class="dashboard-tabs-bar">
                <div class="tabs-group">
                  <button
                    type="button"
                    (click)="askSubTab.set('pending')"
                    class="tab-btn"
                    [class.active]="askSubTab() === 'pending'"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
                    <span>{{ ts.t('ask_admin.tab_pending') }}</span>
                    <span class="count-badge">{{ pendingQuestions().length }}</span>
                  </button>

                  <button
                    type="button"
                    (click)="askSubTab.set('answered')"
                    class="tab-btn"
                    [class.active]="askSubTab() === 'answered'"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
                    <span>{{ ts.t('ask_admin.tab_answered') }}</span>
                    <span class="count-badge">{{ answeredQuestions().length }}</span>
                  </button>
                </div>
              </div>

              <!-- Content for Pending Tab -->
              @if (askSubTab() === 'pending') {
                <div class="questions-deck">
                  @if (pendingQuestions().length === 0) {
                    <div class="card empty-deck">
                      <h3>{{ ts.t('ask_admin.caught_up_title') }}</h3>
                      <p>{{ ts.t('ask_admin.caught_up_desc') }}</p>
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
                            <span>{{ ts.t('ask.follow_up_to') }} &ldquo;{{ q.parent_question_text }}&rdquo;</span>
                          </div>
                        }

                        <div class="question-body">
                          {{ q.question_text }}
                        </div>

                        <!-- Composer Area -->
                        <div class="composer-wrap">
                          <textarea
                            class="admin-textarea"
                            [placeholder]="ts.t('ask_admin.write_answer_placeholder')"
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
                            <span>{{ isDeletingId() === q.id ? ts.t('ask_admin.dismissing') : ts.t('ask_admin.dismiss') }}</span>
                          </button>

                          <button
                            type="button"
                            (click)="handlePublishAnswer(q.id)"
                            [disabled]="isPublishingId() === q.id || !getDraft(q.id).trim()"
                            class="btn btn-primary btn-sm"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                            <span>{{ isPublishingId() === q.id ? ts.t('ask_admin.publishing') : ts.t('ask_admin.publish_answer') }}</span>
                          </button>
                        </div>
                      </article>
                    }
                  }
                </div>
              }

              <!-- Content for Answered Tab -->
              @if (askSubTab() === 'answered') {
                <div class="questions-deck">
                  @if (answeredQuestions().length === 0) {
                    <div class="card empty-deck">
                      <h3>{{ ts.t('ask_admin.no_answered_title') }}</h3>
                      <p>{{ ts.t('ask_admin.no_answered_desc') }}</p>
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
                            <span>{{ ts.t('ask.follow_up_to') }} &ldquo;{{ q.parent_question_text }}&rdquo;</span>
                          </div>
                        }

                        <div class="question-body">
                          {{ q.question_text }}
                        </div>

                        @if (q.answer_text) {
                          <div class="published-answer-wrap">
                            <div class="answer-badge">{{ ts.t('ask_admin.published_answer') }}</div>
                            <div class="published-answer-content">
                              {{ q.answer_text }}
                            </div>
                          </div>
                        }

                        <div class="card-footer-actions">
                          <button
                            type="button"
                            (click)="handleDelete(q.id)"
                            [disabled]="isDeletingId() === q.id"
                            class="btn-delete"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                            <span>{{ isDeletingId() === q.id ? ts.t('ask_admin.dismissing') : 'Delete Question' }}</span>
                          </button>
                        </div>
                      </article>
                    }
                  }
                </div>
              }
            }

            <!-- SECTION 2: STUDIO & MARKDOWN EDITOR -->
            @if (mainSection() === 'studio') {
              <div class="studio-container">
                <app-admin-editor></app-admin-editor>
              </div>
            }

            <!-- SECTION 3: ACADEMIC FOLDERS MANAGEMENT -->
            @if (mainSection() === 'folders') {
              <div class="folders-management card">
                <div class="folders-header">
                  <div>
                    <h2 class="folders-title">Academic Folders & Subjects</h2>
                    <p class="folders-sub">Organize your academic repository by creating or removing subject categories.</p>
                  </div>
                </div>

                <div class="add-folder-row">
                  <input
                    type="text"
                    [(ngModel)]="newSubjectName"
                    placeholder="New Subject / Folder Name (e.g. Operating Systems)"
                    class="input-folder"
                    (keyup.enter)="handleCreateSubject()"
                  />
                  <button
                    type="button"
                    class="btn btn-primary btn-sm"
                    (click)="handleCreateSubject()"
                    [disabled]="!newSubjectName.trim() || isCreatingSubject()"
                  >
                    <span>{{ isCreatingSubject() ? 'Creating...' : '+ Create Folder' }}</span>
                  </button>
                </div>

                <div class="existing-subjects-grid">
                  @for (group of notesService.getGroupedSubjects(); track group.subject) {
                    <div class="subject-card">
                      <div class="subject-card-left">
                        <span class="folder-icon">📁</span>
                        <div>
                          <strong class="subject-name">{{ group.subject }}</strong>
                          <span class="subject-count">{{ group.count }} notes inside</span>
                        </div>
                      </div>
                      <div class="subject-actions">
                        <button
                          type="button"
                          class="btn-delete-subject"
                          (click)="handleDeleteSubject(group.subject)"
                          title="Delete folder"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }
      </div>
    </main>
  `,
  styles: [`
    .admin-page-wrapper {
      min-height: calc(100vh - var(--navbar-height));
      background-color: var(--bg-main);
      padding: 2.5rem 1rem 5rem 1rem;
      transition: background-color var(--transition-smooth);
    }
    .container-admin {
      width: 100%;
      max-width: 1100px;
      margin: 0 auto;
    }

    /* Floating Toast Notification */
    .floating-toast {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      z-index: 1000;
      display: inline-flex;
      align-items: center;
      gap: 0.65rem;
      padding: 0.75rem 1.25rem;
      border-radius: var(--radius-md);
      background-color: var(--bg-card);
      border: 1px solid var(--border-color-focus);
      box-shadow: var(--shadow-lg);
      color: var(--text-primary);
      font-size: 0.9rem;
      font-weight: 500;
      animation: slideInUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .floating-toast svg {
      color: #10B981;
      flex-shrink: 0;
    }
    @keyframes slideInUp {
      from { transform: translateY(12px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    /* Login View */
    .login-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 60vh;
      padding: 1rem;
    }
    .login-card {
      width: 100%;
      max-width: 440px;
      padding: 2.5rem;
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-md);
    }
    .login-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    .lock-icon-wrap {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: var(--radius-full);
      background-color: var(--bg-card-secondary);
      border: 1px solid var(--border-subtle);
      color: var(--color-warm-peach);
      margin-bottom: 1rem;
    }
    .login-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 0.5rem;
      letter-spacing: -0.02em;
    }
    .brand-accent {
      color: var(--color-warm-peach);
    }
    .login-subtitle {
      font-size: 0.88rem;
      color: var(--text-secondary);
      line-height: 1.5;
    }
    .login-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      text-align: left;
    }
    .form-group label {
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--text-primary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .input-password {
      width: 100%;
      padding: 0.75rem 1rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
      background-color: var(--bg-card-secondary);
      color: var(--text-primary);
      font-size: 0.95rem;
      outline: none;
      transition: all var(--transition-fast);
      box-sizing: border-box;
    }
    .input-password:focus {
      border-color: var(--border-color-focus);
      box-shadow: 0 0 0 3px rgba(235, 110, 75, 0.15);
    }
    .login-btn {
      width: 100%;
      padding: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }
    .error-banner {
      padding: 0.75rem 1rem;
      border-radius: var(--radius-md);
      background-color: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #EF4444;
      font-size: 0.85rem;
      margin-bottom: 1.25rem;
      line-height: 1.4;
      text-align: center;
    }
    .login-footer {
      margin-top: 1.75rem;
      text-align: center;
    }
    .return-link {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.85rem;
      color: var(--text-secondary);
      transition: color var(--transition-fast);
    }
    .return-link:hover {
      color: var(--text-primary);
    }

    /* Loading Card */
    .loading-card {
      text-align: center;
      padding: 3rem;
      color: var(--text-secondary);
    }

    /* Dashboard Top Bar */
    .dashboard-top-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
      margin-bottom: 1.75rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border-subtle);
      flex-wrap: wrap;
    }
    .branding-group {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .admin-wordmark {
      font-size: 1.35rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
      letter-spacing: -0.02em;
    }
    .admin-badge {
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      padding: 0.2rem 0.6rem;
      border-radius: var(--radius-full);
      background-color: var(--bg-card-secondary);
      border: 1px solid var(--border-color);
      color: var(--color-warm-peach);
    }
    .main-sections-nav {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background-color: var(--bg-card-secondary);
      padding: 0.25rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-subtle);
    }
    .section-nav-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.45rem 0.9rem;
      border-radius: var(--radius-sm);
      border: none;
      background: transparent;
      color: var(--text-secondary);
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition-fast);
      font-family: inherit;
    }
    .section-nav-btn:hover {
      color: var(--text-primary);
    }
    .section-nav-btn.active {
      background-color: var(--bg-card);
      color: var(--text-primary);
      box-shadow: var(--shadow-sm);
      font-weight: 600;
    }
    .count-pill {
      background-color: var(--color-warm-peach);
      color: #fff;
      font-size: 0.72rem;
      padding: 0.1rem 0.45rem;
      border-radius: var(--radius-full);
      font-weight: 700;
    }
    .top-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.45rem 0.85rem;
      border-radius: var(--radius-md);
      font-size: 0.82rem;
      font-weight: 500;
      cursor: pointer;
      border: 1px solid var(--border-color);
      background-color: var(--bg-card);
      color: var(--text-primary);
      transition: all var(--transition-fast);
      font-family: inherit;
      text-decoration: none;
    }
    .action-btn:hover {
      background-color: var(--bg-card-hover);
      border-color: var(--border-color-focus);
    }
    .logout-btn:hover {
      color: #EF4444;
      border-color: rgba(239, 68, 68, 0.4);
    }
    .theme-toggle-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 34px;
      height: 34px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
      background-color: var(--bg-card);
      color: var(--text-primary);
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .theme-toggle-btn:hover {
      border-color: var(--border-color-focus);
    }

    /* Sub Tabs Bar */
    .dashboard-tabs-bar {
      display: flex;
      margin-bottom: 1.5rem;
    }
    .tabs-group {
      display: flex;
      gap: 0.5rem;
      background-color: var(--bg-card-secondary);
      padding: 0.25rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-subtle);
    }
    .tab-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.45rem 1rem;
      border-radius: var(--radius-sm);
      border: none;
      background: transparent;
      color: var(--text-secondary);
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition-fast);
      font-family: inherit;
    }
    .tab-btn:hover {
      color: var(--text-primary);
    }
    .tab-btn.active {
      background-color: var(--bg-card);
      color: var(--text-primary);
      box-shadow: var(--shadow-sm);
      font-weight: 600;
    }
    .count-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 20px;
      height: 20px;
      padding: 0 0.4rem;
      border-radius: var(--radius-full);
      background-color: var(--bg-surface-tint);
      color: var(--text-primary);
      font-size: 0.75rem;
      font-weight: 600;
    }
    .tab-btn.active .count-badge {
      background-color: var(--color-warm-peach);
      color: #fff;
    }

    /* Questions Deck */
    .questions-deck {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .empty-deck {
      text-align: center;
      padding: 4rem 2rem;
      color: var(--text-secondary);
    }
    .empty-deck h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 0.5rem;
    }
    .admin-card {
      padding: 1.5rem;
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-color);
      background-color: var(--bg-card);
      transition: border-color var(--transition-fast);
    }
    .pending-card {
      border-left: 3px solid var(--color-warm-peach);
    }
    .answered-card {
      border-left: 3px solid #10B981;
    }
    .card-meta-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.85rem;
    }
    .asker-tag {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-secondary);
      background-color: var(--bg-card-secondary);
      padding: 0.2rem 0.6rem;
      border-radius: var(--radius-sm);
    }
    .meta-date {
      font-size: 0.78rem;
      color: var(--text-muted);
    }
    .follow-up-pill {
      margin-bottom: 0.85rem;
      font-size: 0.8rem;
      color: var(--text-secondary);
      font-style: italic;
      padding: 0.3rem 0.65rem;
      background-color: var(--bg-card-secondary);
      border-radius: var(--radius-sm);
      display: inline-block;
    }
    .question-body {
      font-size: 1.05rem;
      color: var(--text-primary);
      line-height: 1.6;
      margin-bottom: 1.25rem;
      font-weight: 500;
    }
    .composer-wrap {
      margin-bottom: 1.25rem;
    }
    .admin-textarea {
      width: 100%;
      padding: 0.85rem 1rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
      background-color: var(--bg-card-secondary);
      color: var(--text-primary);
      font-family: inherit;
      font-size: 0.95rem;
      line-height: 1.6;
      resize: vertical;
      outline: none;
      transition: all var(--transition-fast);
      box-sizing: border-box;
    }
    .admin-textarea:focus {
      border-color: var(--border-color-focus);
      background-color: var(--bg-card);
      box-shadow: 0 0 0 3px rgba(235, 110, 75, 0.12);
    }
    .card-footer-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.75rem;
    }
    .btn-delete {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.45rem 0.85rem;
      border-radius: var(--radius-md);
      font-size: 0.82rem;
      font-weight: 500;
      background: transparent;
      border: 1px solid transparent;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .btn-delete:hover:not(:disabled) {
      color: #EF4444;
      background-color: rgba(239, 68, 68, 0.08);
      border-color: rgba(239, 68, 68, 0.2);
    }
    .published-answer-wrap {
      padding: 1rem 1.25rem;
      border-radius: var(--radius-md);
      background-color: var(--bg-card-secondary);
      border: 1px solid var(--border-subtle);
      margin-bottom: 1rem;
    }
    .answer-badge {
      font-size: 0.72rem;
      font-weight: 600;
      text-transform: uppercase;
      color: #10B981;
      margin-bottom: 0.4rem;
      letter-spacing: 0.05em;
    }
    .published-answer-content {
      font-size: 0.95rem;
      color: var(--text-primary);
      line-height: 1.6;
      white-space: pre-wrap;
    }
    .likes-badge {
      font-size: 0.8rem;
      font-weight: 600;
      color: #EF4444;
      margin-left: 0.5rem;
    }

    /* Folders Management */
    .folders-management {
      padding: 2rem;
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-color);
      background-color: var(--bg-card);
    }
    .folders-header {
      margin-bottom: 1.5rem;
    }
    .folders-title {
      font-size: 1.3rem;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 0.35rem;
    }
    .folders-sub {
      font-size: 0.9rem;
      color: var(--text-secondary);
    }
    .add-folder-row {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 2rem;
    }
    .input-folder {
      flex: 1;
      padding: 0.65rem 1rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
      background-color: var(--bg-card-secondary);
      color: var(--text-primary);
      font-size: 0.92rem;
      outline: none;
    }
    .existing-subjects-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
    }
    .subject-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.25rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
      background-color: var(--bg-card-secondary);
      transition: all var(--transition-fast);
    }
    .subject-card-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .folder-icon {
      font-size: 1.25rem;
    }
    .subject-name {
      display: block;
      font-size: 0.95rem;
      color: var(--text-primary);
    }
    .subject-count {
      display: block;
      font-size: 0.78rem;
      color: var(--text-muted);
    }
    .btn-delete-subject {
      width: 26px;
      height: 26px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-subtle);
      background: transparent;
      color: var(--text-secondary);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      transition: all var(--transition-fast);
    }
    .btn-delete-subject:hover {
      background-color: rgba(239, 68, 68, 0.1);
      border-color: #EF4444;
      color: #EF4444;
    }

    @media (max-width: 768px) {
      .dashboard-top-bar {
        flex-direction: column;
        align-items: stretch;
      }
      .main-sections-nav {
        flex-direction: column;
        align-items: stretch;
      }
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  askService = inject(AskService);
  authService = inject(AuthService);
  notesService = inject(NotesService);
  themeService = inject(ThemeService);
  ts = inject(TranslationService);
  router = inject(Router);

  // Auth State
  isAuthenticated = signal<boolean | null>(null);
  passwordInput = '';
  isLoggingIn = signal<boolean>(false);
  authError = signal<string | null>(null);

  // Section Navigation
  mainSection = signal<'ask' | 'studio' | 'folders'>('ask');
  askSubTab = signal<'pending' | 'answered'>('pending');

  // Moderation state
  pendingQuestions = signal<Question[]>([]);
  answeredQuestions = signal<Question[]>([]);
  draftAnswers = signal<Record<string, string>>({});
  isPublishingId = signal<string | null>(null);
  isDeletingId = signal<string | null>(null);
  feedbackToast = signal<string | null>(null);

  // Folders state
  newSubjectName = '';
  isCreatingSubject = signal<boolean>(false);

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
          this.askService.refreshPendingCount();
        }
      },
      error: () => {
        if (this.authService.isAdmin()) {
          this.isAuthenticated.set(true);
          this.loadQuestions();
        } else {
          this.isAuthenticated.set(false);
        }
      }
    });
  }

  loadQuestions(): void {
    this.askService.getAdminQuestions().subscribe({
      next: (res) => {
        if (res && res.success) {
          const pending = res.pending || [];
          const answered = res.answered || [];
          this.pendingQuestions.set(pending);
          this.answeredQuestions.set(answered);
          this.askService.pendingCount.set(pending.length);
          this.askService.stats.update(s => ({ ...s, total_pending: pending.length }));

          const drafts: Record<string, string> = {};
          answered.forEach(q => {
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

    const password = this.passwordInput.trim();
    this.isLoggingIn.set(true);
    this.authError.set(null);

    // 1. Authenticate HMAC session (sets HttpOnly cookie for Ask moderation)
    this.askService.loginAdmin(password).subscribe({
      next: (res) => {
        if (res && res.success) {
          // 2. Also authenticate JWT session for Studio/Markdown editor
          this.authService.login('prof', password).subscribe({
            next: () => {
              this.isLoggingIn.set(false);
              this.isAuthenticated.set(true);
              this.passwordInput = '';
              this.loadQuestions();
              this.askService.refreshPendingCount();
              this.showToast('Access granted.');
            },
            error: () => {
              // Even if JWT fails, moderation session is active
              this.isLoggingIn.set(false);
              this.isAuthenticated.set(true);
              this.passwordInput = '';
              this.loadQuestions();
              this.askService.refreshPendingCount();
              this.showToast('Access granted.');
            }
          });
        } else {
          this.isLoggingIn.set(false);
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
        this.authService.logout();
        this.isAuthenticated.set(false);
        this.showToast('Session closed.');
      },
      error: () => {
        this.authService.logout();
        this.isAuthenticated.set(false);
        this.showToast('Session closed.');
      }
    });
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
    if (!confirm(this.ts.t('ask_admin.delete_confirm'))) {
      return;
    }

    this.isDeletingId.set(id);

    this.askService.deleteQuestion(id).subscribe({
      next: (res) => {
        this.isDeletingId.set(null);
        if (res && res.success) {
          this.showToast('Question dismissed.');
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

  handleCreateSubject(): void {
    if (!this.newSubjectName.trim()) return;
    this.isCreatingSubject.set(true);

    this.notesService.createSubject(this.newSubjectName.trim()).subscribe({
      next: () => {
        this.isCreatingSubject.set(false);
        this.showToast(`Folder "${this.newSubjectName.trim()}" created.`);
        this.newSubjectName = '';
      },
      error: () => {
        this.isCreatingSubject.set(false);
        this.showToast('Failed to create folder.');
      }
    });
  }

  handleDeleteSubject(name: string): void {
    if (!confirm(`Delete folder "${name}"? Notes inside will become uncategorized.`)) {
      return;
    }

    this.notesService.deleteSubject(name).subscribe({
      next: () => this.showToast(`Folder "${name}" deleted.`),
      error: () => this.showToast('Failed to delete folder.')
    });
  }

  showToast(msg: string): void {
    this.feedbackToast.set(msg);
    setTimeout(() => this.feedbackToast.set(null), 3000);
  }

  formatTimestamp(iso: string | null | undefined): string {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return '';
    }
  }
}
