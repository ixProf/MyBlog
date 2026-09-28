import { environment } from '../../environments/environment';
import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap, catchError } from 'rxjs';
import { AuthState } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'callmeprof_jwt';
  private readonly USER_KEY = 'callmeprof_user';
  private readonly API_URL = environment.apiUrl + '/auth';

  authState = signal<AuthState>({
    token: null,
    username: null,
    displayName: null,
    isAdmin: false
  });

  constructor(private http: HttpClient) {
    this.restoreSession();
  }

  private restoreSession(): void {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const userStr = localStorage.getItem(this.USER_KEY);
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        this.authState.set({
          token,
          username: user.username,
          displayName: user.displayName,
          isAdmin: true
        });
      } catch {
        this.logout();
      }
    }
  }

  login(username: string, password: string): Observable<{ success: boolean; message?: string }> {
    return new Observable(observer => {
      // Try backend first
      this.http.post<{ token: string; username: string; displayName: string }>(`${this.API_URL}/login`, {
        username,
        password
      }).pipe(
        tap(res => {
          this.persistLogin(res.token, res.username, res.displayName);
          observer.next({ success: true });
          observer.complete();
        }),
        catchError(err => {
          // If backend is unreachable or returns error, check local single-admin credentials
          if (username.trim().toLowerCase() === 'prof' && password === 'Prof@2026!') {
            const mockToken = 'mock_jwt_prof_' + Date.now();
            this.persistLogin(mockToken, 'prof', 'Prof (Mahmoud Sayed Mohamed)');
            observer.next({ success: true });
            observer.complete();
            return of(null);
          }

          const message = err.error?.message || 'Invalid username or password. Only Prof has access.';
          observer.next({ success: false, message });
          observer.complete();
          return of(null);
        })
      ).subscribe();
    });
  }

  private persistLogin(token: string, username: string, displayName: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify({ username, displayName }));
    this.authState.set({
      token,
      username,
      displayName,
      isAdmin: true
    });
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.authState.set({
      token: null,
      username: null,
      displayName: null,
      isAdmin: false
    });
  }

  getToken(): string | null {
    return this.authState().token;
  }

  isAdmin(): boolean {
    return this.authState().isAdmin;
  }
}
