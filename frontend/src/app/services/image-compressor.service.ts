import { Injectable } from '@angular/core';

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  wasCompressed: boolean;
  width: number;
  height: number;
}

@Injectable({
  providedIn: 'root'
})
export class ImageCompressorService {
  // Cap the longest dimension at 1920px (~1600-2000px requirement)
  private readonly MAX_DIMENSION = 1920;
  // Reasonable compression quality ~75-85%
  private readonly QUALITY = 0.82;
  // Small file threshold: < 120KB
  private readonly SMALL_FILE_THRESHOLD = 120 * 1024;

  /**
   * Compresses and resizes an image on the client side before upload.
   * If the image is already small or vector-based (SVG/GIF), compression is skipped.
   */
  async compressImage(file: File): Promise<CompressionResult> {
    const originalSize = file.size;

    // Skip compression for SVGs and animated GIFs
    if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
      return {
        file,
        originalSize,
        compressedSize: originalSize,
        wasCompressed: false,
        width: 0,
        height: 0
      };
    }

    // Skip compression if already lightweight WebP or JPEG
    if (originalSize <= this.SMALL_FILE_THRESHOLD && (file.type === 'image/webp' || file.type === 'image/jpeg')) {
      return {
        file,
        originalSize,
        compressedSize: originalSize,
        wasCompressed: false,
        width: 0,
        height: 0
      };
    }

    try {
      const img = await this.loadImage(file);
      const { width: origWidth, height: origHeight } = img;

      // Compute scaled dimensions capping the longest edge
      let targetWidth = origWidth;
      let targetHeight = origHeight;

      if (origWidth > this.MAX_DIMENSION || origHeight > this.MAX_DIMENSION) {
        if (origWidth >= origHeight) {
          targetWidth = this.MAX_DIMENSION;
          targetHeight = Math.round((origHeight * this.MAX_DIMENSION) / origWidth);
        } else {
          targetHeight = this.MAX_DIMENSION;
          targetWidth = Math.round((origWidth * this.MAX_DIMENSION) / origHeight);
        }
      }

      // If dimensions are unchanged and file is small enough, keep original
      if (
        targetWidth === origWidth &&
        targetHeight === origHeight &&
        originalSize <= 250 * 1024 &&
        file.type === 'image/webp'
      ) {
        return {
          file,
          originalSize,
          compressedSize: originalSize,
          wasCompressed: false,
          width: origWidth,
          height: origHeight
        };
      }

      // Draw onto canvas for client-side re-encoding
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        return {
          file,
          originalSize,
          compressedSize: originalSize,
          wasCompressed: false,
          width: origWidth,
          height: origHeight
        };
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      // Attempt to encode as WebP, fallback to JPEG if browser doesn't support WebP export
      const blob = await this.canvasToBlob(canvas, 'image/webp', this.QUALITY);
      const finalBlob = blob || await this.canvasToBlob(canvas, 'image/jpeg', this.QUALITY);

      if (!finalBlob) {
        return {
          file,
          originalSize,
          compressedSize: originalSize,
          wasCompressed: false,
          width: targetWidth,
          height: targetHeight
        };
      }

      // If the compressed output happens to be larger than the original, stick with the original
      if (finalBlob.size >= originalSize && targetWidth === origWidth && targetHeight === origHeight) {
        return {
          file,
          originalSize,
          compressedSize: originalSize,
          wasCompressed: false,
          width: origWidth,
          height: origHeight
        };
      }

      const extension = finalBlob.type === 'image/webp' ? '.webp' : '.jpg';
      const baseName = file.name.replace(/\.[^/.]+$/, '') || 'image';
      const compressedFile = new File([finalBlob], `${baseName}${extension}`, {
        type: finalBlob.type,
        lastModified: Date.now()
      });

      return {
        file: compressedFile,
        originalSize,
        compressedSize: compressedFile.size,
        wasCompressed: true,
        width: targetWidth,
        height: targetHeight
      };
    } catch (err) {
      console.warn('Client-side compression skipped due to error, using original file:', err);
      return {
        file,
        originalSize,
        compressedSize: originalSize,
        wasCompressed: false,
        width: 0,
        height: 0
      };
    }
  }

  private loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = (e) => {
        URL.revokeObjectURL(url);
        reject(e);
      };
      img.src = url;
    });
  }

  private canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality: number): Promise<Blob | null> {
    return new Promise(resolve => {
      canvas.toBlob(blob => resolve(blob), mimeType, quality);
    });
  }
}
