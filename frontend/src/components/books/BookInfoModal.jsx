import React from 'react';
import { X, Clock, Users, BookOpen, FileText, Crown, Lock } from 'lucide-react';

const BookInfoModal = ({ book, isOpen, onClose, onStart, isPremium, canAccess }) => {
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
        
        {/* Premium Badge */}
        {isPremium && (
          <div className="absolute top-4 left-4 z-10 bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
            <Crown size={12} /> Premium
          </div>
        )}
        
        {/* Book Cover */}
        <div className="relative h-48 bg-gradient-to-b from-cyan-400 to-cyan-500 flex items-center justify-center">
          <img 
            src={book.coverImage} 
            alt={book.title}
            className="h-40 w-28 object-cover rounded-lg shadow-2xl"
          />
          {isPremium && !canAccess && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <div className="bg-white/90 rounded-full p-3">
                <Lock size={24} className="text-gray-600" />
              </div>
            </div>
          )}
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
              <span className="text-gray-800 font-medium">Çocuk Kitapları</span>
            </div>
            
            {/* Age Group */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Yaş Grubu</span>
              <span className="text-gray-800 font-medium">{book.ageGroup} Yaş</span>
            </div>
            
            {/* Page Count */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Sayfa Sayısı</span>
              <span className="text-gray-800 font-medium">{book.totalPages || book.pages}</span>
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
            className={`w-full mt-6 font-bold py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 ${
              isPremium && !canAccess 
                ? 'bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {isPremium && !canAccess ? (
              <>
                <Crown size={20} />
                Premium&apos;a Abone Ol
              </>
            ) : (
              <>
                <BookOpen size={20} />
                Başla
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookInfoModal;
