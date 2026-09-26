import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    @if (isOpen()) {
      <div class="modal-backdrop" (click)="close()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="header-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <div>
              <h3 class="modal-title">Admin Access — Prof Only</h3>
              <p class="modal-subtitle">Single-admin authentication for Mahmoud Sayed Mohamed</p>
            </div>
            <button class="close-btn" (click)="close()" aria-label="Close modal">✕</button>
          </div>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="modal-form">
            @if (errorMessage()) {
              <div class="alert-error">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span>{{ errorMessage() }}</span>
              </div>
            }

            <div class="form-group">
              <label for="login-username">Username</label>
              <input 
                id="login-username" 
                type="text" 
                formControlName="username" 
                class="input" 
                placeholder="prof" 
                autocomplete="username"
              />
            </div>

            <div class="form-group">
              <label for="login-password">Password</label>
              <input 
                id="login-password" 
                type="password" 
                formControlName="password" 
                class="input" 
                placeholder="••••••••••••" 
                autocomplete="current-password"
              />
            </div>

            <div class="credentials-hint">
              <span class="hint-label">Default Admin:</span>
              <code>prof</code> &nbsp;/&nbsp; <code>Prof&#64;2026!</code>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" (click)="close()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="form.invalid || isLoading()" id="login-submit-btn">
                @if (isLoading()) {
                  <span>Authenticating...</span>
                } @else {
                  <span>Sign In as Prof</span>
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 1000;
      background-color: rgba(28, 25, 23, 0.65);
      backdrop-filter: blur(6px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }
    .modal-card {
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      width: 100%;
      max-width: 440px;
      padding: 2rem;
      box-shadow: var(--shadow-lg);
      animation: modalFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes modalFadeIn {
      from { opacity: 0; transform: scale(0.96) translateY(8px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
    .modal-header {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 1.5rem;
      position: relative;
    }
    .header-icon {
      width: 42px;
      height: 42px;
      border-radius: var(--radius-md);
      background-color: var(--bg-tint-peach);
      color: var(--text-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .modal-title {
      font-size: 1.35rem;
      color: var(--text-primary);
      margin-bottom: 0.25rem;
    }
    .modal-subtitle {
      font-size: 0.85rem;
      color: var(--text-muted);
    }
    .close-btn {
      position: absolute;
      top: -0.25rem;
      right: -0.25rem;
      background: none;
      border: none;
      font-size: 1.25rem;
      color: var(--text-muted);
      cursor: pointer;
      padding: 0.25rem;
      border-radius: var(--radius-sm);
    }
    .close-btn:hover {
      color: var(--text-primary);
    }
    .modal-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
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
    .credentials-hint {
      background-color: var(--bg-card-secondary);
      border: 1px dashed var(--border-color);
      border-radius: var(--radius-sm);
      padding: 0.65rem 0.85rem;
      font-size: 0.82rem;
      color: var(--text-secondary);
      display: flex;
      align-items: center;
    }
    .hint-label {
      font-weight: 600;
      margin-right: 0.4rem;
    }
    .credentials-hint code {
      background-color: var(--bg-code);
      padding: 0.15rem 0.35rem;
      border-radius: 4px;
      font-family: var(--font-code);
      color: var(--text-accent);
    }
    .alert-error {
      background-color: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #EF4444;
      padding: 0.75rem 1rem;
      border-radius: var(--radius-md);
      font-size: 0.88rem;
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }
  `]
})
export class LoginModalComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  fb = inject(FormBuilder);

  isOpen = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  form = this.fb.group({
    username: ['prof', [Validators.required]],
    password: ['Prof@2026!', [Validators.required]]
  });

  private listener = () => this.open();

  ngOnInit(): void {
    window.addEventListener('callmeprof-open-login', this.listener);
  }

  ngOnDestroy(): void {
    window.removeEventListener('callmeprof-open-login', this.listener);
  }

  open(): void {
    this.isOpen.set(true);
    this.errorMessage.set(null);
  }

  close(): void {
    this.isOpen.set(false);
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { username, password } = this.form.value;

    this.authService.login(username!, password!).subscribe({
      next: res => {
        this.isLoading.set(false);
        if (res.success) {
          this.close();
        } else {
          this.errorMessage.set(res.message || 'Login failed. Please check credentials.');
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Connection error. Please try again.');
      }
    });
  }
}
