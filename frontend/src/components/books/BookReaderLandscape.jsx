import React, { useState, useEffect, useRef } from 'react';
import { 
  Music, 
  VolumeX,
  ChevronLeft,
  ChevronRight,
  X,
  Settings,
  Play,
  Pause,
  Loader2
} from 'lucide-react';
import { booksApi } from '../../services/api';
import { bookPages as mockPages } from '../../data/mockData';
import ReaderSettings from './ReaderSettings';
import CompletionCelebration from './CompletionCelebration';

const BookReaderLandscape = ({ book, onClose }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isPageTurning, setIsPageTurning] = useState(false);
  const [turnDirection, setTurnDirection] = useState(null);
  const [touchStart, setTouchStart] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [pages, setPages] = useState(mockPages);
  const [isLoadingPages, setIsLoadingPages] = useState(true);
  
  // Settings state
  const [autoPlay, setAutoPlay] = useState(() => {
    const saved = localStorage.getItem('reading_autoPlay');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [resumeContinue, setResumeContinue] = useState(() => {
    const saved = localStorage.getItem('reading_resumeContinue');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const audioRef = useRef(null);
  const totalPages = pages.length;

  // Fetch pages from API on mount (includes pre-generated audio)
  useEffect(() => {
    const fetchPages = async () => {
      if (!book?.id) {
        setIsLoadingPages(false);
        return;
      }
      
      try {
        const response = await booksApi.getPages(book.id);
        if (response.pages && response.pages.length > 0) {
          setPages(response.pages);
        }
      } catch (error) {
        console.log('Using mock pages:', error.message);
      } finally {
        setIsLoadingPages(false);
      }
    };
    
    fetchPages();
  }, [book?.id]);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('reading_autoPlay', JSON.stringify(autoPlay));
  }, [autoPlay]);

  useEffect(() => {
    localStorage.setItem('reading_resumeContinue', JSON.stringify(resumeContinue));
  }, [resumeContinue]);

  // Load saved progress on mount
  useEffect(() => {
    if (resumeContinue && book) {
      const savedProgress = localStorage.getItem(`book_progress_${book.id}`);
      if (savedProgress) {
        const { page } = JSON.parse(savedProgress);
        setCurrentPage(page);
      }
    }
  }, [book, resumeContinue]);

  // Save progress when page changes
  useEffect(() => {
    if (resumeContinue && book) {
      localStorage.setItem(`book_progress_${book.id}`, JSON.stringify({
        page: currentPage
      }));
    }
  }, [book, currentPage, resumeContinue]);

  // Reset image loaded state when page changes
  useEffect(() => {
    setIsImageLoaded(false);
  }, [currentPage]);

  // Play pre-generated audio when image is loaded (if autoPlay)
  useEffect(() => {
    const currentPageData = pages[currentPage];
    
    if (autoPlay && isImageLoaded && currentPageData?.audioUrl && audioRef.current && !isPlaying) {
      audioRef.current.src = currentPageData.audioUrl;
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => {
          console.log('Audio play prevented:', err);
          setIsPlaying(false);
        });
    }
  }, [autoPlay, isImageLoaded, currentPage, pages, isPlaying]);

  // Handle audio ended
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      setIsPlaying(false);
      
      if (autoPlay) {
        if (currentPage < totalPages - 1) {
          setTurnDirection('next');
          setIsPageTurning(true);
          
          setTimeout(() => {
            setCurrentPage(prev => prev + 1);
            setIsPageTurning(false);
            setTurnDirection(null);
          }, 300);
        } else {
          setShowCelebration(true);
        }
      }
    };

    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [autoPlay, currentPage, totalPages]);

  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      setTurnDirection('next');
      setIsPageTurning(true);
      
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      
      setTimeout(() => {
        setCurrentPage(prev => prev + 1);
        setIsPageTurning(false);
        setTurnDirection(null);
      }, 300);
    } else {
      setShowCelebration(true);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 0) {
      setTurnDirection('prev');
      setIsPageTurning(true);
      
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      
      setTimeout(() => {
        setCurrentPage(prev => prev - 1);
        setIsPageTurning(false);
        setTurnDirection(null);
      }, 300);
    }
  };

  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (!touchStart) return;
    
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        goToNextPage();
      } else {
        goToPrevPage();
      }
    }
    setTouchStart(null);
  };

  const [audioLoadedForPage, setAudioLoadedForPage] = useState(-1);

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    
    const currentPageData = pages[currentPage];
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (currentPageData?.audioUrl) {
        // Only set src if we haven't loaded audio for this page yet
        if (audioLoadedForPage !== currentPage) {
          audioRef.current.src = currentPageData.audioUrl;
          setAudioLoadedForPage(currentPage);
        }
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(err => console.log('Play prevented:', err));
      }
    }
  };

  const handleClose = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (book && currentPage >= totalPages - 1) {
      localStorage.removeItem(`book_progress_${book.id}`);
    }
    onClose();
  };

  const handleRestart = () => {
    setShowCelebration(false);
    setCurrentPage(0);
    setIsPlaying(false);
    setIsImageLoaded(false);
  };

  const handleImageLoad = () => {
    setIsImageLoaded(true);
  };

  const handleImageError = () => {
    setIsImageLoaded(true);
  };

  // Show celebration screen
  if (showCelebration) {
    return (
      <CompletionCelebration 
        book={book} 
        onClose={handleClose} 
        onRestart={handleRestart}
      />
    );
  }

  // Show loading while fetching pages
  if (isLoadingPages) {
    return (
      <div className="fixed inset-0 z-50 bg-amber-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-700">Kitap yükleniyor...</p>
        </div>
      </div>
    );
  }

  const currentPageData = pages[currentPage];

  return (
    <div 
      className="fixed inset-0 z-50 bg-amber-50"
      onClick={() => setShowControls(!showControls)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Hidden Audio Element */}
      <audio ref={audioRef} preload="auto" />

      {/* Header Controls */}
      <div className={`absolute top-0 left-0 right-0 z-20 p-4 flex justify-between items-center transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <button 
          onClick={(e) => { e.stopPropagation(); handleClose(); }}
          className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-white transition-colors"
          data-testid="close-reader-btn"
        >
          <X size={24} className="text-gray-700" />
        </button>
        
        <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg flex items-center gap-2">
          <span className="text-gray-700 font-semibold" data-testid="page-counter">
            {currentPage + 1} / {totalPages}
          </span>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); setShowSettings(true); }}
            className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-white transition-colors"
            data-testid="settings-btn"
          >
            <Settings size={24} className="text-gray-700" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); togglePlayPause(); }}
            className={`rounded-full p-3 shadow-lg transition-colors ${isPlaying ? 'bg-orange-500 text-white' : 'bg-white/90 text-gray-700'}`}
            data-testid="audio-toggle-btn"
          >
            {isPlaying ? <Music size={24} /> : <VolumeX size={24} />}
          </button>
        </div>
      </div>

      {/* Book Content */}
      <div className="h-full flex flex-col pt-20 pb-32 px-4">
        {currentPageData && (
          <div className={`flex-1 flex flex-col transition-all duration-300 ${isPageTurning ? (turnDirection === 'next' ? 'translate-x-[-20px] opacity-50' : 'translate-x-[20px] opacity-50') : ''}`}>
            {/* Page Image */}
            <div className="flex-1 relative rounded-2xl overflow-hidden shadow-xl mb-4">
              <img 
                src={currentPageData.image} 
                alt={`Sayfa ${currentPage + 1}`}
                className="w-full h-full object-cover"
                onLoad={handleImageLoad}
                onError={handleImageError}
                data-testid="page-image"
              />
              
              {/* Loading overlay while image loads */}
              {!isImageLoaded && (
                <div className="absolute inset-0 bg-amber-100 flex items-center justify-center">
                  <Loader2 size={48} className="animate-spin text-orange-500" />
                </div>
              )}
              
              {/* Interactive Hotspots */}
              {currentPageData.hotspots?.map((hotspot, idx) => (
                <div 
                  key={idx}
                  className="absolute w-12 h-12 border-2 border-orange-400 rounded-full cursor-pointer animate-pulse hover:bg-orange-400/30 transition-colors"
                  style={{ top: `${hotspot.y}%`, left: `${hotspot.x}%` }}
                  onClick={(e) => e.stopPropagation()}
                />
              ))}
              
              {/* Page turn indicator */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-20 bg-gradient-to-l from-red-400 to-red-500 rounded-l-full opacity-60" />
              
              {/* Swipe hint */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full flex items-center gap-2 opacity-60">
                <ChevronLeft size={14} />
                <span>Kaydır</span>
                <ChevronRight size={14} />
              </div>
            </div>
            
            {/* Page Text */}
            <div className="bg-white rounded-2xl p-4 shadow-lg">
              <p className="text-gray-800 text-lg leading-relaxed text-center" data-testid="page-text">
                {currentPageData.text}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Arrows (for desktop) */}
      <button 
        onClick={(e) => { e.stopPropagation(); goToPrevPage(); }}
        disabled={currentPage === 0}
        className={`absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg transition-all duration-300 ${currentPage === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white hover:scale-110'} ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'} hidden sm:flex`}
        data-testid="prev-page-btn"
      >
        <ChevronLeft size={28} className="text-gray-700" />
      </button>
      
      <button 
        onClick={(e) => { e.stopPropagation(); goToNextPage(); }}
        className={`absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg transition-all duration-300 hover:bg-white hover:scale-110 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'} hidden sm:flex`}
        data-testid="next-page-btn"
      >
        <ChevronRight size={28} className="text-gray-700" />
      </button>

      {/* Bottom Audio Controls */}
      <div className={`absolute bottom-0 left-0 right-0 p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="bg-white rounded-2xl shadow-2xl p-4">
          <div className="flex items-center justify-center gap-4">
            {/* Play/Pause Button */}
            <button 
              onClick={(e) => { e.stopPropagation(); togglePlayPause(); }}
              className="bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              data-testid="play-pause-btn"
            >
              {isPlaying ? (
                <Pause size={28} fill="white" />
              ) : (
                <Play size={28} fill="white" />
              )}
            </button>
          </div>
          
          {/* Status indicators */}
          <div className="mt-3 flex items-center justify-center gap-4 text-xs">
            {autoPlay && (
              <div className="flex items-center gap-2 text-orange-500">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                <span>Otomatik Oynatma Açık</span>
              </div>
            )}
            {isPlaying && (
              <div className="flex items-center gap-2 text-green-500">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>Ses Çalıyor</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <ReaderSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        autoPlay={autoPlay}
        setAutoPlay={setAutoPlay}
        resumeContinue={resumeContinue}
        setResumeContinue={setResumeContinue}
      />
    </div>
  );
};

export default BookReaderLandscape;
