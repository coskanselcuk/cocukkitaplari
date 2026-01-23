import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Grid, List, BookOpen, Search } from 'lucide-react';
import { booksApi, categoriesApi } from '../../services/api';
import { books as mockBooks, categories as mockCategories } from '../../data/mockData';
import BookCard from './BookCard';
import { BookCardSkeletonGrid } from './BookCardSkeleton';

const BookLibrary = ({ category, onBack, onBookSelect }) => {
  const [viewMode, setViewMode] = useState('grid');
  const [selectedAge, setSelectedAge] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [books, setBooks] = useState(mockBooks);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch books from API
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const params = category ? { category: category.slug } : {};
        const response = await booksApi.getAll(params);
        if (response.books && response.books.length > 0) {
          setBooks(response.books);
        }
      } catch (error) {
        console.log('Using mock books:', error.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBooks();
  }, [category]);

  // Filter books
  const filteredBooks = useMemo(() => {
    let result = category 
      ? books.filter(book => book.category === category.slug || book.category === category.id)
      : books;

    // Filter by age
    if (selectedAge !== 'all') {
      result = result.filter(book => book.ageGroup === selectedAge);
    }

    // Filter by search
    if (searchQuery) {
      result = result.filter(book => 
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return result;
  }, [books, category, selectedAge, searchQuery]);

  const ageGroups = ['all', '3-4', '5-6', '7-8', '9-10'];
  const ageGroupLabels = {
    'all': 'Tümü',
    '3-4': 'Minikler (3-4)',
    '5-6': 'Anaokullu (5-6)',
    '7-8': 'Okuyorum (7-8)',
    '9-10': 'Büyükler (9-10)'
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 via-indigo-800 to-indigo-900 pb-24 relative">
      {/* Stars background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(80)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.8 + 0.2,
              animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-b from-indigo-900/95 to-indigo-900/80 backdrop-blur-sm px-4 py-4 safe-area-top">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={onBack}
            className="bg-white/10 backdrop-blur-sm rounded-full p-2 text-white hover:bg-white/20 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          
          <h1 className="text-white font-bold text-xl">
            {category ? category.name : 'Tüm Kitaplar'}
          </h1>
          
          <div className="flex gap-2">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white text-indigo-600' : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
              <Grid size={20} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white text-indigo-600' : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
              <List size={20} />
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Kitap ara..."
            className="w-full bg-white/10 text-white placeholder-white/50 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
        
        {/* Age Filter */}
        <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
          <div className="flex gap-2 pb-2">
            {ageGroups.map(age => (
              <button
                key={age}
                onClick={() => setSelectedAge(age)}
                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-300 ${
                  selectedAge === age 
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' 
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {ageGroupLabels[age]}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Books Grid/List */}
      <div className="px-4 py-4 relative z-10">
        {isLoading ? (
          <>
            <div className="h-4 w-24 rounded bg-white/10 mb-4 animate-pulse" />
            {viewMode === 'grid' ? (
              <BookCardSkeletonGrid count={8} />
            ) : (
              <div className="space-y-4" data-testid="list-skeleton">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-full bg-white/10 backdrop-blur-sm rounded-2xl p-4 flex gap-4">
                    <div className="w-20 h-28 rounded-xl bg-white/5 skeleton-shimmer" />
                    <div className="flex-1 space-y-3">
                      <div className="h-4 w-3/4 rounded bg-white/10 skeleton-shimmer" />
                      <div className="h-3 w-1/2 rounded bg-white/10 skeleton-shimmer" />
                      <div className="h-3 w-full rounded bg-white/10 skeleton-shimmer" />
                      <div className="flex gap-4">
                        <div className="h-3 w-16 rounded bg-white/10 skeleton-shimmer" />
                        <div className="h-3 w-16 rounded bg-white/10 skeleton-shimmer" />
                      </div>
                    </div>
                  </div>
                ))}
                <style>{`
                  @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                  }
                  .skeleton-shimmer {
                    background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0) 100%);
                    background-size: 200% 100%;
                    animation: shimmer 1.5s ease-in-out infinite;
                  }
                `}</style>
              </div>
            )}
          </>
        ) : (
          <>
            <p className="text-white/60 text-sm mb-4">{filteredBooks.length} kitap bulundu</p>
            
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {filteredBooks.map(book => (
                  <BookCard 
                    key={book.id} 
                    book={book} 
                    onSelect={onBookSelect}
                    size="medium"
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBooks.map(book => (
                  <button
                    key={book.id}
                    onClick={() => onBookSelect(book)}
                    className="w-full bg-white/10 backdrop-blur-sm rounded-2xl p-4 flex gap-4 hover:bg-white/15 transition-all duration-300 text-left"
                  >
                    <img 
                      src={book.coverImage} 
                      alt={book.title}
                      className="w-20 h-28 object-cover rounded-xl shadow-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-bold text-white mb-1">{book.title}</h3>
                      <p className="text-white/60 text-sm mb-2">{book.author}</p>
                      <p className="text-white/50 text-sm mb-2 line-clamp-2">{book.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-cyan-400 font-semibold">{book.duration}</span>
                        <span className="text-orange-400 font-semibold">{book.ageGroup} yaş</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Empty State */}
      {filteredBooks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 relative z-10">
          <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-4">
            <BookOpen className="text-white/40" size={40} />
          </div>
          <p className="text-white/60 text-lg">Kitap bulunamadı</p>
        </div>
      )}

      {/* Add twinkle animation */}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default BookLibrary;
