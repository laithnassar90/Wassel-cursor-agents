import { useState, useRef, useEffect } from 'react';
import { cn } from './ui/utils';

export interface ImageOptimizedProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: string;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
  fallback?: string;
}

export function ImageOptimized({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  quality = 75,
  placeholder = 'empty',
  blurDataURL,
  sizes = '100vw',
  loading = 'lazy',
  onLoad,
  onError,
  fallback = '/placeholder-image.png'
}: ImageOptimizedProps) {
  const [imageSrc, setImageSrc] = useState<string>(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || loading === 'eager') {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority, loading]);

  // Generate optimized image URL
  const getOptimizedSrc = (originalSrc: string) => {
    // If it's already an optimized URL or external URL, return as is
    if (originalSrc.startsWith('data:') || originalSrc.startsWith('blob:') || originalSrc.includes('http')) {
      return originalSrc;
    }

    // For local images, you could implement image optimization service
    // This is a placeholder for actual optimization logic
    const params = new URLSearchParams();
    if (width) params.set('w', width.toString());
    if (height) params.set('h', height.toString());
    if (quality) params.set('q', quality.toString());
    
    const queryString = params.toString();
    return queryString ? `${originalSrc}?${queryString}` : originalSrc;
  };

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    setImageSrc(fallback);
    onError?.();
  };

  const optimizedSrc = isInView ? getOptimizedSrc(imageSrc) : '';

  return (
    <div 
      ref={imgRef}
      className={cn(
        'relative overflow-hidden',
        className
      )}
      style={{ width, height }}
    >
      {/* Blur placeholder */}
      {placeholder === 'blur' && blurDataURL && isLoading && (
        <div 
          className="absolute inset-0 bg-cover bg-center filter blur-sm scale-110"
          style={{ backgroundImage: `url(${blurDataURL})` }}
        />
      )}

      {/* Loading skeleton */}
      {isLoading && !blurDataURL && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}

      {/* Actual image */}
      {isInView && (
        <img
          src={optimizedSrc}
          alt={alt}
          width={width}
          height={height}
          className={cn(
            'transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100',
            className
          )}
          loading={loading}
          sizes={sizes}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center text-gray-500">
            <div className="text-2xl mb-2">📷</div>
            <div className="text-sm">Failed to load image</div>
          </div>
        </div>
      )}
    </div>
  );
}

// Preload component for critical images
export function ImagePreload({ src, as = 'image' }: { src: string; as?: string }) {
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = src;
    link.as = as;
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, [src, as]);

  return null;
}

// Image gallery with optimization
export function ImageGallery({ 
  images, 
  className 
}: { 
  images: Array<{ src: string; alt: string; width?: number; height?: number }>;
  className?: string;
}) {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4', className)}>
      {images.map((image, index) => (
        <ImageOptimized
          key={index}
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          className="w-full h-48 object-cover rounded-lg"
          loading={index < 3 ? 'eager' : 'lazy'}
          priority={index < 3}
        />
      ))}
    </div>
  );
}

// Avatar component with optimization
export function AvatarOptimized({
  src,
  alt,
  size = 40,
  className
}: {
  src: string;
  alt: string;
  size?: number;
  className?: string;
}) {
  return (
    <ImageOptimized
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={cn(
        'rounded-full object-cover',
        className
      )}
      quality={90}
      loading="eager"
      priority
    />
  );
}