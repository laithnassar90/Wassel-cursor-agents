// Image optimization utilities

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  position?: 'top' | 'right top' | 'right' | 'right bottom' | 'bottom' | 'left bottom' | 'left' | 'left top' | 'center';
  blur?: number;
  sharpen?: number;
  grayscale?: boolean;
  sepia?: boolean;
}

export class ImageOptimizer {
  private static instance: ImageOptimizer;
  private cache = new Map<string, string>();
  private supportedFormats: string[] = [];

  private constructor() {
    this.detectSupportedFormats();
  }

  public static getInstance(): ImageOptimizer {
    if (!ImageOptimizer.instance) {
      ImageOptimizer.instance = new ImageOptimizer();
    }
    return ImageOptimizer.instance;
  }

  private detectSupportedFormats(): void {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // Test WebP support
    canvas.width = 1;
    canvas.height = 1;
    const webpDataURL = canvas.toDataURL('image/webp');
    if (webpDataURL.includes('webp')) {
      this.supportedFormats.push('webp');
    }

    // Test AVIF support
    const avifDataURL = canvas.toDataURL('image/avif');
    if (avifDataURL.includes('avif')) {
      this.supportedFormats.push('avif');
    }

    // Always support JPEG and PNG
    this.supportedFormats.push('jpeg', 'png');
  }

  public getOptimalFormat(): string {
    // Return the best supported format
    if (this.supportedFormats.includes('avif')) return 'avif';
    if (this.supportedFormats.includes('webp')) return 'webp';
    return 'jpeg';
  }

  public optimizeImage(
    src: string, 
    options: ImageOptimizationOptions = {}
  ): string {
    // Check cache first
    const cacheKey = `${src}-${JSON.stringify(options)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // If it's a data URL or external URL, return as is
    if (src.startsWith('data:') || src.startsWith('blob:') || src.includes('http')) {
      return src;
    }

    // Generate optimized URL
    const optimizedUrl = this.generateOptimizedUrl(src, options);
    
    // Cache the result
    this.cache.set(cacheKey, optimizedUrl);
    
    return optimizedUrl;
  }

  private generateOptimizedUrl(src: string, options: ImageOptimizationOptions): string {
    // This is a placeholder for actual image optimization service
    // In a real implementation, you would use services like:
    // - Cloudinary
    // - ImageKit
    // - Next.js Image Optimization
    // - Custom image optimization service
    
    const params = new URLSearchParams();
    
    if (options.width) params.set('w', options.width.toString());
    if (options.height) params.set('h', options.height.toString());
    if (options.quality) params.set('q', options.quality.toString());
    if (options.format) params.set('f', options.format);
    if (options.fit) params.set('fit', options.fit);
    if (options.position) params.set('pos', options.position);
    if (options.blur) params.set('blur', options.blur.toString());
    if (options.sharpen) params.set('sharpen', options.sharpen.toString());
    if (options.grayscale) params.set('grayscale', 'true');
    if (options.sepia) params.set('sepia', 'true');

    const queryString = params.toString();
    return queryString ? `${src}?${queryString}` : src;
  }

  public generateResponsiveImages(
    src: string, 
    breakpoints: number[] = [320, 640, 768, 1024, 1280, 1920]
  ): Array<{ src: string; width: number; sizes: string }> {
    return breakpoints.map((width, index) => ({
      src: this.optimizeImage(src, { 
        width, 
        format: this.getOptimalFormat() as any,
        quality: 75 
      }),
      width,
      sizes: index === breakpoints.length - 1 ? '100vw' : `(max-width: ${width}px) 100vw, ${width}px`
    }));
  }

  public generateBlurDataURL(width: number = 10, height: number = 10): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return '';

    canvas.width = width;
    canvas.height = height;
    
    // Create a simple gradient as placeholder
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#f3f4f6');
    gradient.addColorStop(1, '#e5e7eb');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    return canvas.toDataURL('image/jpeg', 0.1);
  }

  public preloadImage(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = src;
    });
  }

  public preloadImages(srcs: string[]): Promise<void[]> {
    return Promise.all(srcs.map(src => this.preloadImage(src)));
  }

  public getImageDimensions(src: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = reject;
      img.src = src;
    });
  }

  public clearCache(): void {
    this.cache.clear();
  }
}

// React hook for image optimization
export function useImageOptimization() {
  const optimizer = ImageOptimizer.getInstance();
  
  return {
    optimizeImage: (src: string, options?: ImageOptimizationOptions) => 
      optimizer.optimizeImage(src, options),
    generateResponsiveImages: (src: string, breakpoints?: number[]) => 
      optimizer.generateResponsiveImages(src, breakpoints),
    generateBlurDataURL: (width?: number, height?: number) => 
      optimizer.generateBlurDataURL(width, height),
    preloadImage: (src: string) => optimizer.preloadImage(src),
    preloadImages: (srcs: string[]) => optimizer.preloadImages(srcs),
    getImageDimensions: (src: string) => optimizer.getImageDimensions(src),
    getOptimalFormat: () => optimizer.getOptimalFormat(),
    clearCache: () => optimizer.clearCache()
  };
}

// Utility functions
export const getImageAspectRatio = (width: number, height: number): number => {
  return width / height;
};

export const calculateOptimalDimensions = (
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } => {
  const aspectRatio = getImageAspectRatio(originalWidth, originalHeight);
  
  let width = maxWidth;
  let height = maxWidth / aspectRatio;
  
  if (height > maxHeight) {
    height = maxHeight;
    width = maxHeight * aspectRatio;
  }
  
  return {
    width: Math.round(width),
    height: Math.round(height)
  };
};

export const generateImagePlaceholder = (
  width: number,
  height: number,
  text?: string
): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return '';

  canvas.width = width;
  canvas.height = height;
  
  // Background
  ctx.fillStyle = '#f3f4f6';
  ctx.fillRect(0, 0, width, height);
  
  // Border
  ctx.strokeStyle = '#d1d5db';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, width, height);
  
  // Text
  if (text) {
    ctx.fillStyle = '#6b7280';
    ctx.font = '14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, width / 2, height / 2);
  }
  
  return canvas.toDataURL('image/png');
};

// Export singleton instance
export const imageOptimizer = ImageOptimizer.getInstance();