import React from 'react';
import BookCard from './BookCard';
import { ChevronRight } from 'lucide-react';

const BookCarousel = ({ title, books, onBookSelect, onSeeAll }) => {
  return (
    <div className="mb-6">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3 px-4">
        <h2 className="text-white font-bold text-lg drop-shadow-md">{title}</h2>
        {onSeeAll && (
          <button 
            onClick={onSeeAll}
            className="flex items-center gap-1 text-white/80 hover:text-white text-sm font-semibold transition-colors"
          >
            Tümü
            <ChevronRight size={18} />
          </button>
        )}
      </div>
      
      {/* Books Scroll */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-4 px-4 pb-2">
          {books.map((book) => (
            <BookCard 
              key={book.id} 
              book={book} 
              onSelect={onBookSelect}
              size="medium"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default BookCarousel;
