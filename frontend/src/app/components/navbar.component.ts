import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ThemeService } from '../services/theme.service';
import { QuestionsService } from '../services/questions.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="navbar-wrapper">
      <div class="container navbar-container">
        <!-- Logo / Brand -->
        <a routerLink="/" class="brand-link" id="nav-brand">
          <div class="brand-avatar">
            <span>P</span>
          </div>
          <div class="brand-text">
            <span class="brand-title">Call Me Prof</span>
            <span class="brand-subtitle">Backend .NET Developer</span>
          </div>
        </a>

        <!-- Desktop Navigation -->
        <nav class="nav-links">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-item" id="nav-home">Home</a>
          <a routerLink="/blog" routerLinkActive="active" class="nav-item" id="nav-blog">Blog</a>
          <a routerLink="/notes" routerLinkActive="active" class="nav-item" id="nav-notes">Academic Notes</a>
          <a routerLink="/ask" routerLinkActive="active" class="nav-item" id="nav-ask">
            Ask
            @if (authService.isAdmin() && pendingQuestionsCount() > 0) {
              <span class="nav-badge">{{ pendingQuestionsCount() }}</span>
            }
          </a>
          <a routerLink="/portfolio" routerLinkActive="active" class="nav-item" id="nav-portfolio">Portfolio</a>
          @if (authService.isAdmin()) {
            <a routerLink="/editor" routerLinkActive="active" class="nav-item admin-link" id="nav-editor">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              Editor
            </a>
          }
        </nav>

        <!-- Right Actions: Theme Toggle & Admin Actions -->
        <div class="nav-actions">
          <!-- Theme Toggle -->
          <button 
            type="button" 
            class="action-btn" 
            (click)="themeService.toggleTheme()" 
            [attr.aria-label]="themeService.isDarkMode() ? 'Switch to light mode' : 'Switch to dark mode'"
            id="theme-toggle-btn"
            title="Toggle Light/Dark Mode"
          >
            @if (themeService.isDarkMode()) {
              <!-- Sun Icon -->
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            } @else {
              <!-- Moon Icon -->
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            }
          </button>

          <!-- Admin Status or Login Button -->
          @if (authService.isAdmin()) {
            <div class="admin-badge-group">
              <span class="badge badge-peach" title="Logged in as Admin">Prof</span>
              <button type="button" class="btn-logout" (click)="authService.logout()" id="nav-logout-btn" title="Log out">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </button>
            </div>
          } @else {
            <button type="button" class="btn-prof-login" (click)="openLoginModal()" id="nav-login-btn" title="Admin Login">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <span>Admin</span>
            </button>
          }

          <!-- Mobile Menu Toggle Button -->
          <button type="button" class="mobile-toggle" (click)="toggleMobileMenu()" aria-label="Toggle menu" id="mobile-menu-btn">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
        </div>
      </div>

      <!-- Mobile Dropdown -->
      @if (mobileMenuOpen()) {
        <div class="mobile-nav-panel">
          <a routerLink="/" (click)="closeMobileMenu()" class="mobile-item">Home</a>
          <a routerLink="/blog" (click)="closeMobileMenu()" class="mobile-item">Blog</a>
          <a routerLink="/notes" (click)="closeMobileMenu()" class="mobile-item">Academic Notes</a>
          <a routerLink="/ask" (click)="closeMobileMenu()" class="mobile-item">Ask a Question</a>
          <a routerLink="/portfolio" (click)="closeMobileMenu()" class="mobile-item">Portfolio</a>
          @if (authService.isAdmin()) {
            <a routerLink="/editor" (click)="closeMobileMenu()" class="mobile-item admin-item">Obsidian Editor & Drawings</a>
          }
        </div>
      }
    </header>
  `,
  styles: [`
    .navbar-wrapper {
      position: sticky;
      top: 0;
      z-index: 100;
      background-color: var(--bg-main);
      border-bottom: 1px solid var(--border-color);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      transition: background-color var(--transition-smooth), border-color var(--transition-smooth);
    }
    .navbar-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 72px;
    }
    .brand-link {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }
    .brand-avatar {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-md);
      background: linear-gradient(135deg, var(--color-warm-peach), var(--color-warm-taupe));
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-heading);
      font-size: 1.35rem;
      color: #2E2A26;
      font-weight: bold;
      box-shadow: 0 2px 8px rgba(204, 190, 177, 0.4);
    }
    .brand-text {
      display: flex;
      flex-direction: column;
    }
    .brand-title {
      font-family: var(--font-heading);
      font-size: 1.35rem;
      line-height: 1.15;
      color: var(--text-primary);
    }
    .brand-subtitle {
      font-size: 0.76rem;
      color: var(--text-muted);
      letter-spacing: 0.02em;
    }
    .nav-links {
      display: flex;
      align-items: center;
      gap: 1.35rem;
      position: relative;
    }
    .nav-item {
      font-size: 0.95rem;
      color: var(--text-secondary);
      position: relative;
      padding: 0.4rem 0.4rem;
      border-radius: var(--radius-xs);
      transition: color 200ms ease, transform 200ms ease;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
    }
    .nav-item::after {
      content: '';
      position: absolute;
      bottom: -3px;
      left: 0;
      right: 0;
      height: 2px;
      background-color: var(--interactive);
      border-radius: 2px;
      transform: scaleX(0);
      transform-origin: center;
      transition: transform 240ms cubic-bezier(0.16, 1, 0.3, 1), background-color 200ms ease;
    }
    .nav-item:hover {
      color: var(--text-primary);
    }
    .nav-item:hover::after {
      transform: scaleX(0.5);
      background-color: var(--color-warm-taupe);
    }
    .nav-item.active {
      color: var(--text-primary);
    }
    .nav-item.active::after {
      transform: scaleX(1);
      background-color: var(--interactive);
    }
    .nav-badge {
      background-color: var(--color-warm-peach);
      color: #2E2A26;
      font-size: 0.72rem;
      font-weight: bold;
      padding: 0.1rem 0.45rem;
      border-radius: var(--radius-full);
    }
    .admin-link {
      color: var(--text-accent);
      background-color: var(--bg-tint-peach);
      padding: 0.35rem 0.75rem;
      border-radius: var(--radius-sm);
      border: 1px solid rgba(255, 219, 187, 0.4);
    }
    .nav-actions {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }
    .action-btn {
      width: 38px;
      height: 38px;
      border-radius: var(--radius-md);
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .action-btn:hover {
      color: var(--text-primary);
      border-color: var(--border-color-focus);
      background-color: var(--bg-card-hover);
    }
    .btn-prof-login {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.4rem 0.8rem;
      font-size: 0.85rem;
      font-weight: 500;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
      background-color: var(--bg-card);
      color: var(--text-secondary);
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .btn-prof-login:hover {
      border-color: var(--interactive);
      color: var(--text-primary);
    }
    .admin-badge-group {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .btn-logout {
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 0.35rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-sm);
    }
    .btn-logout:hover {
      color: var(--text-primary);
    }
    .mobile-toggle {
      display: none;
      background: none;
      border: none;
      color: var(--text-primary);
      cursor: pointer;
      padding: 0.35rem;
    }
    .mobile-nav-panel {
      display: flex;
      flex-direction: column;
      padding: 1rem 1.5rem;
      background-color: var(--bg-card);
      border-bottom: 1px solid var(--border-color);
      gap: 0.75rem;
    }
    .mobile-item {
      padding: 0.5rem 0;
      font-size: 1.05rem;
      color: var(--text-primary);
    }
    @media (max-width: 820px) {
      .nav-links { display: none; }
      .mobile-toggle { display: block; }
    }
  `]
})
export class NavbarComponent {
  authService = inject(AuthService);
  themeService = inject(ThemeService);
  questionsService = inject(QuestionsService);

  mobileMenuOpen = signal<boolean>(false);

  pendingQuestionsCount(): number {
    return this.questionsService.getPendingQuestions().length;
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(v => !v);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  openLoginModal(): void {
    window.dispatchEvent(new CustomEvent('callmeprof-open-login'));
  }
}
