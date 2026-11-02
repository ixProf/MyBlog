import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { LiteraryPiece, LiteratureType } from '../models/models';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class LiteratureService {
  private readonly BASE_URL = environment.apiUrl + '/literature';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders(): HttpHeaders | undefined {
    const token = this.authService.getToken();
    return token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;
  }

  getPieces(type?: LiteratureType, search?: string, tag?: string, limit?: number): Observable<LiteraryPiece[]> {
    let params = new HttpParams();
    if (type) params = params.set('type', type);
    if (search && search.trim()) params = params.set('search', search.trim());
    if (tag && tag.trim()) params = params.set('tag', tag.trim());
    if (limit && limit > 0) params = params.set('limit', limit.toString());

    return this.http.get<LiteraryPiece[]>(this.BASE_URL, { params });
  }

  getPieceByDisplayNumber(type: LiteratureType, displayNumber: number): Observable<LiteraryPiece> {
    return this.http.get<LiteraryPiece>(`${this.BASE_URL}/${type}/${displayNumber}`);
  }

  getPieceById(id: number): Observable<LiteraryPiece> {
    return this.http.get<LiteraryPiece>(`${this.BASE_URL}/${id}`);
  }

  heartPiece(id: number, action: 'add' | 'remove'): Observable<{ success: boolean; hearts_count: number }> {
    return this.http.post<{ success: boolean; hearts_count: number }>(`${this.BASE_URL}/${id}/heart`, { action });
  }

  createPiece(piece: {
    type: LiteratureType;
    title: string;
    content: string;
    excerpt?: string | null;
    tags?: string | null;
  }): Observable<LiteraryPiece> {
    const headers = this.getAuthHeaders();
    return this.http.post<LiteraryPiece>(this.BASE_URL, piece, { headers });
  }

  updatePiece(
    id: number,
    piece: {
      type: LiteratureType;
      title: string;
      content: string;
      excerpt?: string | null;
      tags?: string | null;
    }
  ): Observable<LiteraryPiece> {
    const headers = this.getAuthHeaders();
    return this.http.put<LiteraryPiece>(`${this.BASE_URL}/${id}`, piece, { headers });
  }

  deletePiece(id: number): Observable<void> {
    const headers = this.getAuthHeaders();
    return this.http.delete<void>(`${this.BASE_URL}/${id}`, { headers });
  }

  // LocalStorage Heart Helpers
  private getStorageKey(type: string, id: number): string {
    return `prof_liked_literature_${type}_${id}`;
  }

  hasHearted(type: string, id: number): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean(localStorage.getItem(this.getStorageKey(type, id)));
  }

  setHearted(type: string, id: number, liked: boolean): void {
    if (typeof window === 'undefined') return;
    const key = this.getStorageKey(type, id);
    if (liked) {
      localStorage.setItem(key, 'true');
    } else {
      localStorage.removeItem(key);
    }
  }
}
