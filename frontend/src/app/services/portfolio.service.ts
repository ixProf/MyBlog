import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PortfolioData } from '../models/models';
import { INITIAL_PORTFOLIO } from '../data/initial-data';
import { tap, catchError, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PortfolioService {
  private readonly API_URL = 'http://localhost:5000/api/portfolio';
  portfolio = signal<PortfolioData>(INITIAL_PORTFOLIO);

  constructor(private http: HttpClient) {
    this.fetchPortfolio();
  }

  private fetchPortfolio(): void {
    this.http.get<PortfolioData>(this.API_URL).pipe(
      tap(data => {
        if (data && data.name) {
          this.portfolio.set(data);
        }
      }),
      catchError(() => of(null))
    ).subscribe();
  }
}
