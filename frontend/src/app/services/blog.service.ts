import { environment } from '../../environments/environment';
import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, tap, catchError } from 'rxjs';
import { BlogPost } from '../models/models';
import { INITIAL_BLOG_POSTS } from '../data/initial-data';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class BlogService {
  private readonly API_URL = environment.apiUrl + '/blog';
  private readonly STORAGE_KEY = 'callmeprof_blog_posts';

  posts = signal<BlogPost[]>([]);

  constructor(private http: HttpClient, private authService: AuthService) {
    this.loadInitialPosts();
  }

  private loadInitialPosts(): void {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        this.posts.set(JSON.parse(saved));
      } catch {
        this.posts.set(INITIAL_BLOG_POSTS);
      }
    } else {
      this.posts.set(INITIAL_BLOG_POSTS);
    }
    this.syncWithBackend().subscribe();
  }

  syncWithBackend(): Observable<BlogPost[]> {
    return this.http.get<BlogPost[]>(this.API_URL).pipe(
      tap(serverPosts => {
        if (serverPosts && serverPosts.length > 0) {
          this.posts.set(serverPosts);
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(serverPosts));
        }
      }),
      catchError(() => of(this.posts()))
    );
  }

  fetchPostBySlug(slug: string): Observable<BlogPost | null> {
    const inMemory = this.getPostBySlug(slug);
    return this.http.get<BlogPost>(`${this.API_URL}/${slug}`).pipe(
      tap(serverPost => {
        if (serverPost) {
          this.posts.update(list => {
            const index = list.findIndex(p => p.id === serverPost.id || p.slug === serverPost.slug);
            if (index !== -1) {
              const updated = [...list];
              updated[index] = serverPost;
              return updated;
            }
            return [serverPost, ...list];
          });
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.posts()));
        }
      }),
      catchError(() => of(inMemory || null))
    );
  }

  getPosts(tag?: string, search?: string): BlogPost[] {
    let result = this.posts();
    if (tag && tag.trim()) {
      const t = tag.trim().toLowerCase();
      result = result.filter(p => p.tags.toLowerCase().includes(t));
    }
    if (search && search.trim()) {
      const s = search.trim().toLowerCase();
      result = result.filter(p => 
        p.title.toLowerCase().includes(s) || 
        p.excerpt.toLowerCase().includes(s) || 
        p.content.toLowerCase().includes(s)
      );
    }
    return result;
  }

  getPostBySlug(slug: string): BlogPost | undefined {
    return this.posts().find(p => p.slug === slug || String(p.id) === slug);
  }

  getAllTags(): string[] {
    const tagSet = new Set<string>();
    this.posts().forEach(p => {
      p.tags.split(',').forEach(t => {
        const trimmed = t.trim();
        if (trimmed) tagSet.add(trimmed);
      });
    });
    return Array.from(tagSet);
  }

  getRelatedPosts(post: BlogPost): BlogPost[] {
    if (!post.relatedPostIds) return [];
    const ids = post.relatedPostIds.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n));
    return this.posts().filter(p => ids.includes(p.id) && p.id !== post.id);
  }

  createPost(data: { title: string; excerpt: string; content: string; tags: string; readTimeMinutes: number; relatedPostIds?: string }): Observable<BlogPost> {
    const token = this.authService.getToken();
    const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;

    return new Observable(observer => {
      this.http.post<BlogPost>(this.API_URL, data, { headers }).pipe(
        tap(created => {
          this.posts.update(list => [created, ...list]);
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.posts()));
          observer.next(created);
          observer.complete();
        }),
        catchError(() => {
          // Local fallback creation
          const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          const newPost: BlogPost = {
            id: Date.now(),
            title: data.title,
            slug: slug || `post-${Date.now()}`,
            excerpt: data.excerpt || (data.content.slice(0, 150) + '...'),
            content: data.content,
            tags: data.tags,
            relatedPostIds: data.relatedPostIds || '',
            readTimeMinutes: data.readTimeMinutes || 5,
            publishedAt: new Date().toISOString()
          };
          this.posts.update(list => [newPost, ...list]);
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.posts()));
          observer.next(newPost);
          observer.complete();
          return of(null);
        })
      ).subscribe();
    });
  }

  updatePost(id: number, data: { title: string; excerpt: string; content: string; tags: string; readTimeMinutes: number; relatedPostIds?: string }): Observable<BlogPost> {
    const token = this.authService.getToken();
    const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;

    return new Observable(observer => {
      this.http.put<BlogPost>(`${this.API_URL}/${id}`, data, { headers }).pipe(
        tap(updated => {
          this.posts.update(list => list.map(p => p.id === id ? updated : p));
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.posts()));
          observer.next(updated);
          observer.complete();
        }),
        catchError(() => {
          this.posts.update(list => list.map(p => {
            if (p.id === id) {
              return {
                ...p,
                ...data,
                updatedAt: new Date().toISOString()
              };
            }
            return p;
          }));
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.posts()));
          const found = this.posts().find(p => p.id === id)!;
          observer.next(found);
          observer.complete();
          return of(null);
        })
      ).subscribe();
    });
  }

  deletePost(id: number): Observable<boolean> {
    const token = this.authService.getToken();
    const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;

    return new Observable(observer => {
      this.http.delete(`${this.API_URL}/${id}`, { headers }).pipe(
        tap(() => {
          this.posts.update(list => list.filter(p => p.id !== id));
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.posts()));
          observer.next(true);
          observer.complete();
        }),
        catchError(() => {
          this.posts.update(list => list.filter(p => p.id !== id));
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.posts()));
          observer.next(true);
          observer.complete();
          return of(null);
        })
      ).subscribe();
    });
  }
}
