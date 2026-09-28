import { environment } from '../../environments/environment';
import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Question, FeedStats, ProfileBio, QuestionSubmission } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class AskService {
  private readonly BASE_URL = environment.apiUrl;

  // Cached feed state
  questions = signal<Question[]>([]);
  stats = signal<FeedStats>({ total_answered: 0, total_likes: 0 });
  profile = signal<ProfileBio>({
    alias_ar: 'بروف',
    alias_en: 'Prof',
    name_ar: 'محمود سيد محمد',
    name_en: 'Mahmoud Sayed Mohamed',
    bio_ar: 'مهندس برمجيات على قد حالي، بحاول أعمل حاجات ليها معنى وتفيدني وتفيد غيري.',
    bio_en: "I'm Mahmoud, but most people call me Prof. I'm a software developer who likes building things, trying new ideas, and figuring stuff out along the way.",
    linkedin: 'https://www.linkedin.com/in/mahmoud-sayed-mohamed',
    github: 'https://github.com/ixProf'
  });

  constructor(private http: HttpClient) {}

  // 1. Public Feed: loads answered questions + stats + profile
  getFeed(sort: 'recent' | 'liked' = 'recent', search?: string): Observable<{
    success: boolean;
    questions: Question[];
    stats: FeedStats;
    profile: ProfileBio;
  }> {
    let url = `${this.BASE_URL}/questions?sort=${sort}`;
    if (search && search.trim()) {
      url += `&search=${encodeURIComponent(search.trim())}`;
    }
    return this.http.get<{
      success: boolean;
      questions: Question[];
      stats: FeedStats;
      profile: ProfileBio;
    }>(url);
  }

  // 2. Public Question Detail (by display_number or id)
  getQuestion(id: string): Observable<{ success: boolean; question: Question }> {
    return this.http.get<{ success: boolean; question: Question }>(`${this.BASE_URL}/questions/${encodeURIComponent(id)}`);
  }

  // 3. Public Submit Question
  submitQuestion(submission: QuestionSubmission): Observable<any> {
    return this.http.post<any>(`${this.BASE_URL}/questions`, submission);
  }

  // 4. Public Like Question (Atomic increment)
  likeQuestion(id: string): Observable<{ success: boolean; likes_count: number }> {
    return this.http.post<{ success: boolean; likes_count: number }>(`${this.BASE_URL}/questions/${encodeURIComponent(id)}/like`, {});
  }

  // 5. Public Stats
  getStats(): Observable<{ success: boolean; stats: FeedStats; profile: ProfileBio }> {
    return this.http.get<{ success: boolean; stats: FeedStats; profile: ProfileBio }>(`${this.BASE_URL}/questions/stats`);
  }

  // 6. Admin Auth: Check session
  checkAdminAuth(): Observable<{ authenticated: boolean }> {
    return this.http.get<{ authenticated: boolean }>(`${this.BASE_URL}/admin/auth`, {
      withCredentials: true
    });
  }

  // 7. Admin Auth: Login with password
  loginAdmin(password: string): Observable<any> {
    return this.http.post<any>(`${this.BASE_URL}/admin/auth`, { password }, {
      withCredentials: true
    });
  }

  // 8. Admin Auth: Logout
  logoutAdmin(): Observable<any> {
    return this.http.delete<any>(`${this.BASE_URL}/admin/auth`, {
      withCredentials: true
    });
  }

  // 9. Admin Questions: Get pending & answered
  getAdminQuestions(): Observable<{ success: boolean; pending: Question[]; answered: Question[] }> {
    return this.http.get<{ success: boolean; pending: Question[]; answered: Question[] }>(`${this.BASE_URL}/admin/questions`, {
      withCredentials: true
    });
  }

  // 10. Admin Questions: Answer & Publish
  answerAndPublish(id: string, answerText: string): Observable<{ success: boolean; question?: Question; error?: string }> {
    return this.http.patch<{ success: boolean; question?: Question; error?: string }>(
      `${this.BASE_URL}/admin/questions/${encodeURIComponent(id)}`,
      { answer_text: answerText },
      { withCredentials: true }
    );
  }

  // 11. Admin Questions: Dismiss & Delete
  deleteQuestion(id: string): Observable<{ success: boolean; message?: string; error?: string }> {
    return this.http.delete<{ success: boolean; message?: string; error?: string }>(
      `${this.BASE_URL}/admin/questions/${encodeURIComponent(id)}`,
      { withCredentials: true }
    );
  }
}
