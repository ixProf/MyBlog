import { Component, input, output, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (totalPages() > 1) {
      <nav class="pagination-nav" [attr.aria-label]="ts.t('common.pagination_label')">
        <!-- Previous Button -->
        <button
          type="button"
          class="pagination-btn pagination-prev"
          [disabled]="currentPage() <= 1"
          (click)="selectPage(currentPage() - 1)"
          [attr.aria-label]="prevLabel()"
        >
          <svg
            class="pagination-arrow"
            [class.rtl-flip]="ts.isRtl()"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          <span>{{ prevLabel() }}</span>
        </button>

        <!-- Page Numbers & Compact Range -->
        <div class="pagination-numbers">
          @for (item of pageNumbers(); track $index) {
            @if (item === '...') {
              <span class="pagination-ellipsis">…</span>
            } @else {
              <button
                type="button"
                class="pagination-number"
                [class.active]="item === currentPage()"
                (click)="selectPage(+item)"
                [attr.aria-current]="item === currentPage() ? 'page' : null"
              >
                {{ item }}
              </button>
            }
          }
        </div>

        <!-- Next Button -->
        <button
          type="button"
          class="pagination-btn pagination-next"
          [disabled]="currentPage() >= totalPages()"
          (click)="selectPage(currentPage() + 1)"
          [attr.aria-label]="nextLabel()"
        >
          <span>{{ nextLabel() }}</span>
          <svg
            class="pagination-arrow"
            [class.rtl-flip]="ts.isRtl()"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </nav>
    }
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .pagination-nav {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-top: 2.5rem;
      flex-wrap: wrap;
    }

    .pagination-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.45rem 1rem;
      font-size: 0.88rem;
      font-family: var(--font-primary, inherit);
      font-weight: 500;
      border-radius: var(--radius-md, 10px);
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      cursor: pointer;
      transition: all var(--transition-fast, 0.15s ease);
      user-select: none;
    }

    .pagination-btn:hover:not(:disabled) {
      background-color: var(--bg-card-hover);
      border-color: var(--color-warm-peach);
      color: var(--text-primary);
    }

    .pagination-btn:disabled {
      opacity: 0.35;
      cursor: not-allowed;
      pointer-events: none;
    }

    .pagination-numbers {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
    }

    .pagination-number {
      min-width: 2.35rem;
      height: 2.35rem;
      padding: 0 0.5rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 0.88rem;
      font-family: var(--font-primary, inherit);
      font-weight: 500;
      border-radius: var(--radius-md, 10px);
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      cursor: pointer;
      transition: all var(--transition-fast, 0.15s ease);
    }

    .pagination-number:hover:not(.active) {
      background-color: var(--bg-card-hover);
      border-color: var(--border-strong, var(--border-color));
      color: var(--text-primary);
    }

    .pagination-number.active {
      background-color: var(--bg-tint-peach, rgba(255, 219, 187, 0.18));
      border-color: var(--color-warm-peach);
      color: var(--text-primary);
      font-weight: 600;
      box-shadow: 0 0 12px rgba(255, 219, 187, 0.2);
    }

    .pagination-ellipsis {
      padding: 0 0.35rem;
      color: var(--text-muted);
      font-size: 0.9rem;
      user-select: none;
    }

    .pagination-arrow {
      transition: transform var(--transition-fast, 0.15s ease);
      flex-shrink: 0;
    }

    .rtl-flip {
      transform: rotate(180deg);
    }
  `]
})
export class PaginationComponent {
  currentPage = input<number>(1);
  totalPages = input<number>(1);
  scrollTarget = input<string | HTMLElement | null>(null);

  pageChange = output<number>();

  ts = inject(TranslationService);

  prevLabel = computed(() => {
    return this.ts.t('common.pagination_prev') || (this.ts.isRtl() ? 'السابق' : 'Previous');
  });

  nextLabel = computed(() => {
    return this.ts.t('common.pagination_next') || (this.ts.isRtl() ? 'التالي' : 'Next');
  });

  pageNumbers = computed<(number | string)[]>(() => {
    const total = this.totalPages();
    const current = Math.min(Math.max(1, this.currentPage()), total);

    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    // Compact range: first, last, current +/- 1, and "..."
    const pages: (number | string)[] = [];
    pages.push(1);

    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    if (start > 2) {
      pages.push('...');
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < total - 1) {
      pages.push('...');
    }

    pages.push(total);
    return pages;
  });

  selectPage(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.currentPage()) {
      return;
    }
    this.pageChange.emit(page);
    this.scrollToTargetIfNeeded();
  }

  private scrollToTargetIfNeeded(): void {
    if (typeof window === 'undefined') return;
    const target = this.scrollTarget();
    let el: HTMLElement | null = null;
    if (typeof target === 'string') {
      el = document.querySelector(target);
    } else if (target instanceof HTMLElement) {
      el = target;
    }
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const offset = 85; // navbar clearance
    // Only scroll smoothly if the top of the element is out of view (above viewport or below bottom)
    if (rect.top < offset || rect.top > window.innerHeight - 100) {
      const targetY = window.scrollY + rect.top - offset;
      window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
    }
  }
}
