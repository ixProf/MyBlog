import { environment } from '../../environments/environment';
import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, tap, catchError } from 'rxjs';
import { AcademicNote, GroupedSubject } from '../models/models';
import { INITIAL_ACADEMIC_NOTES } from '../data/initial-data';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class NotesService {
  private readonly API_URL = environment.apiUrl + '/notes';
  private readonly STORAGE_KEY = 'callmeprof_academic_notes';
  private readonly SUBJECTS_STORAGE_KEY = 'callmeprof_subjects';

  notes = signal<AcademicNote[]>([]);
  subjects = signal<string[]>([]);

  constructor(private http: HttpClient, private authService: AuthService) {
    this.loadInitialNotes();
  }

  private loadInitialNotes(): void {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    const savedSubjects = localStorage.getItem(this.SUBJECTS_STORAGE_KEY);
    if (saved) {
      try {
        this.notes.set(JSON.parse(saved));
      } catch {
        this.notes.set(INITIAL_ACADEMIC_NOTES);
      }
    } else {
      this.notes.set(INITIAL_ACADEMIC_NOTES);
    }

    if (savedSubjects) {
      try {
        this.subjects.set(JSON.parse(savedSubjects));
      } catch {
        this.deriveSubjectsFromNotes();
      }
    } else {
      this.deriveSubjectsFromNotes();
    }

    this.syncWithBackend();
  }

  private deriveSubjectsFromNotes(): void {
    const set = new Set<string>();
    this.notes().forEach(n => set.add(n.subject));
    this.subjects.set(Array.from(set).sort((a, b) => a.localeCompare(b)));
  }

  syncWithBackend(): void {
    this.http.get<{ allNotes: AcademicNote[]; subjects?: string[] }>(this.API_URL).pipe(
      tap(res => {
        if (res && res.allNotes && res.allNotes.length > 0) {
          this.notes.set(res.allNotes);
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(res.allNotes));
        }
        if (res && res.subjects && res.subjects.length > 0) {
          this.subjects.set(res.subjects);
          localStorage.setItem(this.SUBJECTS_STORAGE_KEY, JSON.stringify(res.subjects));
        } else {
          this.deriveSubjectsFromNotes();
        }
      }),
      catchError(() => of(null))
    ).subscribe();
  }

  getGroupedSubjects(search?: string): GroupedSubject[] {
    let list = this.notes();
    const hasSearch = !!(search && search.trim());
    if (hasSearch) {
      const s = search!.trim().toLowerCase();
      list = list.filter(n => 
        n.title.toLowerCase().includes(s) || 
        n.subject.toLowerCase().includes(s) || 
        n.content.toLowerCase().includes(s)
      );
    }

    // Collect all subjects: known subjects list + distinct from notes
    const allSubjects = new Set<string>(this.subjects());
    list.forEach(n => allSubjects.add(n.subject));

    const map = new Map<string, typeof list>();
    allSubjects.forEach(subj => map.set(subj, []));

    list.forEach(n => {
      if (!map.has(n.subject)) {
        map.set(n.subject, []);
      }
      map.get(n.subject)!.push(n);
    });

    const result: GroupedSubject[] = [];
    map.forEach((items, subject) => {
      // If searching, hide empty folders unless the subject name itself matched the search
      if (hasSearch && items.length === 0 && !subject.toLowerCase().includes(search!.trim().toLowerCase())) {
        return;
      }
      items.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
      result.push({
        subject,
        count: items.length,
        notes: items
      });
    });

    result.sort((a, b) => a.subject.localeCompare(b.subject));
    return result;
  }

  getNoteBySlug(slug: string): AcademicNote | undefined {
    return this.notes().find(n => n.slug === slug || String(n.id) === slug);
  }

  getAvailableSubjects(): string[] {
    const subjects = new Set<string>(this.subjects());
    this.notes().forEach(n => subjects.add(n.subject));
    return Array.from(subjects).sort((a, b) => a.localeCompare(b));
  }

  createSubject(name: string): Observable<boolean> {
    const token = this.authService.getToken();
    const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;
    const trimmed = name.trim();

    return new Observable(observer => {
      this.http.post(`${this.API_URL}/subjects`, { name: trimmed }, { headers }).pipe(
        tap(() => {
          if (!this.subjects().includes(trimmed)) {
            const updated = [...this.subjects(), trimmed].sort((a, b) => a.localeCompare(b));
            this.subjects.set(updated);
            localStorage.setItem(this.SUBJECTS_STORAGE_KEY, JSON.stringify(updated));
          }
          observer.next(true);
          observer.complete();
        }),
        catchError(() => {
          // Local fallback
          if (!this.subjects().includes(trimmed)) {
            const updated = [...this.subjects(), trimmed].sort((a, b) => a.localeCompare(b));
            this.subjects.set(updated);
            localStorage.setItem(this.SUBJECTS_STORAGE_KEY, JSON.stringify(updated));
          }
          observer.next(true);
          observer.complete();
          return of(null);
        })
      ).subscribe();
    });
  }

  deleteSubject(name: string): Observable<boolean> {
    const token = this.authService.getToken();
    const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;
    const trimmed = name.trim();

    return new Observable(observer => {
      this.http.delete(`${this.API_URL}/subjects/${encodeURIComponent(trimmed)}`, { headers }).pipe(
        tap(() => {
          this.subjects.update(list => list.filter(s => s.toLowerCase() !== trimmed.toLowerCase()));
          this.notes.update(list => list.filter(n => n.subject.toLowerCase() !== trimmed.toLowerCase()));
          localStorage.setItem(this.SUBJECTS_STORAGE_KEY, JSON.stringify(this.subjects()));
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.notes()));
          observer.next(true);
          observer.complete();
        }),
        catchError(() => {
          this.subjects.update(list => list.filter(s => s.toLowerCase() !== trimmed.toLowerCase()));
          this.notes.update(list => list.filter(n => n.subject.toLowerCase() !== trimmed.toLowerCase()));
          localStorage.setItem(this.SUBJECTS_STORAGE_KEY, JSON.stringify(this.subjects()));
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.notes()));
          observer.next(true);
          observer.complete();
          return of(null);
        })
      ).subscribe();
    });
  }

  createNote(data: { subject: string; title: string; content: string; order: number }): Observable<AcademicNote> {
    const token = this.authService.getToken();
    const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;

    return new Observable(observer => {
      this.http.post<AcademicNote>(this.API_URL, data, { headers }).pipe(
        tap(created => {
          this.notes.update(list => [...list, created]);
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.notes()));
          if (!this.subjects().includes(data.subject)) {
            const updatedSubjects = [...this.subjects(), data.subject].sort((a, b) => a.localeCompare(b));
            this.subjects.set(updatedSubjects);
            localStorage.setItem(this.SUBJECTS_STORAGE_KEY, JSON.stringify(updatedSubjects));
          }
          observer.next(created);
          observer.complete();
        }),
        catchError(() => {
          const slug = `${data.subject}-${data.title}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          const newNote: AcademicNote = {
            id: Date.now(),
            subject: data.subject,
            title: data.title,
            slug: slug || `note-${Date.now()}`,
            order: data.order || 1,
            content: data.content,
            updatedAt: new Date().toISOString()
          };
          this.notes.update(list => [...list, newNote]);
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.notes()));
          if (!this.subjects().includes(data.subject)) {
            const updatedSubjects = [...this.subjects(), data.subject].sort((a, b) => a.localeCompare(b));
            this.subjects.set(updatedSubjects);
            localStorage.setItem(this.SUBJECTS_STORAGE_KEY, JSON.stringify(updatedSubjects));
          }
          observer.next(newNote);
          observer.complete();
          return of(null);
        })
      ).subscribe();
    });
  }

  updateNote(id: number, data: { subject: string; title: string; content: string; order: number }): Observable<AcademicNote> {
    const token = this.authService.getToken();
    const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;

    return new Observable(observer => {
      this.http.put<AcademicNote>(`${this.API_URL}/${id}`, data, { headers }).pipe(
        tap(updated => {
          this.notes.update(list => list.map(n => n.id === id ? updated : n));
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.notes()));
          if (!this.subjects().includes(data.subject)) {
            const updatedSubjects = [...this.subjects(), data.subject].sort((a, b) => a.localeCompare(b));
            this.subjects.set(updatedSubjects);
            localStorage.setItem(this.SUBJECTS_STORAGE_KEY, JSON.stringify(updatedSubjects));
          }
          observer.next(updated);
          observer.complete();
        }),
        catchError(() => {
          this.notes.update(list => list.map(n => {
            if (n.id === id) {
              return {
                ...n,
                ...data,
                updatedAt: new Date().toISOString()
              };
            }
            return n;
          }));
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.notes()));
          if (!this.subjects().includes(data.subject)) {
            const updatedSubjects = [...this.subjects(), data.subject].sort((a, b) => a.localeCompare(b));
            this.subjects.set(updatedSubjects);
            localStorage.setItem(this.SUBJECTS_STORAGE_KEY, JSON.stringify(updatedSubjects));
          }
          const found = this.notes().find(n => n.id === id)!;
          observer.next(found);
          observer.complete();
          return of(null);
        })
      ).subscribe();
    });
  }

  deleteNote(id: number): Observable<boolean> {
    const token = this.authService.getToken();
    const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;

    return new Observable(observer => {
      this.http.delete(`${this.API_URL}/${id}`, { headers }).pipe(
        tap(() => {
          this.notes.update(list => list.filter(n => n.id !== id));
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.notes()));
          observer.next(true);
          observer.complete();
        }),
        catchError(() => {
          this.notes.update(list => list.filter(n => n.id !== id));
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.notes()));
          observer.next(true);
          observer.complete();
          return of(null);
        })
      ).subscribe();
    });
  }
}
