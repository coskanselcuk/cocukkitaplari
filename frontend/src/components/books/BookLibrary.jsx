import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Grid, List, Search, Loader2 } from 'lucide-react';
import { booksApi } from '../../services/api';
import BookCard from './BookCard';
import { BookCardSkeletonGrid } from './BookCardSkeleton';

const ITEMS_PER_PAGE = 20;

const BookLibrary = ({ category, onBack, onBookSelect }) => {
  const [viewMode, setViewMode] = useState('grid');
  const [selectedAge, setSelectedAge] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  
  const observerRef = useRef();
  const loadMoreRef = useRef();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset and fetch when filters change
  useEffect(() => {
    setBooks([]);
    setOffset(0);
    setHasMore(true);
    setIsLoading(true);
  }, [category, selectedAge, debouncedSearch]);

  // Fetch books
  const fetchBooks = useCallback(async (currentOffset = 0, append = false) => {
    try {
      const params = {
        limit: ITEMS_PER_PAGE,
        offset: currentOffset
      };
      
      if (category) {
        params.category = category.id || category.slug;
      }
      if (selectedAge !== 'all') {
        params.ageGroup = selectedAge;
      }
      if (debouncedSearch) {
        params.search = debouncedSearch;
      }

      const response = await booksApi.getAll(params);
      const newBooks = response.books || [];
      const totalCount = response.total || 0;

      setTotal(totalCount);
      
      if (append) {
        setBooks(prev => [...prev, ...newBooks]);
      } else {
        setBooks(newBooks);
      }
      
      setHasMore(currentOffset + newBooks.length < totalCount);
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [category, selectedAge, debouncedSearch]);

  // Initial fetch
  useEffect(() => {
    if (isLoading) {
      fetchBooks(0, false);
    }
  }, [isLoading, fetchBooks]);

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore) {
          setIsLoadingMore(true);
          const newOffset = offset + ITEMS_PER_PAGE;
          setOffset(newOffset);
          fetchBooks(newOffset, true);
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [hasMore, isLoading, isLoadingMore, offset, fetchBooks]);

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
            data-testid="back-button"
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
              data-testid="grid-view-btn"
            >
              <Grid size={20} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white text-indigo-600' : 'bg-white/10 text-white hover:bg-white/20'}`}
              data-testid="list-view-btn"
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
            data-testid="search-input"
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
                data-testid={`age-filter-${age}`}
              >
                {ageGroupLabels[age]}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <p className="text-white/70 text-sm mt-2">
          {isLoading ? 'Yükleniyor...' : `${total} kitap bulundu`}
        </p>
      </div>

      {/* Books grid/list */}
      <div className="px-4 pt-4 relative z-10">
        {isLoading ? (
          <BookCardSkeletonGrid count={8} />
        ) : books.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-white/70">
            <div className="bg-white/10 rounded-full p-6 mb-4">
              <Search size={40} className="text-white/50" />
            </div>
            <p className="text-lg font-medium">Kitap bulunamadı</p>
            <p className="text-sm mt-1">Farklı bir arama deneyin</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {books.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onSelect={onBookSelect}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {books.map((book) => (
              <div
                key={book.id}
                onClick={() => onBookSelect(book)}
                className="flex items-center bg-white/10 backdrop-blur-sm rounded-xl p-3 hover:bg-white/20 transition-colors cursor-pointer"
                data-testid={`book-list-item-${book.id}`}
              >
                <img
                  src={book.coverImage}
                  alt={book.title}
                  className="w-16 h-20 object-cover rounded-lg flex-shrink-0"
                />
                <div className="ml-4 flex-1 min-w-0">
                  <h3 className="text-white font-semibold truncate">{book.title}</h3>
                  <p className="text-white/60 text-sm">{book.author}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-orange-400 text-xs font-medium">{book.ageGroup} yaş</span>
                    <span className="text-white/40 text-xs">•</span>
                    <span className="text-white/60 text-xs">{book.duration}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load more trigger */}
        {hasMore && !isLoading && (
          <div 
            ref={loadMoreRef} 
            className="flex justify-center py-8"
          >
            {isLoadingMore && (
              <div className="flex items-center gap-2 text-white/70">
                <Loader2 size={20} className="animate-spin" />
                <span>Daha fazla yükleniyor...</span>
              </div>
            )}
          </div>
        )}

        {/* End of list indicator */}
        {!hasMore && books.length > 0 && (
          <div className="text-center py-8 text-white/50 text-sm">
            Tüm kitaplar gösterildi ({total})
          </div>
        )}
      </div>
    </div>
  );
};

export default BookLibrary;
