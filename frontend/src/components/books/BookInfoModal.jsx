import React from 'react';
import { X, Clock, Users, BookOpen, FileText } from 'lucide-react';

const BookInfoModal = ({ book, isOpen, onClose, onStart }) => {
  if (!isOpen || !book) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-3xl max-w-sm w-full shadow-2xl animate-slide-up overflow-hidden">
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors"
        >
          <X size={20} className="text-gray-600" />
        </button>
        
        {/* Book Cover */}
        <div className="relative h-48 bg-gradient-to-b from-cyan-400 to-cyan-500 flex items-center justify-center">
          <img 
            src={book.coverImage} 
            alt={book.title}
            className="h-40 w-28 object-cover rounded-lg shadow-2xl"
          />
        </div>
        
        {/* Book Info */}
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-2 text-center">
            {book.title}
          </h2>
          
          <div className="space-y-3 mt-4">
            {/* Author */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Yazar</span>
              <span className="text-gray-800 font-medium">{book.author}</span>
            </div>
            
            {/* Illustrator */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Çizer</span>
              <span className="text-gray-800 font-medium">TRT Çocuk</span>
            </div>
            
            {/* Age Group */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Yaş Grubu</span>
              <span className="text-gray-800 font-medium">{book.ageGroup} Yaş</span>
            </div>
            
            {/* Page Count */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Sayfa Sayısı</span>
              <span className="text-gray-800 font-medium">{book.pages}</span>
            </div>
            
            {/* Duration */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Okuma Süresi</span>
              <span className="text-gray-800 font-medium">{book.duration}</span>
            </div>
          </div>
          
          {/* Start Button */}
          <button
            onClick={() => onStart(book)}
            className="w-full mt-6 bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
          >
            <BookOpen size={20} />
            Başla
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookInfoModal;
