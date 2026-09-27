import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ThemeService } from '../services/theme.service';
import { QuestionsService } from '../services/questions.service';
import { TranslationService } from '../services/translation.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="navbar-wrapper">
      <div class="container navbar-container">
        <!-- Logo / Brand -->
        <a routerLink="/" class="brand-link" id="nav-brand">
          <img 
            src="/assets/logo.png" 
            alt="Prof" 
            class="brand-logo-img" 
            width="42" 
            height="42"
          />
          <div class="brand-text">
            <span class="brand-title">{{ translationService.t('nav.brand_title') }}</span>
            <span class="brand-subtitle">{{ translationService.t('nav.brand_subtitle') }}</span>
          </div>
        </a>

        <!-- Desktop Navigation -->
        <nav class="nav-links">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-item" id="nav-home">{{ translationService.t('nav.home') }}</a>
          <a routerLink="/blog" routerLinkActive="active" class="nav-item" id="nav-blog">{{ translationService.t('nav.blog') }}</a>
          <a routerLink="/notes" routerLinkActive="active" class="nav-item" id="nav-notes">{{ translationService.t('nav.notes') }}</a>
          <a routerLink="/ask" routerLinkActive="active" class="nav-item" id="nav-ask">
            {{ translationService.t('nav.ask') }}
            @if (authService.isAdmin() && pendingQuestionsCount() > 0) {
              <span class="nav-badge">{{ pendingQuestionsCount() }}</span>
            }
          </a>
          <a routerLink="/portfolio" routerLinkActive="active" class="nav-item" id="nav-portfolio">{{ translationService.t('nav.portfolio') }}</a>
          @if (authService.isAdmin()) {
            <a routerLink="/editor" routerLinkActive="active" class="nav-item admin-link" id="nav-editor">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              {{ translationService.t('nav.editor') }}
            </a>
          }
        </nav>

        <!-- Right Actions: Language Switcher, Theme Toggle & Admin Actions -->
        <div class="nav-actions">
          <!-- Real Bilingual Toggle (Arabic/English UI) -->
          <button 
            type="button" 
            class="lang-toggle-btn" 
            (click)="translationService.toggleLanguage()" 
            [attr.aria-label]="translationService.currentLang() === 'en' ? 'Switch to Arabic' : 'Switch to English'"
            id="lang-toggle-btn"
            [title]="translationService.t('nav.lang_switch_title')"
          >
            <span class="lang-code" [class.active-lang]="translationService.currentLang() === 'en'">EN</span>
            <span class="lang-divider">/</span>
            <span class="lang-code font-ar" [class.active-lang]="translationService.currentLang() === 'ar'">عربي</span>
          </button>

          <!-- Theme Toggle -->
          <button 
            type="button" 
            class="action-btn" 
            (click)="themeService.toggleTheme()" 
            [attr.aria-label]="themeService.isDarkMode() ? 'Switch to light mode' : 'Switch to dark mode'"
            id="theme-toggle-btn"
            [title]="translationService.t('nav.toggle_theme')"
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
              <button type="button" class="btn-logout" (click)="authService.logout()" id="nav-logout-btn" [title]="translationService.t('nav.logout')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </button>
            </div>
          } @else {
            <button type="button" class="btn-prof-login" (click)="openLoginModal()" id="nav-login-btn" [title]="translationService.t('nav.admin')">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <span>{{ translationService.t('nav.admin') }}</span>
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
          <a routerLink="/" (click)="closeMobileMenu()" class="mobile-item">{{ translationService.t('nav.home') }}</a>
          <a routerLink="/blog" (click)="closeMobileMenu()" class="mobile-item">{{ translationService.t('nav.blog') }}</a>
          <a routerLink="/notes" (click)="closeMobileMenu()" class="mobile-item">{{ translationService.t('nav.notes') }}</a>
          <a routerLink="/ask" (click)="closeMobileMenu()" class="mobile-item">{{ translationService.t('nav.ask') }}</a>
          <a routerLink="/portfolio" (click)="closeMobileMenu()" class="mobile-item">{{ translationService.t('nav.portfolio') }}</a>
          @if (authService.isAdmin()) {
            <a routerLink="/editor" (click)="closeMobileMenu()" class="mobile-item admin-item">{{ translationService.t('nav.editor') }}</a>
          }
          <div class="mobile-lang-row">
            <button 
              type="button" 
              class="mobile-lang-btn" 
              (click)="translationService.toggleLanguage()"
              id="mobile-lang-toggle-btn"
            >
              <span class="lang-icon">🌐</span>
              <span>{{ translationService.currentLang() === 'en' ? 'التبديل إلى العربي' : 'Switch to English' }}</span>
            </button>
          </div>
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
    .brand-logo-img {
      width: 42px;
      height: 42px;
      object-fit: contain;
      display: block;
      background: transparent;
      border: none;
      transition: transform var(--transition-fast);
      flex-shrink: 0;
    }
    .brand-link:hover .brand-logo-img {
      transform: scale(1.06);
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
    .lang-toggle-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      height: 38px;
      padding: 0 0.65rem;
      border-radius: var(--radius-md);
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition-fast);
      user-select: none;
    }
    .lang-toggle-btn:hover {
      color: var(--text-primary);
      border-color: var(--interactive);
      background-color: var(--bg-card-hover);
      transform: translateY(-1px);
    }
    .lang-code {
      transition: color var(--transition-fast), font-weight var(--transition-fast);
      letter-spacing: 0.02em;
    }
    .lang-code.active-lang {
      color: var(--interactive-accent, #E08E58);
      font-weight: 700;
    }
    .lang-divider {
      color: var(--border-strong);
      font-size: 0.75rem;
      opacity: 0.6;
    }
    .font-ar {
      font-family: var(--font-arabic);
      font-size: 0.92rem;
    }
    .mobile-lang-row {
      margin-top: 0.5rem;
      padding-top: 0.75rem;
      border-top: 1px solid var(--border-subtle);
    }
    .mobile-lang-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.6rem;
      width: 100%;
      padding: 0.65rem 0.85rem;
      background-color: var(--bg-surface-tint);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      color: var(--text-primary);
      font-size: 0.95rem;
      cursor: pointer;
      font-family: inherit;
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
  translationService = inject(TranslationService);

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
