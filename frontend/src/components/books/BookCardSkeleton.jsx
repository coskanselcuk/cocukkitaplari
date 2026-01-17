import React from 'react';

const BookCardSkeleton = ({ size = 'medium' }) => {
  const sizeClasses = {
    small: 'w-32',
    medium: 'w-40',
    large: 'w-48'
  };

  return (
    <div className={`${sizeClasses[size]} flex-shrink-0`} data-testid="book-card-skeleton">
      <div className="relative rounded-2xl overflow-hidden shadow-xl bg-white/10 backdrop-blur-sm">
        {/* Book Cover Skeleton */}
        <div className="relative aspect-[3/4] overflow-hidden bg-white/5">
          <div className="absolute inset-0 skeleton-shimmer" />
          
          {/* Fake badge placeholder */}
          <div className="absolute top-2 left-2 w-16 h-5 rounded-full bg-white/10 skeleton-shimmer" />
          
          {/* Fake audio indicator */}
          <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/10 skeleton-shimmer" />
          
          {/* Fake play button */}
          <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-white/10 skeleton-shimmer" />
          
          {/* Fake duration */}
          <div className="absolute bottom-3 left-3 w-12 h-4 rounded bg-white/10 skeleton-shimmer" />
        </div>
        
        {/* Book Info Skeleton */}
        <div className="p-3 bg-white/5">
          {/* Title */}
          <div className="h-4 w-full rounded bg-white/10 skeleton-shimmer mb-2" />
          <div className="h-4 w-2/3 rounded bg-white/10 skeleton-shimmer mb-2" />
          
          {/* Author */}
          <div className="h-3 w-1/2 rounded bg-white/10 skeleton-shimmer mb-2" />
          
          {/* Rating */}
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-white/10 skeleton-shimmer" />
            <div className="h-3 w-8 rounded bg-white/10 skeleton-shimmer" />
          </div>
        </div>
      </div>
    </div>
  );
};

export const BookCardSkeletonGrid = ({ count = 6, className = '' }) => {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 ${className}`} data-testid="skeleton-grid">
      {[...Array(count)].map((_, i) => (
        <BookCardSkeleton key={i} size="medium" />
      ))}
      
      {/* Shimmer animation styles */}
      <style>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        
        .skeleton-shimmer {
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.1) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default BookCardSkeleton;
