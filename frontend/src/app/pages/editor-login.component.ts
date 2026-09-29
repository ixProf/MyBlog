import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ThemeService } from '../services/theme.service';
import { TranslationService } from '../services/translation.service';

@Component({
  selector: 'app-editor-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <main class="editor-login-page">
      <div class="container-narrow">
        @if (feedbackToast()) {
          <div class="floating-toast" role="status" aria-live="polite">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            <span>{{ feedbackToast() }}</span>
          </div>
        }

        <div class="login-wrapper">
          <div class="card login-card">
            @if (authService.isAdmin()) {
              <!-- Already Authenticated State -->
              <div class="login-header">
                <div class="lock-icon-wrap unlocked">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
                </div>
                <h1 class="login-title">
                  Prof<span class="brand-accent">.</span> Studio
                </h1>
                <p class="login-subtitle">
                  Session active. You have full authoring and editing access.
                </p>
              </div>

              <div class="session-actions">
                <a routerLink="/editor" class="btn btn-primary btn-block">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                  <span>Open Studio Editor</span>
                </a>
                <button type="button" class="btn btn-outline btn-block" (click)="handleLogout()">
                  <span>End Studio Session</span>
                </button>
              </div>
            } @else {
              <!-- Logged Out State: Single Password Form -->
              <div class="login-header">
                <div class="lock-icon-wrap">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
                <h1 class="login-title">
                  Prof<span class="brand-accent">.</span> Studio
                </h1>
                <p class="login-subtitle">
                  Enter editor password to access the writing studio & Obsidian editor.
                </p>
              </div>

              @if (authError()) {
                <div class="error-banner" role="alert">
                  {{ authError() }}
                </div>
              }

              <form (ngSubmit)="handleLogin()" class="login-form">
                <div class="form-group">
                  <label for="editor-password">Editor Password</label>
                  <input
                    id="editor-password"
                    type="password"
                    class="input-password"
                    placeholder="Enter configured editor password"
                    [(ngModel)]="passwordInput"
                    name="password"
                    autocomplete="current-password"
                    required
                    autofocus
                  />
                </div>

                <button
                  type="submit"
                  class="btn btn-primary login-btn"
                  [disabled]="isLoggingIn() || !passwordInput.trim()"
                  id="btn-unlock-studio"
                >
                  <span>{{ isLoggingIn() ? 'Authenticating...' : 'Unlock Studio' }}</span>
                </button>
              </form>
            }

            <div class="login-footer">
              <a routerLink="/" class="return-link">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                <span>Return to Home</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  `,
  styles: [`
    .editor-login-page {
      padding: 4rem 0 6rem 0;
      min-height: calc(100vh - 140px);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .login-wrapper {
      max-width: 440px;
      margin: 0 auto;
      width: 100%;
    }
    .login-card {
      padding: 2.5rem 2.25rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      background-color: var(--bg-surface);
      box-shadow: var(--shadow-surface);
    }
    .login-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    .lock-icon-wrap {
      width: 52px;
      height: 52px;
      border-radius: var(--radius-md);
      background-color: var(--bg-surface-tint);
      border: 1px solid var(--border-color);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--interactive);
      margin-bottom: 1.25rem;
    }
    .lock-icon-wrap.unlocked {
      color: #10B981;
      border-color: rgba(16, 185, 129, 0.3);
      background-color: rgba(16, 185, 129, 0.08);
    }
    .login-title {
      font-size: 1.85rem;
      color: var(--text-primary);
      margin-bottom: 0.5rem;
      letter-spacing: -0.01em;
    }
    .brand-accent {
      color: var(--interactive-accent);
    }
    .login-subtitle {
      font-size: 0.92rem;
      color: var(--text-secondary);
      line-height: 1.55;
    }
    .error-banner {
      padding: 0.75rem 1rem;
      border-radius: var(--radius-sm);
      background-color: rgba(220, 38, 38, 0.08);
      border: 1px solid rgba(220, 38, 38, 0.25);
      color: #dc2626;
      font-size: 0.88rem;
      margin-bottom: 1.5rem;
      text-align: center;
    }
    .login-form {
      display: flex;
      flex-direction: column;
      gap: 1.35rem;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
    }
    .form-group label {
      font-size: 0.88rem;
      font-weight: 500;
      color: var(--text-primary);
    }
    .input-password {
      width: 100%;
      padding: 0.75rem 1rem;
      font-family: inherit;
      font-size: 0.95rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      background-color: var(--bg-surface-tint);
      color: var(--text-primary);
      outline: none;
      transition: all var(--transition-fast);
      box-sizing: border-box;
    }
    .input-password:focus {
      border-color: var(--interactive);
      background-color: var(--bg-surface);
      box-shadow: 0 0 0 3px rgba(168, 152, 138, 0.18);
    }
    .login-btn {
      width: 100%;
      padding: 0.8rem;
      font-size: 1rem;
      font-weight: 600;
      margin-top: 0.25rem;
    }
    .session-actions {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      margin-bottom: 1rem;
    }
    .btn-block {
      width: 100%;
      justify-content: center;
    }
    .login-footer {
      margin-top: 1.75rem;
      padding-top: 1.25rem;
      border-top: 1px solid var(--border-subtle);
      text-align: center;
    }
    .return-link {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.85rem;
      color: var(--text-muted);
      transition: color var(--transition-fast);
    }
    .return-link:hover {
      color: var(--text-primary);
    }
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
      background-color: var(--bg-surface);
      border: 1px solid var(--border-strong);
      box-shadow: var(--shadow-surface);
      color: var(--text-primary);
      font-size: 0.9rem;
      font-weight: 500;
    }
    .floating-toast svg {
      color: #10B981;
      flex-shrink: 0;
    }
  `]
})
export class EditorLoginComponent {
  authService = inject(AuthService);
  themeService = inject(ThemeService);
  ts = inject(TranslationService);
  private router = inject(Router);

  passwordInput = '';
  isLoggingIn = signal<boolean>(false);
  authError = signal<string | null>(null);
  feedbackToast = signal<string | null>(null);

  handleLogin(): void {
    const password = this.passwordInput.trim();
    if (!password) return;

    this.isLoggingIn.set(true);
    this.authError.set(null);

    this.authService.login(password).subscribe({
      next: (res) => {
        this.isLoggingIn.set(false);
        if (res && res.success) {
          this.passwordInput = '';
          this.showToast('Studio unlocked.');
          this.router.navigate(['/editor']);
        } else {
          this.authError.set(res?.message || 'Invalid password.');
        }
      },
      error: () => {
        this.isLoggingIn.set(false);
        this.authError.set('Authentication failed. Please verify server connection.');
      }
    });
  }

  handleLogout(): void {
    this.authService.logout();
    this.showToast('Studio session closed.');
  }

  showToast(msg: string): void {
    this.feedbackToast.set(msg);
    setTimeout(() => this.feedbackToast.set(null), 3000);
  }
}
