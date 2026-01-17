import React from 'react';
import { Play, Clock, Star, Headphones, Crown, Lock } from 'lucide-react';

const BookCard = ({ book, onSelect, size = 'medium', showPremiumLock = false }) => {
  const sizeClasses = {
    small: 'w-32',
    medium: 'w-40',
    large: 'w-48'
  };

  const isPremium = book.isPremium;

  return (
    <button
      onClick={() => onSelect(book)}
      className={`book-card ${sizeClasses[size]} flex-shrink-0 text-left`}
    >
      <div className="relative rounded-2xl overflow-hidden shadow-xl bg-white">
        {/* Book Cover */}
        <div className="relative aspect-[3/4] overflow-hidden">
          <img
            src={book.coverImage}
            alt={book.title}
            className="w-full h-full object-cover"
          />
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Premium Badge */}
          {isPremium && (
            <div className="absolute top-2 left-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-md">
              <Crown size={10} />
              <span>Premium</span>
            </div>
          )}
          
          {/* New Badge - show only if not premium */}
          {book.isNew && !isPremium && (
            <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              YENİ
            </div>
          )}
          
          {/* Audio indicator */}
          {book.hasAudio && (
            <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full p-1.5">
              <Headphones size={14} className="text-cyan-600" />
            </div>
          )}
          
          {/* Premium Lock Overlay */}
          {isPremium && showPremiumLock && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <div className="bg-white/90 rounded-full p-2">
                <Lock size={20} className="text-gray-600" />
              </div>
            </div>
          )}
          
          {/* Play button */}
          <div className="absolute bottom-3 right-3 bg-orange-500 rounded-full p-2 shadow-lg hover:bg-orange-600 transition-colors">
            <Play size={16} className="text-white fill-white" />
          </div>
          
          {/* Duration */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1 text-white text-xs">
            <Clock size={12} />
            <span>{book.duration}</span>
          </div>
        </div>
        
        {/* Book Info */}
        <div className="p-3">
          <h3 className="font-bold text-gray-800 text-sm leading-tight line-clamp-2 mb-1">
            {book.title}
          </h3>
          <p className="text-gray-500 text-xs mb-2">{book.author}</p>
          
          {/* Rating */}
          <div className="flex items-center gap-1">
            <Star size={12} className="text-yellow-400 fill-yellow-400" />
            <span className="text-xs text-gray-600 font-semibold">{book.rating}</span>
            <span className="text-xs text-gray-400">({book.readCount})</span>
          </div>
        </div>
      </div>
    </button>
  );
};

export default BookCard;
