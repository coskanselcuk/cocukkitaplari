import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Music, 
  MusicOff,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { bookPages } from '../../data/mockData';
import BookQuiz from './BookQuiz';

const BookReaderLandscape = ({ book, onClose }) => {
  const [currentSpread, setCurrentSpread] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [isPageTurning, setIsPageTurning] = useState(false);
  const [turnDirection, setTurnDirection] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [touchStart, setTouchStart] = useState(null);

  const pages = bookPages;
  const totalSpreads = Math.ceil(pages.length / 2);

  // Get current spread pages
  const leftPage = pages[currentSpread * 2];
  const rightPage = pages[currentSpread * 2 + 1];

  const nextSpread = () => {
    if (currentSpread < totalSpreads - 1) {
      setTurnDirection('next');
      setIsPageTurning(true);
      setTimeout(() => {
        setCurrentSpread(prev => prev + 1);
        setIsPageTurning(false);
        setTurnDirection(null);
      }, 300);
    } else {
      // End of book - show quiz
      setShowQuiz(true);
    }
  };

  const prevSpread = () => {
    if (currentSpread > 0) {
      setTurnDirection('prev');
      setIsPageTurning(true);
      setTimeout(() => {
        setCurrentSpread(prev => prev - 1);
        setIsPageTurning(false);
        setTurnDirection(null);
      }, 300);
    }
  };

  // Touch handlers for swipe
  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (!touchStart) return;
    
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        nextSpread();
      } else {
        prevSpread();
      }
    }
    setTouchStart(null);
  };

  const toggleAudio = () => setIsPlaying(!isPlaying);

  // Interactive hotspot click
  const handleHotspotClick = (e) => {
    e.stopPropagation();
    // Add animation/sound effect here
  };

  if (showQuiz) {
    return <BookQuiz book={book} onClose={onClose} />;
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-amber-50"
      onClick={() => setShowControls(!showControls)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header Controls */}
      <div className={`absolute top-0 left-0 right-0 z-20 p-4 flex justify-between items-center transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <button 
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-white transition-colors"
        >
          <X size={24} className="text-gray-700" />
        </button>
        
        <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
          <span className="text-gray-700 font-semibold">
            {currentSpread * 2 + 1}-{Math.min((currentSpread + 1) * 2, pages.length)} / {pages.length}
          </span>
        </div>
        
        <button 
          onClick={(e) => { e.stopPropagation(); toggleAudio(); }}
          className={`rounded-full p-3 shadow-lg transition-colors ${isPlaying ? 'bg-orange-500 text-white' : 'bg-white/90 text-gray-700'}`}
        >
          {isPlaying ? <Music size={24} /> : <MusicOff size={24} />}
        </button>
      </div>

      {/* Book Spread Container */}
      <div className="h-full flex items-center justify-center px-4 py-16">
        <div className={`relative w-full max-w-5xl h-full max-h-[70vh] bg-white rounded-lg shadow-2xl flex overflow-hidden transition-transform duration-300 ${isPageTurning ? (turnDirection === 'next' ? 'translate-x-[-10px]' : 'translate-x-[10px]') : ''}`}>
          
          {/* Left Page */}
          <div className="flex-1 relative border-r border-gray-200 p-6 flex flex-col">
            {leftPage && (
              <>
                {/* Page Image */}
                <div className="flex-1 relative rounded-lg overflow-hidden mb-4">
                  <img 
                    src={leftPage.image} 
                    alt={`Sayfa ${currentSpread * 2 + 1}`}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Interactive Hotspots */}
                  <div 
                    className="absolute top-1/4 left-1/4 w-12 h-12 border-2 border-orange-400 rounded-full cursor-pointer animate-pulse hover:bg-orange-400/30 transition-colors"
                    onClick={handleHotspotClick}
                  />
                  <div 
                    className="absolute bottom-1/3 right-1/4 w-10 h-10 border-2 border-orange-400 rounded-full cursor-pointer animate-pulse hover:bg-orange-400/30 transition-colors"
                    onClick={handleHotspotClick}
                    style={{ animationDelay: '0.5s' }}
                  />
                </div>
                
                {/* Page Text */}
                <div className="text-gray-800 text-lg leading-relaxed text-right" dir="auto">
                  {leftPage.text}
                </div>
              </>
            )}
          </div>
          
          {/* Right Page */}
          <div className="flex-1 relative p-6 flex flex-col">
            {rightPage && (
              <>
                {/* Page Image */}
                <div className="flex-1 relative rounded-lg overflow-hidden mb-4">
                  <img 
                    src={rightPage.image} 
                    alt={`Sayfa ${currentSpread * 2 + 2}`}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Interactive Hotspots */}
                  <div 
                    className="absolute top-1/3 right-1/4 w-11 h-11 border-2 border-orange-400 rounded-full cursor-pointer animate-pulse hover:bg-orange-400/30 transition-colors"
                    onClick={handleHotspotClick}
                  />
                </div>
                
                {/* Page Text */}
                <div className="text-gray-800 text-lg leading-relaxed text-right" dir="auto">
                  {rightPage.text}
                </div>
              </>
            )}
            
            {/* Page turn indicator */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-16 bg-gradient-to-l from-red-400 to-red-500 rounded-l-full opacity-50" />
          </div>
          
          {/* Book spine shadow */}
          <div className="absolute left-1/2 top-0 bottom-0 w-4 -translate-x-1/2 bg-gradient-to-r from-gray-300 via-gray-100 to-gray-300 shadow-inner" />
        </div>
      </div>

      {/* Navigation Arrows */}
      <button 
        onClick={(e) => { e.stopPropagation(); prevSpread(); }}
        disabled={currentSpread === 0}
        className={`absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-full p-4 shadow-lg transition-all duration-300 ${currentSpread === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white hover:scale-110'} ${showControls ? 'opacity-100' : 'opacity-0'}`}
      >
        <ChevronLeft size={32} className="text-gray-700" />
      </button>
      
      <button 
        onClick={(e) => { e.stopPropagation(); nextSpread(); }}
        className={`absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-full p-4 shadow-lg transition-all duration-300 hover:bg-white hover:scale-110 ${showControls ? 'opacity-100' : 'opacity-0'}`}
      >
        <ChevronRight size={32} className="text-gray-700" />
      </button>

      {/* Progress Bar */}
      <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 w-64 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-300"
            style={{ width: `${((currentSpread + 1) / totalSpreads) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default BookReaderLandscape;
