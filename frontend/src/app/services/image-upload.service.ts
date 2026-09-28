import { environment } from '../../environments/environment';
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, switchMap, catchError, of, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { ImageCompressorService, CompressionResult } from './image-compressor.service';

export interface UploadResponse {
  url: string;
  fileName: string;
  size: number;
  contentType?: string;
  reductionPercentage?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ImageUploadService {
  private readonly API_URL = environment.apiUrl + '/upload/image';
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private compressor = inject(ImageCompressorService);

  /**
   * Compresses image client-side then uploads it to the Supabase Storage endpoint.
   */
  uploadImage(file: File): Observable<UploadResponse> {
    return from(this.compressor.compressImage(file)).pipe(
      switchMap((compressedResult: CompressionResult) => {
        const formData = new FormData();
        formData.append('file', compressedResult.file, compressedResult.file.name);

        const token = this.authService.getToken();
        const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;

        return this.http.post<UploadResponse>(this.API_URL, formData, { headers }).pipe(
          switchMap(res => {
            const reduction = compressedResult.wasCompressed
              ? Math.round((1 - compressedResult.compressedSize / compressedResult.originalSize) * 100)
              : 0;
            return of({
              ...res,
              reductionPercentage: reduction
            });
          }),
          catchError(err => {
            console.error('Server upload failed, checking local preview fallback:', err);
            // If server fails or offline, convert to base64 DataURL so editor doesn't break
            return from(this.fileToDataUrl(compressedResult.file)).pipe(
              switchMap(dataUrl => of({
                url: dataUrl,
                fileName: compressedResult.file.name,
                size: compressedResult.file.size
              }))
            );
          })
        );
      })
    );
  }

  private fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  }
}
