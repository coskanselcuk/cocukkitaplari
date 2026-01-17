import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, ChevronRight, X, Settings, Play, Pause, Loader2
} from 'lucide-react';
import { booksApi } from '../../services/api';
import { bookPages as mockPages } from '../../data/mockData';
import ReaderSettings from './ReaderSettings';
import CompletionCelebration from './CompletionCelebration';

const BookReaderLandscape = ({ book, onClose }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [pages, setPages] = useState(mockPages);
  const [isLoadingPages, setIsLoadingPages] = useState(true);
  const [touchStart, setTouchStart] = useState(null);
  
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

  // Save settings
  useEffect(() => { localStorage.setItem('reading_autoPlay', JSON.stringify(autoPlay)); }, [autoPlay]);
  useEffect(() => { localStorage.setItem('reading_resumeContinue', JSON.stringify(resumeContinue)); }, [resumeContinue]);

  // Load/save progress
  useEffect(() => {
    if (resumeContinue && book) {
      const saved = localStorage.getItem(`book_progress_${book.id}`);
      if (saved) setCurrentPage(JSON.parse(saved).page);
    }
  }, [book, resumeContinue]);

  useEffect(() => {
    if (resumeContinue && book) {
      localStorage.setItem(`book_progress_${book.id}`, JSON.stringify({ page: currentPage }));
    }
  }, [book, currentPage, resumeContinue]);

  // Stop audio when page changes
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setIsPlaying(false);
    setIsImageLoaded(false);
  }, [currentPage]);

  // Auto-start audio when image loads
  useEffect(() => {
    if (!autoPlay || !isImageLoaded || !currentPageData?.audioUrl) return;
    
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.src = currentPageData.audioUrl;
    audio.play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));
  }, [autoPlay, isImageLoaded, currentPageData?.audioUrl]);

  // AUDIO ENDED HANDLER - called directly via onEnded prop
  const handleAudioEnded = () => {
    setIsPlaying(false);
    
    if (autoPlay) {
      if (currentPage < totalPages - 1) {
        setCurrentPage(prev => prev + 1);
      } else {
        setShowCelebration(true);
      }
    }
  };

  const goNext = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
    } else {
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

  const handleClose = () => {
    audioRef.current?.pause();
    if (book && currentPage >= totalPages - 1) localStorage.removeItem(`book_progress_${book.id}`);
    onClose();
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
                onLoad={() => setIsImageLoaded(true)}
                onError={() => setIsImageLoaded(true)}
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
