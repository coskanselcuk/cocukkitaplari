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
  
  const [autoPlay, setAutoPlay] = useState(() => {
    const saved = localStorage.getItem('reading_autoPlay');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [resumeContinue, setResumeContinue] = useState(() => {
    const saved = localStorage.getItem('reading_resumeContinue');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const audioRef = useRef(null);
  const currentPageRef = useRef(currentPage);
  const hasAutoStartedRef = useRef(false);
  
  const totalPages = pages.length;

  // Keep ref in sync
  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  // Fetch pages from API
  useEffect(() => {
    const fetchPages = async () => {
      if (!book?.id) {
        setIsLoadingPages(false);
        return;
      }
      try {
        const response = await booksApi.getPages(book.id);
        if (response.pages?.length > 0) {
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

  // Save settings
  useEffect(() => {
    localStorage.setItem('reading_autoPlay', JSON.stringify(autoPlay));
  }, [autoPlay]);

  useEffect(() => {
    localStorage.setItem('reading_resumeContinue', JSON.stringify(resumeContinue));
  }, [resumeContinue]);

  // Load saved progress
  useEffect(() => {
    if (resumeContinue && book) {
      const saved = localStorage.getItem(`book_progress_${book.id}`);
      if (saved) {
        const { page } = JSON.parse(saved);
        setCurrentPage(page);
      }
    }
  }, [book, resumeContinue]);

  // Save progress
  useEffect(() => {
    if (resumeContinue && book) {
      localStorage.setItem(`book_progress_${book.id}`, JSON.stringify({ page: currentPage }));
    }
  }, [book, currentPage, resumeContinue]);

  // CRITICAL: Stop audio and reset state when page changes
  useEffect(() => {
    // Stop any playing audio immediately
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = '';
    }
    setIsPlaying(false);
    setIsImageLoaded(false);
    hasAutoStartedRef.current = false;
  }, [currentPage]);

  // Auto-start audio when image loads (only if autoPlay is ON and hasn't auto-started yet)
  useEffect(() => {
    if (!autoPlay || !isImageLoaded || hasAutoStartedRef.current) return;
    
    const pageData = pages[currentPage];
    if (!pageData?.audioUrl || !audioRef.current) return;

    hasAutoStartedRef.current = true;
    audioRef.current.src = pageData.audioUrl;
    audioRef.current.play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));
  }, [autoPlay, isImageLoaded, currentPage, pages]);

  // Handle audio ended - auto advance if autoPlay is on
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      setIsPlaying(false);
      
      if (autoPlay && currentPageRef.current < totalPages - 1) {
        // Auto advance to next page
        changePage(currentPageRef.current + 1, 'next');
      } else if (currentPageRef.current >= totalPages - 1) {
        setShowCelebration(true);
      }
    };

    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [autoPlay, totalPages]);

  // Unified page change function - ALWAYS stops audio first
  const changePage = (newPage, direction) => {
    if (newPage < 0 || newPage >= totalPages) return;
    
    // Stop current audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    
    // Animate transition
    setTurnDirection(direction);
    setIsPageTurning(true);
    
    setTimeout(() => {
      setCurrentPage(newPage);
      setIsPageTurning(false);
      setTurnDirection(null);
    }, 250);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      changePage(currentPage + 1, 'next');
    } else {
      setShowCelebration(true);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 0) {
      changePage(currentPage - 1, 'prev');
    }
  };

  // Toggle play/pause - works regardless of autoPlay setting
  const togglePlayPause = () => {
    if (!audioRef.current) return;
    const pageData = pages[currentPage];
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (pageData?.audioUrl) {
        // If src is empty or different, set it
        if (!audioRef.current.src || !audioRef.current.src.startsWith('data:')) {
          audioRef.current.src = pageData.audioUrl;
        }
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
    }
  };

  // Touch handlers
  const handleTouchStart = (e) => setTouchStart(e.touches[0].clientX);
  
  const handleTouchEnd = (e) => {
    if (!touchStart) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? goToNextPage() : goToPrevPage();
    }
    setTouchStart(null);
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
  };

  if (showCelebration) {
    return <CompletionCelebration book={book} onClose={handleClose} onRestart={handleRestart} />;
  }

  if (isLoadingPages) {
    return (
      <div className="fixed inset-0 z-50 bg-amber-50 flex items-center justify-center">
        <Loader2 size={48} className="animate-spin text-orange-500" />
      </div>
    );
  }

  const currentPageData = pages[currentPage];

  return (
    <div 
      className="fixed inset-0 z-50 bg-amber-50 flex flex-col"
      onClick={() => setShowControls(!showControls)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <audio ref={audioRef} preload="auto" />

      {/* Header */}
      <div className={`flex-shrink-0 p-4 flex justify-between items-center transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <button 
          onClick={(e) => { e.stopPropagation(); handleClose(); }}
          className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg"
        >
          <X size={24} className="text-gray-700" />
        </button>
        
        <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
          <span className="text-gray-700 font-semibold">{currentPage + 1} / {totalPages}</span>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); setShowSettings(true); }}
            className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg"
          >
            <Settings size={24} className="text-gray-700" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); togglePlayPause(); }}
            className={`rounded-full p-3 shadow-lg ${isPlaying ? 'bg-orange-500 text-white' : 'bg-white/90 text-gray-700'}`}
          >
            {isPlaying ? <Music size={24} /> : <VolumeX size={24} />}
          </button>
        </div>
      </div>

      {/* Content Area - flex-1 to fill remaining space */}
      <div className="flex-1 px-4 pb-4 overflow-hidden">
        {currentPageData && (
          <div className={`h-full flex flex-col transition-all duration-250 ${isPageTurning ? (turnDirection === 'next' ? '-translate-x-4 opacity-50' : 'translate-x-4 opacity-50') : ''}`}>
            {/* Image */}
            <div className="flex-1 relative rounded-2xl overflow-hidden shadow-xl mb-3 min-h-0">
              <img 
                src={currentPageData.image} 
                alt={`Sayfa ${currentPage + 1}`}
                className="w-full h-full object-cover"
                onLoad={() => setIsImageLoaded(true)}
                onError={() => setIsImageLoaded(true)}
              />
              {!isImageLoaded && (
                <div className="absolute inset-0 bg-amber-100 flex items-center justify-center">
                  <Loader2 size={48} className="animate-spin text-orange-500" />
                </div>
              )}
              
              {/* Swipe hint */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/40 text-white text-xs px-3 py-1 rounded-full flex items-center gap-2 opacity-60">
                <ChevronLeft size={14} />
                <span>Kaydır</span>
                <ChevronRight size={14} />
              </div>
            </div>
            
            {/* Text */}
            <div className="flex-shrink-0 bg-white rounded-2xl p-4 shadow-lg">
              <p className="text-gray-800 text-base leading-relaxed text-center">
                {currentPageData.text}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls - fixed height, no overlap */}
      <div className={`flex-shrink-0 p-4 pt-0 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="bg-white rounded-2xl shadow-xl p-3">
          <div className="flex items-center justify-center gap-6">
            {/* Prev */}
            <button 
              onClick={(e) => { e.stopPropagation(); goToPrevPage(); }}
              disabled={currentPage === 0}
              className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30"
            >
              <ChevronLeft size={28} className="text-gray-700" />
            </button>
            
            {/* Play/Pause */}
            <button 
              onClick={(e) => { e.stopPropagation(); togglePlayPause(); }}
              className="bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-full p-4 shadow-lg"
            >
              {isPlaying ? <Pause size={28} fill="white" /> : <Play size={28} fill="white" />}
            </button>
            
            {/* Next */}
            <button 
              onClick={(e) => { e.stopPropagation(); goToNextPage(); }}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <ChevronRight size={28} className="text-gray-700" />
            </button>
          </div>
          
          {/* Status */}
          <div className="mt-2 flex items-center justify-center gap-4 text-xs">
            {autoPlay && (
              <span className="flex items-center gap-1 text-orange-500">
                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                Otomatik
              </span>
            )}
            {isPlaying && (
              <span className="flex items-center gap-1 text-green-500">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                Çalıyor
              </span>
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
