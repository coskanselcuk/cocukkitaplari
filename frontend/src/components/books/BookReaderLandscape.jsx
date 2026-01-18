import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ChevronLeft, ChevronRight, X, Settings, Play, Pause, Loader2
} from 'lucide-react';
import { booksApi, progressApi } from '../../services/api';
import { bookPages as mockPages } from '../../data/mockData';
import ReaderSettings from './ReaderSettings';
import CompletionCelebration from './CompletionCelebration';
import { useAuth } from '../../contexts/AuthContext';

const BookReaderLandscape = ({ book, onClose }) => {
  const { user, isAuthenticated } = useAuth();
  
  // Use authenticated user ID or fallback to default
  const userId = isAuthenticated && user?.user_id ? user.user_id : 'default-user';
  
  const [currentPage, setCurrentPage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [pages, setPages] = useState(mockPages);
  const [isLoadingPages, setIsLoadingPages] = useState(true);
  const [touchStart, setTouchStart] = useState(null);
  const [progressLoaded, setProgressLoaded] = useState(false);
  
  const [autoPlay, setAutoPlay] = useState(() => {
    const saved = localStorage.getItem('reading_autoPlay');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [resumeContinue, setResumeContinue] = useState(() => {
    const saved = localStorage.getItem('reading_resumeContinue');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const audioRef = useRef(null);
  
  // Track if audio has been started for current page to prevent restarts
  const audioStartedForPageRef = useRef(-1);
  
  // Refs to hold latest state values - prevents stale closure issues
  const autoPlayRef = useRef(autoPlay);
  const currentPageRef = useRef(currentPage);
  const pagesRef = useRef(pages);
  
  // Keep refs in sync with state
  useEffect(() => { autoPlayRef.current = autoPlay; }, [autoPlay]);
  useEffect(() => { currentPageRef.current = currentPage; }, [currentPage]);
  useEffect(() => { pagesRef.current = pages; }, [pages]);
  // Derived values - also need refs for use in callbacks
  const totalPages = pages.length;
  const currentPageData = pages[currentPage];

  // Fetch pages
  useEffect(() => {
    const fetchPages = async () => {
      if (!book?.id) { setIsLoadingPages(false); return; }
      try {
        const response = await booksApi.getPages(book.id);
        if (response.pages?.length > 0) setPages(response.pages);
      } catch (e) { console.log('Using mock pages'); }
      finally { setIsLoadingPages(false); }
    };
    fetchPages();
  }, [book?.id]);

  // Save settings (keep in localStorage - these are user preferences)
  useEffect(() => { localStorage.setItem('reading_autoPlay', JSON.stringify(autoPlay)); }, [autoPlay]);
  useEffect(() => { localStorage.setItem('reading_resumeContinue', JSON.stringify(resumeContinue)); }, [resumeContinue]);

  // Load progress from backend
  useEffect(() => {
    const loadProgress = async () => {
      if (!resumeContinue || !book?.id || progressLoaded) return;
      
      try {
        const response = await progressApi.getUserProgress(userId);
        const bookProgress = response.books?.find(b => b.bookId === book.id);
        if (bookProgress && bookProgress.currentPage > 0) {
          setCurrentPage(bookProgress.currentPage);
        }
      } catch (error) {
        // Fallback to localStorage if backend fails
        console.log('Using localStorage for progress');
        const saved = localStorage.getItem(`book_progress_${book.id}`);
        if (saved) setCurrentPage(JSON.parse(saved).page);
      }
      setProgressLoaded(true);
    };
    
    loadProgress();
  }, [book?.id, resumeContinue, progressLoaded, userId]);

  // Save progress to backend (debounced)
  const saveProgressRef = useRef(null);
  useEffect(() => {
    if (!resumeContinue || !book?.id || !progressLoaded) return;
    
    // Clear previous timeout
    if (saveProgressRef.current) {
      clearTimeout(saveProgressRef.current);
    }
    
    // Debounce save to avoid too many API calls
    saveProgressRef.current = setTimeout(async () => {
      try {
        await progressApi.saveProgress(userId, book.id, currentPage);
      } catch (error) {
        // Fallback to localStorage if backend fails
        console.log('Saving to localStorage');
        localStorage.setItem(`book_progress_${book.id}`, JSON.stringify({ page: currentPage }));
      }
    }, 1000); // Save after 1 second of no page changes
    
    return () => {
      if (saveProgressRef.current) {
        clearTimeout(saveProgressRef.current);
      }
    };
  }, [book?.id, currentPage, resumeContinue, progressLoaded, userId]);

  // Handle image load - wait for decode + delay for actual paint
  const handleImageLoad = useCallback((e) => {
    const img = e.target;
    
    const markLoaded = () => {
      // 1 second delay after decode to ensure paint has completed
      setTimeout(() => setIsImageLoaded(true), 1000);
    };
    
    if (img.decode) {
      img.decode().then(markLoaded).catch(markLoaded);
    } else {
      markLoaded();
    }
  }, []);

  // Stop audio when page changes and reset tracking
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setIsPlaying(false);
    setIsImageLoaded(false);
    // Reset the audio started tracker when page changes
    // This allows audio to start fresh on the new page
    audioStartedForPageRef.current = -1;
  }, [currentPage]);

  // Auto-start audio when image loads (only once per page)
  useEffect(() => {
    // Skip if autoPlay is off, image not loaded, or no audio
    if (!autoPlay || !isImageLoaded || !currentPageData?.audioUrl) return;
    
    // Skip if audio was already started for this page (prevents restart on re-render)
    if (audioStartedForPageRef.current === currentPage) {
      return;
    }
    
    const audio = audioRef.current;
    if (!audio) return;
    
    // Mark that we're starting audio for this page
    audioStartedForPageRef.current = currentPage;
    
    audio.src = currentPageData.audioUrl;
    audio.play()
      .then(() => setIsPlaying(true))
      .catch(() => {
        setIsPlaying(false);
        // Reset tracker if play failed so user can manually retry
        audioStartedForPageRef.current = -1;
      });
  }, [autoPlay, isImageLoaded, currentPageData?.audioUrl, currentPage]);

  // AUDIO ENDED HANDLER - uses refs to access latest state values
  const handleAudioEnded = useCallback(() => {
    console.log('Audio ended - autoPlay:', autoPlayRef.current, 'currentPage:', currentPageRef.current, 'totalPages:', pagesRef.current.length);
    setIsPlaying(false);
    
    // Use refs to get the latest values, not stale closure values
    if (autoPlayRef.current) {
      const total = pagesRef.current.length;
      const current = currentPageRef.current;
      
      if (current < total - 1) {
        console.log('Auto-advancing to page:', current + 1);
        setCurrentPage(current + 1);
      } else {
        console.log('Book complete, showing celebration');
        // Mark complete in backend
        progressApi.markComplete(userId, book?.id).catch(() => {});
        setShowCelebration(true);
      }
    }
  }, [book?.id, userId]); // Include book.id and userId for completion tracking

  const goNext = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
    } else {
      // Mark complete and show celebration
      progressApi.markComplete(userId, book?.id).catch(() => {});
      setShowCelebration(true);
    }
  };

  const goPrev = () => {
    if (currentPage > 0) setCurrentPage(prev => prev - 1);
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || !currentPageData?.audioUrl) return;
    
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      if (!audio.src) audio.src = currentPageData.audioUrl;
      audio.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const handleTouchStart = (e) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    if (!touchStart) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) diff > 0 ? goNext() : goPrev();
    setTouchStart(null);
  };

  const handleClose = async () => {
    audioRef.current?.pause();
    
    // If book is completed, mark it as complete in backend and clear progress
    if (book && currentPage >= totalPages - 1) {
      try {
        await progressApi.markComplete(userId, book.id);
        await progressApi.deleteProgress(userId, book.id);
      } catch (error) {
        console.log('Error marking complete:', error);
      }
      localStorage.removeItem(`book_progress_${book.id}`);
    }
    onClose();
  };

  const handleBookComplete = async () => {
    // Mark book as complete in backend
    if (book) {
      try {
        await progressApi.markComplete(userId, book.id);
      } catch (error) {
        console.log('Error marking complete:', error);
      }
    }
    setShowCelebration(true);
  };

  if (showCelebration) {
    return <CompletionCelebration book={book} onClose={handleClose} onRestart={() => { setShowCelebration(false); setCurrentPage(0); }} />;
  }

  if (isLoadingPages) {
    return <div className="fixed inset-0 z-50 bg-amber-50 flex items-center justify-center"><Loader2 size={48} className="animate-spin text-orange-500" /></div>;
  }

  return (
    <div className="fixed inset-0 z-50 bg-amber-50 flex flex-col" onClick={() => setShowControls(!showControls)} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      
      {/* Audio element with onEnded handler */}
      <audio ref={audioRef} onEnded={handleAudioEnded} preload="auto" />

      {/* Header */}
      <div className={`flex-shrink-0 p-4 flex justify-between items-center transition-opacity ${showControls ? '' : 'opacity-0 pointer-events-none'}`}>
        <button onClick={(e) => { e.stopPropagation(); handleClose(); }} className="bg-white/90 rounded-full p-3 shadow-lg">
          <X size={24} className="text-gray-700" />
        </button>
        <div className="bg-white/90 rounded-full px-4 py-2 shadow-lg">
          <span className="text-gray-700 font-semibold">{currentPage + 1} / {totalPages}</span>
        </div>
        <button onClick={(e) => { e.stopPropagation(); setShowSettings(true); }} className="bg-white/90 rounded-full p-3 shadow-lg">
          <Settings size={24} className="text-gray-700" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 pb-4 overflow-hidden">
        {currentPageData && (
          <div className="h-full flex flex-col">
            <div className="flex-1 relative rounded-2xl overflow-hidden shadow-xl mb-3 min-h-0">
              <img 
                src={currentPageData.image} 
                alt={`Sayfa ${currentPage + 1}`}
                className="w-full h-full object-cover"
                onLoad={handleImageLoad}
                onError={handleImageLoad}
              />
              {!isImageLoaded && (
                <div className="absolute inset-0 bg-amber-100 flex items-center justify-center">
                  <Loader2 size={48} className="animate-spin text-orange-500" />
                </div>
              )}
            </div>
            <div className="flex-shrink-0 bg-white rounded-2xl p-4 shadow-lg">
              <p className="text-gray-800 text-base leading-relaxed text-center">{currentPageData.text}</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className={`flex-shrink-0 p-4 pt-0 transition-opacity ${showControls ? '' : 'opacity-0 pointer-events-none'}`}>
        <div className="bg-white rounded-2xl shadow-xl p-3">
          <div className="flex items-center justify-center gap-6">
            <button onClick={(e) => { e.stopPropagation(); goPrev(); }} disabled={currentPage === 0} className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30">
              <ChevronLeft size={28} className="text-gray-700" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-full p-4 shadow-lg">
              {isPlaying ? <Pause size={28} fill="white" /> : <Play size={28} fill="white" />}
            </button>
            <button onClick={(e) => { e.stopPropagation(); goNext(); }} className="p-2 rounded-full hover:bg-gray-100">
              <ChevronRight size={28} className="text-gray-700" />
            </button>
          </div>
          <div className="mt-2 flex items-center justify-center gap-4 text-xs">
            {autoPlay && <span className="text-orange-500">● Otomatik</span>}
            {isPlaying && <span className="text-green-500">● Çalıyor</span>}
          </div>
        </div>
      </div>

      <ReaderSettings isOpen={showSettings} onClose={() => setShowSettings(false)} autoPlay={autoPlay} setAutoPlay={setAutoPlay} resumeContinue={resumeContinue} setResumeContinue={setResumeContinue} />
    </div>
  );
};

export default BookReaderLandscape;
