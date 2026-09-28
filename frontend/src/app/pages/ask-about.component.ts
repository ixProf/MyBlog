import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AskService } from '../services/ask.service';
import { TranslationService } from '../services/translation.service';
import { FeedStats, ProfileBio } from '../models/models';

@Component({
  selector: 'app-ask-about',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <main class="about-page-wrapper">
      <div class="container-narrow">
        <!-- Back Navigation -->
        <div class="back-nav-row">
          <a routerLink="/ask" class="back-link">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            <span>{{ ts.t('ask.back_to_qa') }}</span>
          </a>
        </div>

        <!-- Header -->
        <header class="about-hero">
          <h1 class="hero-title">
            {{ ts.t('ask.about_title') }}<span class="brand-accent">.</span>
          </h1>
          <p class="hero-subtitle">
            {{ (ts.currentLang() === 'ar' ? profile().name_ar : profile().name_en) || 'Mahmoud Sayed Mohamed' }}
            <span class="accent-dot">•</span>
            {{ ts.t('ask.hero_sub') }}
          </p>
        </header>

        <!-- Main Bio Card -->
        <section class="bio-card card">
          <h2 class="section-heading">{{ ts.t('ask.about_bg_heading') }}</h2>
          <p class="bio-text">
            {{ (ts.currentLang() === 'ar' ? profile().bio_ar : profile().bio_en) || ts.t('footer.bio') }}
          </p>

          <h2 class="section-heading" style="margin-top: 2rem;">{{ ts.t('ask.about_terminal_heading') }}</h2>
          <p class="bio-text">
            {{ ts.t('ask.about_terminal_desc') }}
          </p>

          <!-- Live Stats Row (computed from Questions table) -->
          <div class="stats-pill-row">
            <div class="stat-pill-item">
              <strong class="stat-number">{{ stats().total_answered }}</strong>
              <span class="stat-label">{{ ts.t('ask.answers_published') }}</span>
            </div>
            <span class="accent-dot">•</span>
            <div class="stat-pill-item">
              <strong class="stat-number">{{ stats().total_likes }}</strong>
              <span class="stat-label">{{ ts.t('ask.community_likes') }}</span>
            </div>
          </div>
        </section>

        <!-- Verified Profiles Links Grid -->
        <section class="profiles-section">
          <h3 class="profiles-heading">{{ ts.t('ask.verified_profiles') }}</h3>
          <div class="profiles-grid">
            <a
              [href]="profile().linkedin || 'https://www.linkedin.com/in/mahmoud-sayed-mohamed'"
              target="_blank"
              rel="noopener noreferrer"
              class="profile-link-card card"
            >
              <div class="platform-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
              </div>
              <div class="profile-link-info">
                <span class="platform-name">LinkedIn</span>
                <span class="platform-handle">/in/mahmoud-sayed-mohamed</span>
              </div>
            </a>

            <a
              [href]="profile().github || 'https://github.com/ixProf'"
              target="_blank"
              rel="noopener noreferrer"
              class="profile-link-card card"
            >
              <div class="platform-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
              </div>
              <div class="profile-link-info">
                <span class="platform-name">GitHub</span>
                <span class="platform-handle">&#64;ixProf</span>
              </div>
            </a>

            <a
              href="https://x.com/v2PROF"
              target="_blank"
              rel="noopener noreferrer"
              class="profile-link-card card"
            >
              <div class="platform-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg>
              </div>
              <div class="profile-link-info">
                <span class="platform-name">X (Twitter)</span>
                <span class="platform-handle">&#64;v2PROF</span>
              </div>
            </a>
          </div>
        </section>

        <!-- CTA Bottom -->
        <div class="cta-bottom">
          <a routerLink="/ask" fragment="ask-section" class="btn btn-primary cta-btn">
            {{ ts.t('ask.ask_question_btn') }}
          </a>
        </div>
      </div>
    </main>
  `,
  styles: [`
    .about-page-wrapper {
      padding: 2.5rem 0 6rem 0;
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

    .about-hero {
      margin-bottom: 2rem;
    }
    .hero-title {
      font-size: 2.4rem;
      color: var(--text-primary);
      margin-bottom: 0.35rem;
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

    /* Bio Card */
    .bio-card {
      background-color: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-surface);
      padding: 2.25rem 2.5rem;
      margin-bottom: 2.5rem;
    }
    .section-heading {
      font-size: 1.35rem;
      color: var(--text-primary);
      margin-bottom: 0.75rem;
    }
    .bio-text {
      font-size: 1.05rem;
      line-height: 1.8;
      color: var(--text-secondary);
    }

    /* Stats pill row */
    .stats-pill-row {
      display: inline-flex;
      align-items: center;
      gap: 1.25rem;
      margin-top: 2rem;
      padding: 0.85rem 1.4rem;
      background-color: var(--bg-surface-tint);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-pill);
    }
    .stat-pill-item {
      display: flex;
      align-items: baseline;
      gap: 0.4rem;
    }
    .stat-number {
      font-size: 1.25rem;
      color: var(--text-primary);
    }
    .stat-label {
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    /* Profiles */
    .profiles-section {
      margin-bottom: 3rem;
    }
    .profiles-heading {
      font-size: 1.15rem;
      color: var(--text-primary);
      margin-bottom: 1rem;
      letter-spacing: 0.02em;
    }
    .profiles-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
    }
    .profile-link-card {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      padding: 1.15rem 1.25rem;
      background-color: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      transition: all var(--transition-fast);
      text-decoration: none;
    }
    .profile-link-card:hover {
      border-color: var(--card-hover-border);
      box-shadow: var(--shadow-card-hover);
      transform: translateY(-2px);
    }
    .platform-icon {
      color: var(--interactive-accent);
      flex-shrink: 0;
    }
    .profile-link-info {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .platform-name {
      font-size: 0.95rem;
      color: var(--text-primary);
      font-weight: 500;
    }
    .platform-handle {
      font-size: 0.8rem;
      color: var(--text-muted);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* CTA Bottom */
    .cta-bottom {
      text-align: center;
      padding-top: 1rem;
    }
    .cta-btn {
      padding: 0.75rem 2rem;
      font-size: 1rem;
    }

    @media (max-width: 640px) {
      .bio-card {
        padding: 1.5rem 1.25rem;
      }
      .stats-pill-row {
        flex-direction: column;
        border-radius: var(--radius-md);
        align-items: flex-start;
        gap: 0.5rem;
        width: 100%;
      }
      .stats-pill-row .accent-dot {
        display: none;
      }
    }
  `]
})
export class AskAboutComponent implements OnInit {
  private askService = inject(AskService);
  ts = inject(TranslationService);

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

  ngOnInit(): void {
    this.askService.getStats().subscribe({
      next: (res) => {
        if (res && res.stats) this.stats.set(res.stats);
        if (res && res.profile) this.profile.set(res.profile);
      },
      error: (err) => console.error('Failed to load stats:', err)
    });
  }
}
