import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PortfolioService } from '../services/portfolio.service';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="portfolio-page">
      <div class="container">
        <!-- Header / Hero Summary -->
        <header class="portfolio-header">
          <div class="header-badge">
            <span class="badge-dot"></span>
            <span>Production Engineering Portfolio</span>
          </div>

          <h1 class="page-title">{{ p().name }}</h1>
          <div class="persona-sub">
            <span class="alias-pill">Alias: "{{ p().alias }}"</span>
            <span class="role-pill">{{ p().title }}</span>
            <span class="location-pill">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {{ p().location }}
            </span>
          </div>

          <p class="summary-paragraph">
            {{ p().summary }}
          </p>

          <div class="portfolio-links-row">
            <a [href]="p().links.linkedIn" target="_blank" rel="noopener noreferrer" class="btn btn-primary" id="portfolio-linkedin-btn">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
              <span>Connect on LinkedIn</span>
            </a>
            <a [href]="p().links.gitHub" target="_blank" rel="noopener noreferrer" class="btn btn-secondary" id="portfolio-github-btn">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
              <span>GitHub (ixProf)</span>
            </a>
          </div>
        </header>

        <!-- Metric Highlight Grid -->
        <section class="metrics-grid">
          @for (m of p().metrics; track m.label) {
            <div class="metric-card card">
              <span class="metric-num">{{ m.value }}</span>
              <span class="metric-lbl">{{ m.label }}</span>
            </div>
          }
        </section>

        <!-- FEATURED PROJECTS -->
        <section class="portfolio-section">
          <div class="section-title-wrap">
            <span class="section-label">Delivered Systems</span>
            <h2 class="section-title">Production Projects & Architecture</h2>
          </div>

          <div class="projects-list">
            @for (proj of p().projects; track proj.title) {
              <div class="project-card card card-interactive">
                <div class="proj-header">
                  <div class="proj-title-group">
                    <h3 class="proj-title">{{ proj.title }}</h3>
                    <a [href]="proj.url" target="_blank" rel="noopener noreferrer" class="proj-url-badge">
                      <span>{{ proj.url.replace('https://', '') }}</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    </a>
                  </div>
                </div>

                <p class="proj-highlights">{{ proj.highlights }}</p>

                <div class="proj-tags">
                  @for (t of proj.tags; track t) {
                    <span class="badge badge-peach">{{ t }}</span>
                  }
                </div>
              </div>
            }
          </div>
        </section>

        <!-- WORK EXPERIENCE -->
        <section class="portfolio-section">
          <div class="section-title-wrap">
            <span class="section-label">Track Record</span>
            <h2 class="section-title">Work Experience</h2>
          </div>

          <div class="timeline">
            @for (exp of p().experience; track exp.company) {
              <div class="timeline-item">
                <div class="timeline-dot"></div>
                <div class="timeline-card card">
                  <div class="exp-header">
                    <div>
                      <h3 class="exp-role">{{ exp.role }}</h3>
                      <h4 class="exp-company">{{ exp.company }} &bull; <span class="exp-loc">{{ exp.location }}</span></h4>
                    </div>
                    <span class="exp-period badge">{{ exp.period }}</span>
                  </div>
                  <p class="exp-details">{{ exp.details }}</p>
                </div>
              </div>
            }
          </div>
        </section>

        <!-- TECHNICAL SKILLS TAXONOMY -->
        <section class="portfolio-section">
          <div class="section-title-wrap">
            <span class="section-label">Competencies</span>
            <h2 class="section-title">Technical Skills</h2>
          </div>

          <div class="skills-grid">
            @for (cat of p().technicalSkills; track cat.category) {
              <div class="skill-category-card card">
                <h3 class="cat-title">{{ cat.category }}</h3>
                <div class="cat-tags">
                  @for (item of cat.items; track item) {
                    <span class="skill-pill">{{ item }}</span>
                  }
                </div>
              </div>
            }
          </div>
        </section>

        <!-- EDUCATION & TRAINING ROW -->
        <section class="portfolio-section">
          <div class="edu-training-grid">
            <!-- Education -->
            <div class="edu-col">
              <div class="section-title-wrap">
                <span class="section-label">Academic Background</span>
                <h2 class="section-title">Education</h2>
              </div>
              <div class="edu-card card">
                <div class="edu-icon-wrap">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                </div>
                <div class="edu-info">
                  <h3 class="edu-degree">{{ p().education.degree }}</h3>
                  <h4 class="edu-inst">{{ p().education.institution }}</h4>
                  <p class="edu-meta">{{ p().education.period }} &bull; {{ p().education.location }}</p>
                </div>
              </div>
            </div>

            <!-- Training -->
            <div class="training-col">
              <div class="section-title-wrap">
                <span class="section-label">Certifications & Tracks</span>
                <h2 class="section-title">Specialized Programs</h2>
              </div>
              <div class="training-cards">
                @for (tr of p().training; track tr.program) {
                  <div class="training-card card">
                    <div class="tr-header">
                      <h4 class="tr-program">{{ tr.program }}</h4>
                      <span class="badge">{{ tr.period }}</span>
                    </div>
                    <p class="tr-track">{{ tr.track }}</p>
                  </div>
                }
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .portfolio-page {
      padding: 3rem 0 6rem 0;
    }
    .portfolio-header {
      margin-bottom: 3.5rem;
    }
    .header-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.3rem 0.75rem;
      border-radius: var(--radius-pill);
      background-color: var(--bg-surface-tint);
      border: 1px solid var(--border-color);
      font-size: 0.82rem;
      color: var(--text-secondary);
      margin-bottom: 1.25rem;
    }
    .badge-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background-color: var(--color-dark-taupe);
    }
    .page-title {
      font-size: 3.25rem;
      line-height: 1.1;
      margin-bottom: 0.65rem;
    }
    .persona-sub {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.65rem;
      margin-bottom: 1.5rem;
    }
    .alias-pill {
      font-size: 1.15rem;
      color: var(--color-dark-taupe);
      background-color: var(--bg-surface-tint);
      padding: 0.2rem 0.75rem;
      border-radius: var(--radius-xs);
      border: 1px solid var(--border-color);
    }
    :host-context(html.dark) .alias-pill {
      color: #FFDBBB;
    }
    .role-pill, .location-pill {
      font-size: 0.92rem;
      color: var(--text-secondary);
      background-color: var(--bg-surface);
      border: 1px solid var(--border-color);
      padding: 0.25rem 0.75rem;
      border-radius: var(--radius-xs);
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
    }
    .summary-paragraph {
      font-size: 1.12rem;
      color: var(--text-secondary);
      line-height: 1.8;
      max-width: 820px;
      margin-bottom: 2rem;
    }
    .portfolio-links-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.85rem;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.25rem;
      margin-bottom: 4.5rem;
    }
    .metric-card {
      padding: 1.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .metric-num {
      font-size: 2.5rem;
      color: var(--text-primary);
      line-height: 1;
    }
    .metric-lbl {
      font-size: 0.88rem;
      color: var(--text-secondary);
    }
    .portfolio-section {
      margin-bottom: 4.5rem;
    }
    .section-title-wrap {
      margin-bottom: 2rem;
    }
    .section-label {
      font-size: 0.82rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-muted);
      margin-bottom: 0.35rem;
      display: block;
    }
    .section-title {
      font-size: 2.1rem;
    }
    .projects-list {
      display: flex;
      flex-direction: column;
      gap: 1.75rem;
    }
    .project-card {
      padding: 2.25rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .proj-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
    }
    .proj-title {
      font-size: 1.55rem;
      margin-bottom: 0.4rem;
    }
    .proj-url-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.85rem;
      color: var(--text-link);
      background-color: var(--bg-surface-tint);
      border: 1px solid var(--border-color);
      padding: 0.2rem 0.65rem;
      border-radius: var(--radius-xs);
    }
    .proj-url-badge:hover {
      text-decoration: underline;
    }
    .proj-highlights {
      font-size: 1.02rem;
      color: var(--text-secondary);
      line-height: 1.75;
    }
    .proj-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.45rem;
    }
    .timeline {
      position: relative;
      padding-left: 2rem;
      display: flex;
      flex-direction: column;
      gap: 1.75rem;
    }
    .timeline::before {
      content: '';
      position: absolute;
      left: 7px;
      top: 10px;
      bottom: 10px;
      width: 2px;
      background-color: var(--border-color);
    }
    .timeline-item {
      position: relative;
    }
    .timeline-dot {
      position: absolute;
      left: -2rem;
      top: 1.5rem;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background-color: var(--bg-main);
      border: 3px solid var(--color-dark-taupe);
    }
    :host-context(html.dark) .timeline-dot {
      border-color: #FFDBBB;
    }
    .timeline-card {
      padding: 2rem;
    }
    .exp-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 1rem;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
    .exp-role {
      font-size: 1.35rem;
      margin-bottom: 0.25rem;
    }
    .exp-company {
      font-size: 0.95rem;
      color: var(--text-secondary);
      font-weight: normal;
    }
    .exp-loc {
      color: var(--text-muted);
    }
    .exp-details {
      font-size: 0.98rem;
      color: var(--text-secondary);
      line-height: 1.75;
    }
    .skills-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(310px, 1fr));
      gap: 1.25rem;
    }
    .skill-category-card {
      padding: 1.75rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .cat-title {
      font-size: 1.15rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--border-subtle);
    }
    .cat-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.45rem;
    }
    .skill-pill {
      font-size: 0.85rem;
      padding: 0.3rem 0.7rem;
      border-radius: var(--radius-xs);
      background-color: var(--bg-surface-tint);
      border: 1px solid var(--border-subtle);
      color: var(--text-primary);
    }
    .edu-training-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }
    .edu-card {
      display: flex;
      align-items: flex-start;
      gap: 1.25rem;
      padding: 2rem;
    }
    .edu-icon-wrap {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-xs);
      background-color: var(--bg-surface-tint);
      border: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-dark-taupe);
      flex-shrink: 0;
    }
    :host-context(html.dark) .edu-icon-wrap {
      color: #FFDBBB;
    }
    .edu-degree {
      font-size: 1.25rem;
      margin-bottom: 0.35rem;
    }
    .edu-inst {
      font-size: 1rem;
      color: var(--text-secondary);
      margin-bottom: 0.45rem;
      font-weight: normal;
    }
    .edu-meta {
      font-size: 0.85rem;
      color: var(--text-muted);
    }
    .training-cards {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .training-card {
      padding: 1.5rem;
    }
    .tr-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.4rem;
    }
    .tr-program {
      font-size: 1.1rem;
    }
    .tr-track {
      font-size: 0.92rem;
      color: var(--text-secondary);
    }
    @media (max-width: 850px) {
      .edu-training-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class PortfolioComponent {
  portfolioService = inject(PortfolioService);
  p = () => this.portfolioService.portfolio();
}
