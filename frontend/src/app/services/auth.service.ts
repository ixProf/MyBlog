import { environment } from '../../environments/environment';
import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, tap, catchError, map } from 'rxjs';
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
    if (!token) {
      this.logout();
      return;
    }

    // Set token in state for outgoing requests, but KEEP isAdmin: false until verified by server
    this.authState.set({
      token,
      username: null,
      displayName: null,
      isAdmin: false
    });

    // Verify session token against the backend
    this.verifySession().subscribe();
  }

  verifySession(): Observable<boolean> {
    const token = this.authState().token || localStorage.getItem(this.TOKEN_KEY);
    if (!token) {
      this.logout();
      return of(false);
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<{ username: string; displayName: string; role: string }>(
      `${this.API_URL}/me`,
      { headers, withCredentials: true }
    ).pipe(
      map(res => {
        if (res && res.role === 'Admin') {
          this.authState.set({
            token,
            username: res.username || 'Prof',
            displayName: res.displayName || 'Prof (Mahmoud Sayed Mohamed)',
            isAdmin: true
          });
          return true;
        }
        this.logout();
        return false;
      }),
      catchError(() => {
        this.logout();
        return of(false);
      })
    );
  }

  login(passwordOrUsername: string, password?: string): Observable<{ success: boolean; message?: string }> {
    const payload = password !== undefined
      ? { username: passwordOrUsername, password }
      : { password: passwordOrUsername };

    return new Observable(observer => {
      this.http.post<{ token: string; username: string; displayName: string }>(
        `${this.API_URL}/login`,
        payload,
        { withCredentials: true }
      ).pipe(
        tap(res => {
          this.persistLogin(res.token, res.username, res.displayName);
          observer.next({ success: true });
          observer.complete();
        }),
        catchError(err => {
          const message = err.error?.message || 'Invalid password. Only Prof has access to the editor.';
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
    try {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
      localStorage.removeItem('callmeprof_auth_token');
      localStorage.removeItem('prof_token');
    } catch {}

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
