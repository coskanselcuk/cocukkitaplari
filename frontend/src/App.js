import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/layout/Header';
import BottomNav from './components/layout/BottomNav';
import IslandMap from './components/home/IslandMap';
import BookCarousel from './components/books/BookCarousel';
import BookReaderLandscape from './components/books/BookReaderLandscape';
import BookLibrary from './components/books/BookLibrary';
import BookInfoModal from './components/books/BookInfoModal';
import LoadingScreen from './components/common/LoadingScreen';
import { ProfileSelector, ProfilePage } from './components/profile/ProfileComponents';
import ParentDashboard from './components/profile/ParentDashboard';
import AdminPanel from './components/admin/AdminPanel';
import SearchModal from './components/search/SearchModal';
import CreateProfileModal from './components/profile/CreateProfileModal';
import SubscriptionModal from './components/subscription/SubscriptionModal';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { booksApi } from './services/api';
import { initializeStore, isNativeApp } from './services/iapService';
import { profiles } from './data/mockData';
import './App.css';

// Main App Content (wrapped by AuthProvider)
function AppContent() {
  const { user, isAuthenticated, isLoading: authLoading, login, logout, canAccessBook, isPremiumUser } = useAuth();
  
  const [activeTab, setActiveTab] = useState('home');
  const [currentProfile, setCurrentProfile] = useState(profiles[0]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showReader, setShowReader] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showParentDashboard, setShowParentDashboard] = useState(false);
  const [showCreateProfile, setShowCreateProfile] = useState(false);
  const [showBookInfo, setShowBookInfo] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingBook, setIsLoadingBook] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [books, setBooks] = useState([]);

  // Fetch books from API
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await booksApi.getAll();
        if (response.books) {
          setBooks(response.books);
        }
      } catch (error) {
        console.error('Error fetching books:', error);
      }
    };
    fetchBooks();
  }, []);

  // Initialize in-app purchases for native apps
  useEffect(() => {
    if (isNativeApp()) {
      initializeStore((result) => {
        if (result.success) {
          console.log('Purchase successful, refreshing user data');
          // Could refresh user subscription status here
        }
      });
    }
  }, []);

  // Simulate splash screen
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  // Get display name - prefer authenticated user's name, fallback to "Sizin"
  const displayName = useMemo(() => {
    if (isAuthenticated && user?.name) {
      // Get first name only
      return user.name.split(' ')[0];
    }
    return null; // Will use "Sizin için Öneriler" when not logged in
  }, [isAuthenticated, user?.name]);

  // Memoized book lists derived from API data
  const newBooks = useMemo(() => books.filter(book => book.isNew), [books]);
  const popularBooks = useMemo(() => [...books].sort((a, b) => (b.readCount || 0) - (a.readCount || 0)).slice(0, 6), [books]);
  const recommendedBooks = useMemo(() => books.filter(book => 
    book.ageGroup?.includes(currentProfile?.age?.toString())
  ).slice(0, 6), [books, currentProfile]);

  const handleBookSelect = (book) => {
    setSelectedBook(book);
    setShowBookInfo(true);
  };

  const handleStartReading = (book) => {
    // Check if user can access this book
    if (book.isPremium && !canAccessBook(book)) {
      setShowPremiumModal(true);
      return;
    }
    setShowBookInfo(false);
    setIsLoadingBook(true);
    setTimeout(() => {
      setShowReader(true);
      setIsLoadingBook(false);
    }, 500);
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setIsLoadingBook(true);
    
    setTimeout(() => {
      setIsLoadingBook(false);
      setShowLibrary(true);
    }, 1000);
  };

  // Splash Screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cyan-400 via-cyan-500 to-cyan-600 flex flex-col items-center justify-center">
        <div className="animate-bounce-slow">
          <div className="bg-white rounded-3xl p-6 shadow-2xl mb-6">
            <div className="text-center">
              <h1 className="text-4xl font-black">
                <span className="text-cyan-500">Çocuk</span>
                <span className="text-orange-500 ml-1">Kitapları</span>
              </h1>
              <p className="text-orange-500 font-bold text-2xl mt-2">Kitaplık</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    );
  }

  // Book Loading Screen
  if (isLoadingBook) {
    return <LoadingScreen type="bookshelf" message="Kitap yükleniyor..." />;
  }

  // Book Reader View
  if (showReader && selectedBook) {
    return (
      <BookReaderLandscape 
        book={selectedBook} 
        onClose={() => {
          setShowReader(false);
          setSelectedBook(null);
        }} 
      />
    );
  }

  // Parent Dashboard View
  if (showParentDashboard) {
    return (
      <ParentDashboard onBack={() => setShowParentDashboard(false)} />
    );
  }

  // Admin Panel View
  if (showAdmin) {
    const handleAdminClose = async () => {
      // Refetch books when admin panel closes
      try {
        const response = await booksApi.getAll();
        if (response.books) {
          setBooks(response.books);
        }
      } catch (error) {
        console.error('Error fetching books:', error);
      }
      setShowAdmin(false);
    };
    
    return (
      <AdminPanel onBack={handleAdminClose} />
    );
  }

  // Library View
  if (showLibrary) {
    return (
      <>
        <BookLibrary 
          category={selectedCategory}
          onBack={() => {
            setShowLibrary(false);
            setSelectedCategory(null);
          }}
          onBookSelect={handleBookSelect}
        />
        
        {/* Book Info Modal */}
        <BookInfoModal
          book={selectedBook}
          isOpen={showBookInfo}
          onClose={() => {
            setShowBookInfo(false);
            setSelectedBook(null);
          }}
          onStart={handleStartReading}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-400 via-cyan-500 to-cyan-600">
      {/* Header */}
      <Header 
        onSearchClick={() => setShowSearch(true)}
      />
      
      {/* Main Content */}
      <main className="pt-20 pb-24">
        {activeTab === 'home' && (
          <>
            {/* Island Map */}
            <IslandMap onCategorySelect={handleCategorySelect} />
            
            {/* Book Carousels */}
            <div className="mt-2">
              {/* Personalized */}
              <BookCarousel 
                title={displayName ? `${displayName} İçin Öneriler` : 'Sizin İçin Öneriler'}
                books={recommendedBooks.length > 0 ? recommendedBooks : books.slice(0, 6)}
                onBookSelect={handleBookSelect}
                onSeeAll={() => {
                  setSelectedCategory(null);
                  setIsLoadingBook(true);
                  setTimeout(() => {
                    setIsLoadingBook(false);
                    setShowLibrary(true);
                  }, 1000);
                }}
              />
              
              {/* New Books */}
              <BookCarousel 
                title="Yeni Eklenenler"
                books={newBooks}
                onBookSelect={handleBookSelect}
                onSeeAll={() => {
                  setSelectedCategory(null);
                  setIsLoadingBook(true);
                  setTimeout(() => {
                    setIsLoadingBook(false);
                    setShowLibrary(true);
                  }, 1000);
                }}
              />
              
              {/* Popular */}
              <BookCarousel 
                title="En Çok Okunanlar"
                books={popularBooks}
                onBookSelect={handleBookSelect}
                onSeeAll={() => {
                  setSelectedCategory(null);
                  setIsLoadingBook(true);
                  setTimeout(() => {
                    setIsLoadingBook(false);
                    setShowLibrary(true);
                  }, 1000);
                }}
              />
            </div>
          </>
        )}
        
        {activeTab === 'library' && (
          <BookLibrary 
            category={null}
            onBack={() => setActiveTab('home')}
            onBookSelect={handleBookSelect}
          />
        )}
        
        {activeTab === 'profile' && (
          <ProfilePage 
            profile={currentProfile}
            onBack={() => setActiveTab('home')}
            onParentDashboard={() => setShowParentDashboard(true)}
            onAdminPanel={() => setShowAdmin(true)}
          />
        )}
      </main>
      
      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      
      {/* Search Modal */}
      <SearchModal 
        isOpen={showSearch} 
        onClose={() => setShowSearch(false)}
        onBookSelect={handleBookSelect}
      />
      
      {/* Book Info Modal */}
      <BookInfoModal
        book={selectedBook}
        isOpen={showBookInfo}
        onClose={() => {
          setShowBookInfo(false);
          setSelectedBook(null);
        }}
        onStart={handleStartReading}
        isPremium={selectedBook?.isPremium}
        canAccess={selectedBook ? canAccessBook(selectedBook) : true}
      />
      
      {/* Create Profile Modal */}
      <CreateProfileModal
        isOpen={showCreateProfile}
        onClose={() => setShowCreateProfile(false)}
        onSave={(profile) => {
          console.log('New profile:', profile);
          setShowCreateProfile(false);
        }}
      />

      {/* Premium Subscription Modal */}
      <SubscriptionModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        onSubscriptionComplete={() => {
          // Refresh user data after subscription
          window.location.reload();
        }}
      />
    </div>
  );
}

// Wrap with AuthProvider
function App() {
  // Check if we're on the flipbook demo route (no auth needed)
  const isFlipbookDemo = window.location.pathname === '/demo/flipbook';
  
  if (isFlipbookDemo) {
    return <FlipbookDemo />;
  }

  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
