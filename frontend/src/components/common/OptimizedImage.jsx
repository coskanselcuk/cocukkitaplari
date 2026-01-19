/**
 * OptimizedImage Component
 * 
 * Renders images with Cloudinary optimizations:
 * - Responsive srcset for optimal size delivery
 * - Blur-up placeholder loading effect (optional)
 * - Lazy loading support
 * - Automatic format/quality optimization via Cloudinary
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  cloudinaryUrl,
  generateSrcSet,
  getSizesAttribute,
  getPlaceholderUrl,
} from '../utils/cloudinaryHelper';

const OptimizedImage = ({
  src,
  alt,
  type = 'page', // 'page', 'cover', or 'icon'
  className = '',
  blurUp = false, // Enable blur-up loading effect
  lazy = true, // Enable lazy loading
  onLoad,
  onError,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);
  
  // Get optimized URLs
  const optimizedSrc = cloudinaryUrl(src, type);
  const srcSet = generateSrcSet(src, type);
  const sizes = getSizesAttribute(type);
  const placeholderSrc = blurUp ? getPlaceholderUrl(src, type) : null;
  
  // Reset state when src changes
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [src]);
  
  const handleLoad = (e) => {
    setIsLoaded(true);
    onLoad?.(e);
  };
  
  const handleError = (e) => {
    setHasError(true);
    setIsLoaded(true); // Consider it "loaded" to remove placeholder
    onError?.(e);
  };
  
  // If no blur-up, render simple optimized image
  if (!blurUp) {
    return (
      <img
        ref={imgRef}
        src={optimizedSrc}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        className={className}
        loading={lazy ? 'lazy' : 'eager'}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    );
  }
  
  // Blur-up implementation
  return (
    <div className="relative overflow-hidden" style={{ width: '100%', height: '100%' }}>
      {/* Blur placeholder - always rendered first */}
      {placeholderSrc && !hasError && (
        <img
          src={placeholderSrc}
          alt=""
          aria-hidden="true"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
            isLoaded ? 'opacity-0' : 'opacity-100'
          }`}
          style={{
            filter: 'blur(20px)',
            transform: 'scale(1.1)', // Slightly scale up to cover blur edges
          }}
        />
      )}
      
      {/* Main image */}
      <img
        ref={imgRef}
        src={optimizedSrc}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        className={`${className} transition-opacity duration-500 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        loading={lazy ? 'lazy' : 'eager'}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    </div>
  );
};

export default OptimizedImage;
