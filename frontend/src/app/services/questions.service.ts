import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, tap, catchError } from 'rxjs';
import { Question } from '../models/models';
import { INITIAL_QUESTIONS } from '../data/initial-data';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class QuestionsService {
  private readonly API_URL = 'http://localhost:5000/api/questions';
  private readonly STORAGE_KEY = 'callmeprof_questions';

  questions = signal<Question[]>([]);

  constructor(private http: HttpClient, private authService: AuthService) {
    this.loadInitialQuestions();
  }

  private loadInitialQuestions(): void {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        this.questions.set(JSON.parse(saved));
        return;
      } catch {
        // Fallback
      }
    }
    this.questions.set(INITIAL_QUESTIONS);
    this.syncWithBackend();
  }

  private syncWithBackend(): void {
    // If admin is logged in, fetch full inbox, otherwise fetch answered
    const token = this.authService.getToken();
    const url = token ? `${this.API_URL}/inbox` : this.API_URL;
    const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;

    this.http.get<Question[]>(url, { headers }).pipe(
      tap(serverQuestions => {
        if (serverQuestions && serverQuestions.length > 0) {
          this.questions.set(serverQuestions);
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(serverQuestions));
        }
      }),
      catchError(() => of(null))
    ).subscribe();
  }

  getAnsweredQuestions(search?: string): Question[] {
    let list = this.questions().filter(q => q.status === 'answered' || q.isAnswered);
    if (search && search.trim()) {
      const s = search.trim().toLowerCase();
      list = list.filter(q => 
        (q.question_text || q.questionText || '').toLowerCase().includes(s) || 
        (q.answer_text || q.answerText || '').toLowerCase().includes(s) ||
        (q.asker_name || q.askerName || '').toLowerCase().includes(s)
      );
    }
    return list.sort((a, b) => {
      const timeA = new Date(a.answered_at || a.answeredAt || a.created_at || a.createdAt || '').getTime() || 0;
      const timeB = new Date(b.answered_at || b.answeredAt || b.created_at || b.createdAt || '').getTime() || 0;
      return timeB - timeA;
    });
  }

  getPendingQuestions(): Question[] {
    return this.questions().filter(q => q.status !== 'answered' && !q.isAnswered);
  }

  submitQuestion(askerName: string, questionText: string): Observable<{ success: boolean; message: string }> {
    return new Observable(observer => {
      this.http.post<{ message: string; question: Question }>(this.API_URL, {
        askerName: askerName || 'Anonymous',
        questionText
      }).pipe(
        tap(res => {
          if (res && res.question) {
            this.questions.update(list => [res.question, ...list]);
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.questions()));
          }
          observer.next({ success: true, message: 'Question submitted successfully! Prof will review and answer it soon.' });
          observer.complete();
        }),
        catchError(() => {
          // Local fallback
          const newQ: Question = {
            id: 'q-' + Date.now().toString(36),
            question_text: questionText.trim(),
            answer_text: null,
            status: 'pending',
            is_anonymous: !askerName?.trim(),
            asker_name: askerName?.trim() || 'Anonymous',
            likes_count: 0,
            created_at: new Date().toISOString(),
            answered_at: null,
            askerName: askerName?.trim() || 'Anonymous',
            questionText: questionText.trim(),
            answerText: null,
            isAnswered: false,
            createdAt: new Date().toISOString()
          };
          this.questions.update(list => [newQ, ...list]);
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.questions()));
          observer.next({ success: true, message: 'Question submitted! Prof will review and answer it soon.' });
          observer.complete();
          return of(null);
        })
      ).subscribe();
    });
  }

  answerQuestion(id: string | number, answerText: string): Observable<Question> {
    const token = this.authService.getToken();
    const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;
    const strId = String(id);

    return new Observable(observer => {
      this.http.put<Question>(`${this.API_URL}/${id}/answer`, { answerText }, { headers }).pipe(
        tap(updated => {
          this.questions.update(list => list.map(q => String(q.id) === strId ? updated : q));
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.questions()));
          observer.next(updated);
          observer.complete();
        }),
        catchError(() => {
          // Local fallback answer
          this.questions.update(list => list.map(q => {
            if (String(q.id) === strId) {
              return {
                ...q,
                answer_text: answerText,
                answerText,
                status: 'answered' as const,
                isAnswered: true,
                answered_at: new Date().toISOString(),
                answeredAt: new Date().toISOString()
              };
            }
            return q;
          }));
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.questions()));
          const found = this.questions().find(q => String(q.id) === strId)!;
          observer.next(found);
          observer.complete();
          return of(null);
        })
      ).subscribe();
    });
  }

  deleteQuestion(id: string | number): Observable<boolean> {
    const token = this.authService.getToken();
    const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;
    const strId = String(id);

    return new Observable(observer => {
      this.http.delete(`${this.API_URL}/${id}`, { headers }).pipe(
        tap(() => {
          this.questions.update(list => list.filter(q => String(q.id) !== strId));
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.questions()));
          observer.next(true);
          observer.complete();
        }),
        catchError(() => {
          this.questions.update(list => list.filter(q => String(q.id) !== strId));
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.questions()));
          observer.next(true);
          observer.complete();
          return of(null);
        })
      ).subscribe();
    });
  }
}
