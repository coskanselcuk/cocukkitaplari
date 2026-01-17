import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  const [pendingAutoStart, setPendingAutoStart] = useState(false);
  
  const [autoPlay, setAutoPlay] = useState(() => {
    const saved = localStorage.getItem('reading_autoPlay');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [resumeContinue, setResumeContinue] = useState(() => {
    const saved = localStorage.getItem('reading_resumeContinue');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const audioRef = useRef(null);
  
  // Refs to always have current values in event handlers
  const currentPageRef = useRef(currentPage);
  const autoPlayRef = useRef(autoPlay);
  const totalPagesRef = useRef(pages.length);
  
  // Keep refs in sync
  useEffect(() => { currentPageRef.current = currentPage; }, [currentPage]);
  useEffect(() => { autoPlayRef.current = autoPlay; }, [autoPlay]);
  useEffect(() => { totalPagesRef.current = pages.length; }, [pages.length]);

  const totalPages = pages.length;

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

  // When page changes: stop audio and mark pending auto-start
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = '';
    }
    setIsPlaying(false);
    setIsImageLoaded(false);
    
    if (autoPlay) {
      setPendingAutoStart(true);
    }
  }, [currentPage, autoPlay]);

  // Auto-start when image loads AND we have a pending auto-start
  useEffect(() => {
    if (!pendingAutoStart || !isImageLoaded) return;
    
    const pageData = pages[currentPage];
    if (!pageData?.audioUrl || !audioRef.current) return;

    setPendingAutoStart(false);
    audioRef.current.src = pageData.audioUrl;
    audioRef.current.play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));
  }, [pendingAutoStart, isImageLoaded, currentPage, pages]);

  // Advance to next page (used by ended handler)
  const advanceToNextPage = useCallback(() => {
    const current = currentPageRef.current;
    const total = totalPagesRef.current;
    
    if (current < total - 1) {
      setTurnDirection('next');
      setIsPageTurning(true);
      setTimeout(() => {
        setCurrentPage(current + 1);
        setIsPageTurning(false);
        setTurnDirection(null);
      }, 250);
    } else {
      setShowCelebration(true);
    }
  }, []);

  // Handle audio ended - set up ONCE, use refs for current values
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      console.log('Audio ended. AutoPlay:', autoPlayRef.current, 'Page:', currentPageRef.current);
      setIsPlaying(false);
      
      if (autoPlayRef.current) {
        advanceToNextPage();
      }
    };

    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [advanceToNextPage]);

  // Manual navigation
  const goToPage = useCallback((newPage, direction) => {
    if (newPage < 0 || newPage >= totalPages) return;
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    
    setTurnDirection(direction);
    setIsPageTurning(true);
    
    setTimeout(() => {
      setCurrentPage(newPage);
      setIsPageTurning(false);
      setTurnDirection(null);
    }, 250);
  }, [totalPages]);

  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      goToPage(currentPage + 1, 'next');
    } else {
      setShowCelebration(true);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 0) {
      goToPage(currentPage - 1, 'prev');
    }
  };

  // Toggle play/pause
  const togglePlayPause = () => {
    if (!audioRef.current) return;
    const pageData = pages[currentPage];
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (pageData?.audioUrl) {
        if (!audioRef.current.src || audioRef.current.src === '') {
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
    if (audioRef.current) audioRef.current.pause();
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

      {/* Content Area */}
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

      {/* Bottom Controls */}
      <div className={`flex-shrink-0 p-4 pt-0 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="bg-white rounded-2xl shadow-xl p-3">
          <div className="flex items-center justify-center gap-6">
            <button 
              onClick={(e) => { e.stopPropagation(); goToPrevPage(); }}
              disabled={currentPage === 0}
              className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30"
            >
              <ChevronLeft size={28} className="text-gray-700" />
            </button>
            
            <button 
              onClick={(e) => { e.stopPropagation(); togglePlayPause(); }}
              className="bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-full p-4 shadow-lg"
            >
              {isPlaying ? <Pause size={28} fill="white" /> : <Play size={28} fill="white" />}
            </button>
            
            <button 
              onClick={(e) => { e.stopPropagation(); goToNextPage(); }}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <ChevronRight size={28} className="text-gray-700" />
            </button>
          </div>
          
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
