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
  Loader2,
  Volume2
} from 'lucide-react';
import { booksApi } from '../../services/api';
import { bookPages as mockPages } from '../../data/mockData';
import ReaderSettings from './ReaderSettings';
import CompletionCelebration from './CompletionCelebration';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Audio Loading Indicator Component
const AudioLoadingIndicator = ({ isLoading, progress }) => {
  if (!isLoading) return null;
  
  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-2xl flex flex-col items-center gap-3 animate-fade-in">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-orange-200 flex items-center justify-center">
            <Volume2 className="text-orange-500 animate-pulse" size={28} />
          </div>
          <div className="absolute inset-0">
            <svg className="w-16 h-16 -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="#f97316"
                strokeWidth="4"
                fill="none"
                strokeDasharray={`${progress * 1.76} 176`}
                className="transition-all duration-300"
              />
            </svg>
          </div>
        </div>
        <p className="text-gray-700 font-medium text-sm">Ses hazırlanıyor...</p>
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
};

const BookReaderLandscape = ({ book, onClose }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isPageTurning, setIsPageTurning] = useState(false);
  const [turnDirection, setTurnDirection] = useState(null);
  const [touchStart, setTouchStart] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioLoadProgress, setAudioLoadProgress] = useState(0);
  const [audioCache, setAudioCache] = useState({});
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [pages, setPages] = useState(mockPages);  // Start with mock, load from API
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

  // Fetch pages from API on mount
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
        console.log('Using mock pages, API not available:', error.message);
        // Keep using mock pages on error
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

  // Generate TTS audio for a page with progress tracking
  const generatePageAudio = useCallback(async (pageIndex) => {
    const pageData = pages[pageIndex];
    if (!pageData) return null;
    
    // Check cache first
    if (audioCache[pageIndex]) {
      return audioCache[pageIndex];
    }
    
    setIsLoadingAudio(true);
    setAudioLoadProgress(0);
    
    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setAudioLoadProgress(prev => Math.min(prev + 10, 90));
    }, 200);
    
    try {
      const response = await axios.post(`${BACKEND_URL}/api/tts/generate`, {
        text: pageData.text
      });
      
      clearInterval(progressInterval);
      setAudioLoadProgress(100);
      
      const url = response.data.audio_url;
      
      // Cache the audio
      setAudioCache(prev => ({
        ...prev,
        [pageIndex]: url
      }));
      
      return url;
    } catch (error) {
      console.error('Error generating TTS:', error);
      clearInterval(progressInterval);
      return null;
    } finally {
      setTimeout(() => {
        setIsLoadingAudio(false);
        setAudioLoadProgress(0);
      }, 300);
    }
  }, [pages, audioCache]);

  // Pre-fetch next page audio
  const prefetchNextAudio = useCallback(async (currentIdx) => {
    if (currentIdx < totalPages - 1 && !audioCache[currentIdx + 1]) {
      generatePageAudio(currentIdx + 1);
    }
  }, [totalPages, audioCache, generatePageAudio]);

  // Reset image loaded state when page changes
  useEffect(() => {
    setIsImageLoaded(false);
    setAudioUrl(null);
  }, [currentPage]);

  // Fetch audio when page changes (if autoPlay)
  useEffect(() => {
    if (autoPlay) {
      generatePageAudio(currentPage).then(url => {
        if (url) {
          setAudioUrl(url);
          prefetchNextAudio(currentPage);
        }
      });
    }
  }, [currentPage, autoPlay, generatePageAudio, prefetchNextAudio]);

  // Play audio when BOTH image is loaded AND audio is ready
  useEffect(() => {
    if (autoPlay && isImageLoaded && audioUrl && audioRef.current && !isPlaying && !isLoadingAudio) {
      audioRef.current.src = audioUrl;
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => {
          console.log('Audio play prevented:', err);
          setIsPlaying(false);
        });
    }
  }, [autoPlay, isImageLoaded, audioUrl, isPlaying, isLoadingAudio]);

  // Handle audio ended
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      setIsPlaying(false);
      
      // If autoPlay is on, go to next page automatically
      if (autoPlay) {
        if (currentPage < totalPages - 1) {
          // Navigate to next page
          setTurnDirection('next');
          setIsPageTurning(true);
          
          if (audioRef.current) {
            audioRef.current.pause();
          }
          
          setTimeout(() => {
            setCurrentPage(prev => prev + 1);
            setIsPageTurning(false);
            setTurnDirection(null);
          }, 300);
        } else {
          // End of book - show celebration!
          if (audioRef.current) {
            audioRef.current.pause();
          }
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
      
      // Stop current audio
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
      // End of book - show celebration
      setShowCelebration(true);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 0) {
      setTurnDirection('prev');
      setIsPageTurning(true);
      
      // Stop current audio
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

  // Touch handlers for swipe gesture
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

  const togglePlayPause = async () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // If no audio loaded yet, generate and play
      if (!audioUrl) {
        const url = await generatePageAudio(currentPage);
        if (url) {
          setAudioUrl(url);
          audioRef.current.src = url;
          try {
            await audioRef.current.play();
            setIsPlaying(true);
          } catch (error) {
            console.log('Play prevented:', error);
          }
        }
      } else {
        try {
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (error) {
          console.log('Play prevented:', error);
        }
      }
    }
  };

  // Handle closing from celebration
  const handleClose = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (book) {
      localStorage.removeItem(`book_progress_${book.id}`);
    }
    onClose();
  };

  // Handle restart from celebration
  const handleRestart = () => {
    setShowCelebration(false);
    setCurrentPage(0);
    setIsPlaying(false);
    setAudioUrl(null);
    setIsImageLoaded(false);
  };

  // Handle image load event
  const handleImageLoad = () => {
    setIsImageLoaded(true);
  };

  // Handle image error - proceed anyway
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

      {/* Audio Loading Indicator */}
      <AudioLoadingIndicator isLoading={isLoadingAudio} progress={audioLoadProgress} />

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
          {isLoadingAudio && <Loader2 size={16} className="animate-spin text-orange-500" />}
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
              disabled={isLoadingAudio}
              className="bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50"
              data-testid="play-pause-btn"
            >
              {isLoadingAudio ? (
                <Loader2 size={28} className="animate-spin" />
              ) : isPlaying ? (
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

      {/* Custom animations */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default BookReaderLandscape;
