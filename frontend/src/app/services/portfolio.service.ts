import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PortfolioData } from '../models/models';
import { INITIAL_PORTFOLIO, INITIAL_PORTFOLIO_AR } from '../data/initial-data';
import { TranslationService } from './translation.service';
import { tap, catchError, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PortfolioService {
  private readonly API_URL = 'http://localhost:5000/api/portfolio';
  private translationService = inject(TranslationService);
  private rawPortfolio = signal<PortfolioData>(INITIAL_PORTFOLIO);

  // Computes active portfolio: in Arabic mode returns full Egyptian Arabic portfolio, in English mode returns English
  readonly portfolio = computed<PortfolioData>(() => {
    return this.translationService.currentLang() === 'ar' ? INITIAL_PORTFOLIO_AR : this.rawPortfolio();
  });

  constructor(private http: HttpClient) {
    this.fetchPortfolio();
  }

  private fetchPortfolio(): void {
    this.http.get<PortfolioData>(this.API_URL).pipe(
      tap(data => {
        if (data && data.name) {
          this.rawPortfolio.set(data);
        }
      }),
      catchError(() => of(null))
    ).subscribe();
  }
}
