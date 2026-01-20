import React, { useState, useEffect, useRef, forwardRef } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { ArrowLeft, ArrowRight, Volume2, VolumeX, Play, Pause, RotateCcw, Home } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Page component - must use forwardRef for react-pageflip
const Page = forwardRef(({ pageNumber, imageUrl, text, isFirst, isLast, bookTitle }, ref) => {
  return (
    <div 
      ref={ref} 
      className="page bg-amber-50 shadow-lg overflow-hidden"
      style={{ 
        backgroundImage: 'linear-gradient(to right, #f5f0e6 0%, #faf8f3 50%, #f5f0e6 100%)'
      }}
    >
      {isFirst ? (
        // Cover page
        <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-orange-400 to-orange-600">
          <h1 className="text-3xl md:text-4xl font-bold text-white text-center drop-shadow-lg mb-4">
            {bookTitle}
          </h1>
          <p className="text-white/80 text-lg">Sayfayı çevirmek için sürükleyin →</p>
        </div>
      ) : isLast ? (
        // Back cover
        <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-orange-500 to-orange-700">
          <h2 className="text-2xl font-bold text-white mb-4">Son</h2>
          <p className="text-white/80">Teşekkürler!</p>
        </div>
      ) : (
        // Content pages
        <div className="w-full h-full flex flex-col">
          {/* Image area - takes most of the page */}
          <div className="flex-1 relative overflow-hidden">
            {imageUrl ? (
              <img 
                src={imageUrl} 
                alt={`Sayfa ${pageNumber}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400">Resim yok</span>
              </div>
            )}
          </div>
          
          {/* Text area at bottom */}
          <div className="p-4 bg-white/90 border-t border-amber-200">
            <p className="text-gray-800 text-base md:text-lg leading-relaxed">
              {text}
            </p>
          </div>
          
          {/* Page number */}
          <div className="absolute bottom-2 right-4 text-amber-600 text-sm font-medium">
            {pageNumber}
          </div>
        </div>
      )}
    </div>
  );
});

Page.displayName = 'Page';

const FlipbookDemo = () => {
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [pages, setPages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [bookSize, setBookSize] = useState({ width: 550, height: 700 });
  
  const flipBookRef = useRef(null);
  const audioRef = useRef(null);

  // Fetch books list
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/books`);
        setBooks(response.data.books || []);
        // Auto-select first book with pages
        if (response.data.books?.length > 0) {
          const firstBook = response.data.books[0];
          setSelectedBook(firstBook);
        }
      } catch (err) {
        console.error('Failed to fetch books:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBooks();
  }, []);

  // Fetch pages when book is selected
  useEffect(() => {
    if (!selectedBook) return;
    
    // Reset flipbook state first to avoid react-pageflip errors
    setPages([]);
    setTotalPages(0);
    setCurrentPage(0);
    
    const fetchPages = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/books/${selectedBook.id}/pages`);
        const bookPages = response.data.pages || [];
        // Small delay to allow flipbook to unmount before remounting with new data
        setTimeout(() => {
          setPages(bookPages);
          // Total pages = cover + content pages + back cover
          setTotalPages(bookPages.length + 2);
        }, 100);
      } catch (err) {
        console.error('Failed to fetch pages:', err);
      }
    };
    fetchPages();
  }, [selectedBook]);

  // Handle window resize for responsive book size
  useEffect(() => {
    const handleResize = () => {
      const maxWidth = Math.min(window.innerWidth * 0.45, 550);
      const maxHeight = Math.min(window.innerHeight * 0.8, 700);
      // Maintain aspect ratio (roughly 3:4)
      const aspectRatio = 3 / 4;
      let width = maxWidth;
      let height = width / aspectRatio;
      
      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
      }
      
      setBookSize({ width: Math.floor(width), height: Math.floor(height) });
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle page flip
  const onFlip = (e) => {
    const newPage = e.data;
    setCurrentPage(newPage);
    
    // Stop current audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    // Play audio for the new page (if not cover/back cover and not muted)
    if (!isMuted && newPage > 0 && newPage <= pages.length) {
      const pageData = pages[newPage - 1];
      if (pageData?.audioUrl) {
        const audio = new Audio(pageData.audioUrl);
        audioRef.current = audio;
        audio.play().catch(console.error);
        
        // Auto-flip to next page when audio ends (if playing)
        audio.onended = () => {
          if (isPlaying && flipBookRef.current) {
            flipBookRef.current.pageFlip().flipNext();
          }
        };
      }
    }
  };

  // Navigation controls
  const goToPrevPage = () => {
    if (flipBookRef.current) {
      flipBookRef.current.pageFlip().flipPrev();
    }
  };

  const goToNextPage = () => {
    if (flipBookRef.current) {
      flipBookRef.current.pageFlip().flipNext();
    }
  };

  const goToStart = () => {
    if (flipBookRef.current) {
      flipBookRef.current.pageFlip().flip(0);
    }
  };

  const toggleAutoPlay = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying && flipBookRef.current) {
      // Start auto-play from current page
      const pageData = pages[currentPage - 1];
      if (pageData?.audioUrl && !isMuted) {
        const audio = new Audio(pageData.audioUrl);
        audioRef.current = audio;
        audio.play().catch(console.error);
        audio.onended = () => {
          if (flipBookRef.current) {
            flipBookRef.current.pageFlip().flipNext();
          }
        };
      } else {
        // No audio, just flip after delay
        setTimeout(() => {
          if (flipBookRef.current) {
            flipBookRef.current.pageFlip().flipNext();
          }
        }, 3000);
      }
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-orange-700">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-100 via-orange-50 to-amber-100 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a 
              href="/" 
              className="flex items-center gap-2 text-orange-600 hover:text-orange-700"
            >
              <Home size={20} />
              <span className="hidden sm:inline">Ana Sayfa</span>
            </a>
            <div className="h-6 w-px bg-gray-300"></div>
            <h1 className="text-xl font-bold text-gray-800">
              📖 Flipbook Demo
            </h1>
          </div>
          
          {/* Book selector */}
          <select
            value={selectedBook?.id || ''}
            onChange={(e) => {
              const book = books.find(b => b.id === e.target.value);
              setSelectedBook(book);
            }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-gray-700 bg-white max-w-[200px]"
          >
            {books.map(book => (
              <option key={book.id} value={book.id}>
                {book.title}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Info banner */}
      <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
        <p className="text-center text-blue-700 text-sm">
          🧪 <strong>Demo Modu:</strong> Sayfa köşesini tutup sürükleyin veya ok tuşlarını kullanın. 
          3D sayfa çevirme efektini test edin!
        </p>
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
        {selectedBook && pages.length > 0 ? (
          <>
            {/* Flipbook */}
            <div className="relative" style={{ perspective: '2000px' }}>
              <HTMLFlipBook
                key={selectedBook.id}
                ref={flipBookRef}
                width={bookSize.width}
                height={bookSize.height}
                size="stretch"
                minWidth={300}
                maxWidth={600}
                minHeight={400}
                maxHeight={800}
                showCover={true}
                mobileScrollSupport={false}
                onFlip={onFlip}
                className="shadow-2xl"
                style={{}}
                startPage={0}
                drawShadow={true}
                flippingTime={800}
                usePortrait={false}
                startZIndex={0}
                autoSize={true}
                maxShadowOpacity={0.5}
                showPageCorners={true}
                disableFlipByClick={false}
              >
                {/* Cover page */}
                <Page 
                  isFirst={true} 
                  bookTitle={selectedBook.title}
                />
                
                {/* Content pages */}
                {pages.map((page, idx) => (
                  <Page
                    key={page.id}
                    pageNumber={idx + 1}
                    imageUrl={page.image || page.imageUrl}
                    text={page.text}
                  />
                ))}
                
                {/* Back cover */}
                <Page isLast={true} />
              </HTMLFlipBook>
            </div>

            {/* Controls */}
            <div className="mt-6 flex items-center gap-4">
              <button
                onClick={goToStart}
                className="p-3 bg-white rounded-full shadow-md hover:bg-gray-50 text-gray-600"
                title="Başa dön"
              >
                <RotateCcw size={20} />
              </button>
              
              <button
                onClick={goToPrevPage}
                disabled={currentPage === 0}
                className="p-3 bg-white rounded-full shadow-md hover:bg-gray-50 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Önceki sayfa"
              >
                <ArrowLeft size={20} />
              </button>
              
              <div className="px-4 py-2 bg-white rounded-full shadow-md text-gray-700 font-medium">
                {currentPage + 1} / {totalPages}
              </div>
              
              <button
                onClick={goToNextPage}
                disabled={currentPage >= totalPages - 1}
                className="p-3 bg-white rounded-full shadow-md hover:bg-gray-50 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Sonraki sayfa"
              >
                <ArrowRight size={20} />
              </button>
              
              <div className="w-px h-8 bg-gray-300"></div>
              
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-3 rounded-full shadow-md ${isMuted ? 'bg-gray-200 text-gray-500' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                title={isMuted ? 'Sesi aç' : 'Sesi kapat'}
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              
              <button
                onClick={toggleAutoPlay}
                className={`p-3 rounded-full shadow-md ${isPlaying ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                title={isPlaying ? 'Otomatik oynatmayı durdur' : 'Otomatik oynat'}
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>
            </div>

            {/* Instructions */}
            <div className="mt-6 text-center text-gray-600 text-sm max-w-md">
              <p className="mb-2">
                <strong>Nasıl kullanılır:</strong>
              </p>
              <ul className="text-left list-disc list-inside space-y-1">
                <li>Sayfa köşesini tutup sürükleyerek çevirin</li>
                <li>Ok tuşlarıyla ileri/geri gidin</li>
                <li>Otomatik oynatma sesi dinleyip sayfa çevirir</li>
              </ul>
            </div>
          </>
        ) : (
          <div className="text-center text-gray-600">
            <p>Kitap seçin veya kitapta sayfa bulunamadı.</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-sm p-4 text-center text-gray-500 text-sm">
        <p>
          Bu bir demo sayfasıdır. 
          <a href="https://github.com/nicksypark/react-pageflip" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline ml-1">
            react-pageflip
          </a> kütüphanesi kullanılmaktadır.
        </p>
      </footer>
    </div>
  );
};

export default FlipbookDemo;
