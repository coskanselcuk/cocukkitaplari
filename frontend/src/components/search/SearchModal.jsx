import React, { useState, useEffect } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { booksApi, categoriesApi } from '../../services/api';
import BookCard from '../books/BookCard';
import { BookCardSkeletonGrid } from '../books/BookCardSkeleton';

const SearchModal = ({ isOpen, onClose, onBookSelect }) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch books and categories from API
  useEffect(() => {
    const fetchData = async () => {
      if (!isOpen) return;
      
      setIsLoading(true);
      try {
        const [booksRes, catsRes] = await Promise.all([
          booksApi.getAll(),
          categoriesApi.getAll()
        ]);
        setBooks(booksRes.books || []);
        setCategories(catsRes.categories || []);
      } catch (error) {
        console.error('Error fetching search data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isOpen]);

  const filteredBooks = books.filter(book => {
    const matchesQuery = query.length === 0 || 
                         book.title.toLowerCase().includes(query.toLowerCase()) ||
                         book.author.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || book.category === selectedCategory;
    return matchesQuery && matchesCategory;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-cyan-500 to-cyan-600">
      {/* Header */}
      <div className="px-4 py-4 safe-area-top">
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose}
            className="bg-white/20 rounded-full p-2 text-white"
          >
            <X size={24} />
          </button>
          
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Kitap veya yazar ara..."
              className="w-full pl-12 pr-4 py-3 rounded-full bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 shadow-lg"
              autoFocus
            />
          </div>
        </div>
        
        {/* Category Filter */}
        <div className="overflow-x-auto mt-4 scrollbar-hide">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-300 ${
                selectedCategory === 'all' 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-white/20 text-white'
              }`}
            >
              Tümü
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-300 ${
                  selectedCategory === cat.slug 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-white/20 text-white'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Results */}
      <div className="px-4 py-4 overflow-y-auto" style={{ height: 'calc(100vh - 160px)' }}>
        {isLoading ? (
          <div data-testid="search-loading">
            <div className="h-4 w-28 rounded bg-white/20 mb-4 animate-pulse" />
            <BookCardSkeletonGrid count={6} />
          </div>
        ) : query.length === 0 && selectedCategory === 'all' ? (
          <div className="text-center py-10">
            <Search className="mx-auto text-white/50 mb-4" size={48} />
            <p className="text-white/80 text-lg">Aramak istediğin kitabı yaz</p>
            <p className="text-white/60 text-sm mt-2">veya kategorilere göz at</p>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-16 h-16 bg-white/20 rounded-full mx-auto flex items-center justify-center mb-4">
              <Search className="text-white/60" size={32} />
            </div>
            <p className="text-white/80 text-lg">Sonuç bulunamadı</p>
          </div>
        ) : (
          <>
            <p className="text-white/80 mb-4">{filteredBooks.length} kitap bulundu</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {filteredBooks.map(book => (
                <BookCard 
                  key={book.id} 
                  book={book} 
                  onSelect={(book) => {
                    onBookSelect(book);
                    onClose();
                  }}
                  size="medium"
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SearchModal;
