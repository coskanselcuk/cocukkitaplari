import React, { useState } from 'react';
import { ArrowLeft, Grid, List, Filter, BookOpen } from 'lucide-react';
import { books, categories } from '../../data/mockData';
import BookCard from './BookCard';

const BookLibrary = ({ category, onBack, onBookSelect }) => {
  const [viewMode, setViewMode] = useState('grid');
  const [selectedAge, setSelectedAge] = useState('all');
  
  const filteredBooks = category 
    ? books.filter(book => book.category === category.id)
    : books;

  const ageFilteredBooks = selectedAge === 'all' 
    ? filteredBooks 
    : filteredBooks.filter(book => book.ageGroup === selectedAge);

  const ageGroups = ['all', '3-5', '4-6', '5-7', '6-8', '6-9', '7-10'];

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-b from-cyan-500 to-cyan-500/80 backdrop-blur-sm px-4 py-4 safe-area-top">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={onBack}
            className="bg-white/20 backdrop-blur-sm rounded-full p-2 text-white"
          >
            <ArrowLeft size={24} />
          </button>
          
          <h1 className="text-white font-bold text-xl">
            {category ? category.name : 'Tüm Kitaplar'}
          </h1>
          
          <div className="flex gap-2">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white text-cyan-600' : 'bg-white/20 text-white'}`}
            >
              <Grid size={20} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white text-cyan-600' : 'bg-white/20 text-white'}`}
            >
              <List size={20} />
            </button>
          </div>
        </div>
        
        {/* Age Filter */}
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 pb-2">
            {ageGroups.map(age => (
              <button
                key={age}
                onClick={() => setSelectedAge(age)}
                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-300 ${
                  selectedAge === age 
                    ? 'bg-orange-500 text-white shadow-lg' 
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {age === 'all' ? 'Tümü' : `${age} yaş`}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Books Grid/List */}
      <div className="px-4 py-4">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {ageFilteredBooks.map(book => (
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
            {ageFilteredBooks.map(book => (
              <button
                key={book.id}
                onClick={() => onBookSelect(book)}
                className="w-full bg-white rounded-2xl p-4 flex gap-4 shadow-lg hover:shadow-xl transition-all duration-300 text-left"
              >
                <img 
                  src={book.coverImage} 
                  alt={book.title}
                  className="w-20 h-28 object-cover rounded-xl"
                />
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 mb-1">{book.title}</h3>
                  <p className="text-gray-500 text-sm mb-2">{book.author}</p>
                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">{book.description}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-cyan-600 font-semibold">{book.duration}</span>
                    <span className="text-orange-500 font-semibold">{book.ageGroup} yaş</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Empty State */}
      {ageFilteredBooks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-4">
            <BookOpen className="text-white/60" size={40} />
          </div>
          <p className="text-white/80 text-lg">Bu kategoride kitap bulunamadı</p>
        </div>
      )}
    </div>
  );
};

export default BookLibrary;
