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
import { bookPages } from '../../data/mockData';
import BookQuiz from './BookQuiz';
import ReaderSettings from './ReaderSettings';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const BookReaderLandscape = ({ book, onClose }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isPageTurning, setIsPageTurning] = useState(false);
  const [turnDirection, setTurnDirection] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioCache, setAudioCache] = useState({});
  
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

  // Generate TTS audio for a page
  const generatePageAudio = useCallback(async (pageIndex) => {
    const pageData = pages[pageIndex];
    if (!pageData) return null;
    
    // Check cache first
    if (audioCache[pageIndex]) {
      return audioCache[pageIndex];
    }
    
    setIsLoadingAudio(true);
    
    try {
      const response = await axios.post(`${BACKEND_URL}/api/tts/generate`, {
        text: pageData.text
      });
      
      const audioUrl = response.data.audio_url;
      
      // Cache the audio
      setAudioCache(prev => ({
        ...prev,
        [pageIndex]: audioUrl
      }));
      
      return audioUrl;
    } catch (error) {
      console.error('Error generating TTS:', error);
      return null;
    } finally {
      setIsLoadingAudio(false);
    }
  }, [pages, audioCache]);

  // Pre-fetch next page audio
  const prefetchNextAudio = useCallback(async (currentIdx) => {
    if (currentIdx < totalPages - 1 && !audioCache[currentIdx + 1]) {
      generatePageAudio(currentIdx + 1);
    }
  }, [totalPages, audioCache, generatePageAudio]);

  // Play audio for current page
  const playCurrentPageAudio = useCallback(async () => {
    const audioUrl = await generatePageAudio(currentPage);
    
    if (audioUrl && audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.load();
      
      try {
        await audioRef.current.play();
        setIsPlaying(true);
        
        // Pre-fetch next page
        prefetchNextAudio(currentPage);
      } catch (error) {
        console.log('Audio play prevented:', error);
        setIsPlaying(false);
      }
    }
  }, [currentPage, generatePageAudio, prefetchNextAudio]);

  // Play audio when page changes (if autoPlay or manually triggered)
  useEffect(() => {
    if (autoPlay) {
      playCurrentPageAudio();
    }
  }, [currentPage, autoPlay, playCurrentPageAudio]);

  // Handle audio ended
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      setIsPlaying(false);
      
      // If autoPlay is on, go to next page automatically
      if (autoPlay) {
        if (currentPage < totalPages - 1) {
          goToNextPage();
        } else {
          // End of book - show quiz
          setShowQuiz(true);
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
      // End of book - show quiz
      setShowQuiz(true);
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
    
    // Swipe right to left = next page
    // Swipe left to right = previous page
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        // Swiped left (right to left) - go to next page
        goToNextPage();
      } else {
        // Swiped right (left to right) - go to previous page
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
      if (!audioRef.current.src || audioRef.current.src === '') {
        await playCurrentPageAudio();
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

  // Clear progress when book is finished
  const handleClose = () => {
    // Stop audio
    if (audioRef.current) {
      audioRef.current.pause();
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
      <audio ref={audioRef} preload="auto" />

      {/* Header Controls */}
      <div className={`absolute top-0 left-0 right-0 z-20 p-4 flex justify-between items-center transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <button 
          onClick={(e) => { e.stopPropagation(); handleClose(); }}
          className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-white transition-colors"
        >
          <X size={24} className="text-gray-700" />
        </button>
        
        <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg flex items-center gap-2">
          {isLoadingAudio && <Loader2 size={16} className="animate-spin text-orange-500" />}
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
              
              {/* Swipe hint */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full flex items-center gap-2 opacity-60">
                <ChevronLeft size={14} />
                <span>Kaydır</span>
                <ChevronRight size={14} />
              </div>
            </div>
            
            {/* Page Text */}
            <div className="bg-white rounded-2xl p-4 shadow-lg">
              <p className="text-gray-800 text-lg leading-relaxed text-center">
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
      >
        <ChevronLeft size={28} className="text-gray-700" />
      </button>
      
      <button 
        onClick={(e) => { e.stopPropagation(); goToNextPage(); }}
        className={`absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg transition-all duration-300 hover:bg-white hover:scale-110 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'} hidden sm:flex`}
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
    </div>
  );
};

export default BookReaderLandscape;
