import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Music, 
  VolumeX,
  ChevronLeft,
  ChevronRight,
  X,
  Settings,
  Play,
  Pause
} from 'lucide-react';
import { bookPages } from '../../data/mockData';
import BookQuiz from './BookQuiz';
import ReaderSettings from './ReaderSettings';

const BookReaderLandscape = ({ book, onClose }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isPageTurning, setIsPageTurning] = useState(false);
  const [turnDirection, setTurnDirection] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
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
  const pages = bookPages;
  const totalPages = pages.length;

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
        const { page, audioTime } = JSON.parse(savedProgress);
        setCurrentPage(page);
        if (audioRef.current && audioTime) {
          audioRef.current.currentTime = audioTime;
        }
      }
    }
  }, [book, resumeContinue]);

  // Save progress periodically
  useEffect(() => {
    if (resumeContinue && book) {
      const saveProgress = () => {
        localStorage.setItem(`book_progress_${book.id}`, JSON.stringify({
          page: currentPage,
          audioTime: audioRef.current?.currentTime || 0
        }));
      };
      
      const interval = setInterval(saveProgress, 2000);
      return () => clearInterval(interval);
    }
  }, [book, currentPage, resumeContinue]);

  // Auto-play: Sync pages with audio timestamps
  const handleTimeUpdate = useCallback(() => {
    if (!audioRef.current || !autoPlay || !isPlaying) return;
    
    const currentAudioTime = audioRef.current.currentTime;
    setCurrentTime(currentAudioTime);
    
    // Find which page should be displayed based on audio time
    for (let i = pages.length - 1; i >= 0; i--) {
      if (currentAudioTime >= pages[i].audioStartTime) {
        if (i !== currentPage) {
          setCurrentPage(i);
        }
        break;
      }
    }
  }, [autoPlay, isPlaying, currentPage, pages]);

  // Setup audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      // Show quiz at the end
      setShowQuiz(true);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [handleTimeUpdate]);

  // Auto-start playing if autoPlay is enabled
  useEffect(() => {
    if (autoPlay && audioRef.current && book?.audioUrl) {
      // Small delay to ensure audio is loaded
      const timer = setTimeout(() => {
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(err => {
          console.log('Auto-play prevented by browser:', err);
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoPlay, book]);

  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setTurnDirection('next');
      setIsPageTurning(true);
      
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      
      // If not auto-playing, sync audio to new page
      if (!autoPlay && audioRef.current && pages[newPage]) {
        audioRef.current.currentTime = pages[newPage].audioStartTime;
      }
      
      setTimeout(() => {
        setIsPageTurning(false);
        setTurnDirection(null);
      }, 300);
    } else {
      // End of book - show quiz
      setShowQuiz(true);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setTurnDirection('prev');
      setIsPageTurning(true);
      
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      
      // Sync audio to new page
      if (audioRef.current && pages[newPage]) {
        audioRef.current.currentTime = pages[newPage].audioStartTime;
      }
      
      setTimeout(() => {
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
        nextPage();
      } else {
        prevPage();
      }
    }
    setTouchStart(null);
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.log('Play prevented:', err);
      });
    }
  };

  const handleProgressClick = (e) => {
    if (!audioRef.current || !duration) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Clear progress when book is finished
  const handleClose = () => {
    if (book) {
      // Don't clear progress on close, only when quiz is completed
    }
    onClose();
  };

  if (showQuiz) {
    return <BookQuiz book={book} onClose={() => {
      // Clear progress when quiz is done
      if (book) {
        localStorage.removeItem(`book_progress_${book.id}`);
      }
      onClose();
    }} />;
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
      <audio
        ref={audioRef}
        src={book?.audioUrl}
        preload="auto"
      />

      {/* Header Controls */}
      <div className={`absolute top-0 left-0 right-0 z-20 p-4 flex justify-between items-center transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <button 
          onClick={(e) => { e.stopPropagation(); handleClose(); }}
          className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-white transition-colors"
        >
          <X size={24} className="text-gray-700" />
        </button>
        
        <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
          <span className="text-gray-700 font-semibold">
            {currentPage + 1} / {totalPages}
          </span>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); setShowSettings(true); }}
            className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-white transition-colors"
          >
            <Settings size={24} className="text-gray-700" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); togglePlayPause(); }}
            className={`rounded-full p-3 shadow-lg transition-colors ${isPlaying ? 'bg-orange-500 text-white' : 'bg-white/90 text-gray-700'}`}
          >
            {isPlaying ? <Music size={24} /> : <VolumeX size={24} />}
          </button>
        </div>
      </div>

      {/* Book Content - Single Page View for Mobile */}
      <div className="h-full flex flex-col pt-20 pb-36 px-4">
        {currentPageData && (
          <>
            {/* Page Image */}
            <div className="flex-1 relative rounded-2xl overflow-hidden shadow-xl mb-4">
              <img 
                src={currentPageData.image} 
                alt={`Sayfa ${currentPage + 1}`}
                className="w-full h-full object-cover"
              />
              
              {/* Interactive Hotspots */}
              <div 
                className="absolute top-1/4 left-1/4 w-12 h-12 border-2 border-orange-400 rounded-full cursor-pointer animate-pulse hover:bg-orange-400/30 transition-colors"
                onClick={(e) => e.stopPropagation()}
              />
              <div 
                className="absolute bottom-1/3 right-1/4 w-10 h-10 border-2 border-orange-400 rounded-full cursor-pointer animate-pulse hover:bg-orange-400/30 transition-colors"
                onClick={(e) => e.stopPropagation()}
                style={{ animationDelay: '0.5s' }}
              />
              
              {/* Page turn indicator */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-20 bg-gradient-to-l from-red-400 to-red-500 rounded-l-full opacity-60" />
            </div>
            
            {/* Page Text */}
            <div className="bg-white rounded-2xl p-4 shadow-lg">
              <p className="text-gray-800 text-lg leading-relaxed text-center">
                {currentPageData.text}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Navigation Arrows */}
      <button 
        onClick={(e) => { e.stopPropagation(); prevPage(); }}
        disabled={currentPage === 0}
        className={`absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg transition-all duration-300 ${currentPage === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white hover:scale-110'} ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <ChevronLeft size={28} className="text-gray-700" />
      </button>
      
      <button 
        onClick={(e) => { e.stopPropagation(); nextPage(); }}
        className={`absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg transition-all duration-300 hover:bg-white hover:scale-110 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <ChevronRight size={28} className="text-gray-700" />
      </button>

      {/* Audio Progress Bar & Controls */}
      <div className={`absolute bottom-0 left-0 right-0 p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="bg-white rounded-2xl shadow-2xl p-4">
          {/* Play/Pause and Progress */}
          <div className="flex items-center gap-4">
            <button 
              onClick={(e) => { e.stopPropagation(); togglePlayPause(); }}
              className="bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex-shrink-0"
            >
              {isPlaying ? <Pause size={24} fill="white" /> : <Play size={24} fill="white" />}
            </button>
            
            <div className="flex-1">
              {/* Progress bar */}
              <div 
                className="h-2 bg-gray-200 rounded-full overflow-hidden cursor-pointer"
                onClick={(e) => { e.stopPropagation(); handleProgressClick(e); }}
              >
                <div 
                  className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-100"
                  style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                />
              </div>
              {/* Time display */}
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>
          
          {/* Auto-play indicator */}
          {autoPlay && (
            <div className="mt-2 flex items-center justify-center gap-2 text-xs text-orange-500">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              <span>Otomatik Oynatma Açık</span>
            </div>
          )}
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
