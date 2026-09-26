import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <footer class="footer-wrapper">
      <div class="container footer-content">
        <div class="footer-grid">
          <!-- Col 1: Bio & Alias -->
          <div class="footer-col brand-col">
            <h3 class="footer-title">Call Me Prof</h3>
            <p class="footer-desc">
              Mahmoud Sayed Mohamed — Junior/Fresh Backend .NET Developer from Assiut, Egypt.
              A unified digital workshop for architecture notes, backend performance deep dives, and public discussions.
            </p>
            <div class="footer-status-pill">
              <span class="status-dot"></span>
              <span>Available for Backend .NET Engineering Roles & Freelance</span>
            </div>
          </div>

          <!-- Col 2: Navigation -->
          <div class="footer-col">
            <h4 class="col-title">Navigation</h4>
            <ul class="col-links">
              <li><a routerLink="/">Home / Hero</a></li>
              <li><a routerLink="/blog">Blog & Write-ups</a></li>
              <li><a routerLink="/notes">Academic Notes</a></li>
              <li><a routerLink="/ask">Ask a Question</a></li>
              <li><a routerLink="/portfolio">Full Portfolio</a></li>
            </ul>
          </div>

          <!-- Col 3: Academic & Tech -->
          <div class="footer-col">
            <h4 class="col-title">Academic & Focus</h4>
            <ul class="col-links">
              <li><span>Assiut National University</span></li>
              <li><span>Software Engineering Dept</span></li>
              <li><span>High-Throughput Web APIs</span></li>
              <li><span>Distributed Storage & Relational DBs</span></li>
              <li><span>Clean Architecture & xUnit</span></li>
            </ul>
          </div>

          <!-- Col 4: Connect & Profiles -->
          <div class="footer-col">
            <h4 class="col-title">Connect</h4>
            <div class="social-links">
              <a href="https://linkedin.com/in/mahmoud-sayed-mohamed" target="_blank" rel="noopener noreferrer" class="social-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
                <span>LinkedIn</span>
              </a>
              <a href="https://github.com/ixProf" target="_blank" rel="noopener noreferrer" class="social-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
                <span>GitHub (ixProf)</span>
              </a>
            </div>
          </div>
        </div>

        <div class="footer-bottom">
          <p>© 2026 Mahmoud Sayed Mohamed (Prof). All rights reserved.</p>
          <p class="tech-credit">Crafted with Angular 19 & ASP.NET Core Clean Architecture</p>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .footer-wrapper {
      margin-top: 5rem;
      background-color: var(--bg-card);
      border-top: 1px solid var(--border-color);
      padding: 4rem 0 2.5rem 0;
      transition: background-color var(--transition-smooth), border-color var(--transition-smooth);
    }
    .footer-grid {
      display: grid;
      grid-template-columns: 2fr 1fr 1.2fr 1fr;
      gap: 3rem;
      margin-bottom: 3.5rem;
    }
    .brand-col .footer-title {
      font-size: 1.5rem;
      margin-bottom: 0.75rem;
      color: var(--text-primary);
    }
    .footer-desc {
      font-size: 0.95rem;
      color: var(--text-secondary);
      line-height: 1.65;
      margin-bottom: 1.25rem;
      max-width: 380px;
    }
    .footer-status-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8rem;
      padding: 0.35rem 0.8rem;
      border-radius: var(--radius-full);
      background-color: var(--bg-card-secondary);
      border: 1px solid var(--border-subtle);
      color: var(--text-secondary);
    }
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: #10B981;
      display: inline-block;
      box-shadow: 0 0 6px #10B981;
    }
    .col-title {
      font-size: 1.05rem;
      font-weight: 600;
      margin-bottom: 1.15rem;
      color: var(--text-primary);
    }
    .col-links {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }
    .col-links li, .col-links a {
      font-size: 0.92rem;
      color: var(--text-secondary);
      transition: color var(--transition-fast);
    }
    .col-links a:hover {
      color: var(--text-primary);
      text-decoration: underline;
    }
    .social-links {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }
    .social-item {
      display: inline-flex;
      align-items: center;
      gap: 0.65rem;
      font-size: 0.95rem;
      color: var(--text-secondary);
      padding: 0.5rem 0.85rem;
      border-radius: var(--radius-md);
      background-color: var(--bg-card-secondary);
      border: 1px solid var(--border-subtle);
      transition: all var(--transition-fast);
    }
    .social-item:hover {
      color: var(--text-primary);
      border-color: var(--border-color-focus);
      transform: translateY(-2px);
    }
    .footer-bottom {
      border-top: 1px solid var(--border-subtle);
      padding-top: 1.75rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.88rem;
      color: var(--text-muted);
      flex-wrap: wrap;
      gap: 1rem;
    }
    .tech-credit {
      font-family: var(--font-code);
      font-size: 0.82rem;
    }
    @media (max-width: 900px) {
      .footer-grid {
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
      }
    }
    @media (max-width: 580px) {
      .footer-grid {
        grid-template-columns: 1fr;
      }
      .footer-bottom {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `]
})
export class FooterComponent {}
