import { Component, Input, signal, OnInit, OnDestroy, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TocItem } from '../models/models';
import { TranslationService } from '../services/translation.service';

@Component({
  selector: 'app-table-of-contents',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (items && items.length > 0) {
      <div class="toc-container">
        <!-- Mobile Collapsible Header (<=980px) -->
        <button 
          type="button" 
          class="toc-mobile-toggle"
          (click)="isOpen.set(!isOpen())"
          aria-label="Toggle Table of Contents"
        >
          <div class="toc-mobile-title">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            <span>{{ ts.t('toc.on_this_page') }}</span>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="chevron" [class.rotated]="isOpen()"><polyline points="6 9 12 15 18 9"/></svg>
        </button>

        <!-- Desktop Header & Content (Always visible on desktop >980px, collapsible on mobile) -->
        <div class="toc-body" [class.is-open]="isOpen()">
          <div class="toc-desktop-header">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            <span class="toc-title">{{ ts.t('toc.on_this_page') }}</span>
          </div>

          <nav class="toc-nav" aria-label="Table of contents">
            <ng-container *ngTemplateOutlet="tocTree; context: { $implicit: items }"></ng-container>
          </nav>
        </div>
      </div>

      <!-- Recursive TOC Template -->
      <ng-template #tocTree let-nodes>
        <ul class="toc-list">
          @for (node of nodes; track node.id) {
            <li class="toc-item level-{{ node.level }}">
              <a 
                [href]="'#' + node.id" 
                class="toc-link" 
                [class.active]="activeId() === node.id"
                (click)="onLinkClick($event, node.id)"
              >
                <span class="toc-text">{{ node.text }}</span>
              </a>

              @if (node.children && node.children.length > 0) {
                <div class="toc-nested">
                  <ng-container *ngTemplateOutlet="tocTree; context: { $implicit: node.children }"></ng-container>
                </div>
              }
            </li>
          }
        </ul>
      </ng-template>
    }
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
    .toc-container {
      width: 100%;
    }
    /* Desktop Header */
    .toc-desktop-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-muted);
      margin-bottom: 0.85rem;
      user-select: none;
    }
    .toc-title {
      color: var(--text-primary);
    }
    .toc-mobile-toggle {
      display: none;
    }
    .toc-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .toc-item {
      position: relative;
    }
    .toc-item.level-2 {
      padding-left: 0.75rem;
    }
    .toc-item.level-3 {
      padding-left: 1.35rem;
    }
    .toc-item.level-4 {
      padding-left: 1.85rem;
    }
    .toc-link {
      display: block;
      font-size: 0.88rem;
      line-height: 1.45;
      color: var(--text-secondary);
      padding: 0.3rem 0.5rem;
      border-radius: var(--radius-xs);
      transition: all var(--transition-fast);
      text-decoration: none;
      user-select: none;
      outline: none;
    }
    .toc-link:hover {
      color: var(--text-primary);
      background-color: var(--bg-surface-tint);
    }
    .toc-link.active {
      color: var(--text-primary);
      font-weight: 600;
      background-color: var(--bg-surface-tint);
      border-left: 2px solid var(--interactive);
      padding-left: 0.65rem;
    }
    :host-context(html.dark) .toc-link.active {
      border-left-color: var(--color-warm-peach);
    }
    .toc-nested {
      margin-top: 0.25rem;
    }

    /* Mobile view (<= 980px) */
    @media (max-width: 980px) {
      .toc-desktop-header {
        display: none;
      }
      .toc-container {
        background-color: var(--bg-surface);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        padding: 0.75rem 1rem;
      }
      .toc-mobile-toggle {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        background: none;
        border: none;
        padding: 0;
        cursor: pointer;
        font-family: inherit;
        color: var(--text-primary);
      }
      .toc-mobile-title {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.9rem;
        font-weight: 600;
      }
      .chevron {
        transition: transform var(--transition-fast);
      }
      .chevron.rotated {
        transform: rotate(180deg);
      }
      .toc-body {
        display: none;
        margin-top: 0.75rem;
        padding-top: 0.75rem;
        border-top: 1px solid var(--border-subtle);
        max-height: 320px;
        overflow-y: auto;
      }
      .toc-body.is-open {
        display: block;
      }
    }
  `]
})
export class TableOfContentsComponent implements OnInit, OnDestroy {
  @Input() items: TocItem[] = [];

  ts = inject(TranslationService);
  activeId = signal<string>('');
  isOpen = signal<boolean>(false);

  private headingElements: HTMLElement[] = [];
  private ticking = false;

  ngOnInit(): void {
    setTimeout(() => {
      this.initScrollspy();
    }, 250);
  }

  ngOnDestroy(): void {
    this.headingElements = [];
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (!this.ticking) {
      window.requestAnimationFrame(() => {
        if (!this.headingElements || this.headingElements.length === 0) {
          this.collectHeadings();
        }
        this.updateActiveHeading();
        this.ticking = false;
      });
      this.ticking = true;
    }
  }

  private collectHeadings(): void {
    const list: HTMLElement[] = [];
    const collectFromNodes = (nodes: TocItem[]) => {
      for (const node of nodes) {
        const el = document.getElementById(node.id);
        if (el) list.push(el);
        if (node.children && node.children.length > 0) {
          collectFromNodes(node.children);
        }
      }
    };
    collectFromNodes(this.items);
    this.headingElements = list;
  }

  private initScrollspy(): void {
    this.collectHeadings();
    if (this.headingElements.length > 0) {
      this.activeId.set(this.headingElements[0].id);
    }
  }

  private updateActiveHeading(): void {
    if (this.headingElements.length === 0) return;

    const scrollY = window.scrollY || window.pageYOffset;
    const headerOffset = 110;

    let currentActiveId = this.headingElements[0].id;

    for (const el of this.headingElements) {
      const top = el.getBoundingClientRect().top + scrollY - headerOffset;
      if (scrollY >= top - 20) {
        currentActiveId = el.id;
      } else {
        break;
      }
    }

    this.activeId.set(currentActiveId);
  }

  onLinkClick(event: MouseEvent, id: string): void {
    event.preventDefault();
    this.isOpen.set(false);

    const el = document.getElementById(id);
    if (el) {
      const headerOffset = 90;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });

      this.activeId.set(id);
      window.history.pushState(null, '', '#' + id);
    }
  }
}
