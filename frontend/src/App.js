import React, { useState, useEffect } from 'react';
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
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { books, categories, profiles } from './data/mockData';
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

  // Simulate splash screen
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  const newBooks = books.filter(book => book.isNew);
  const popularBooks = [...books].sort((a, b) => b.readCount - a.readCount).slice(0, 6);
  const recommendedBooks = books.filter(book => 
    book.ageGroup.includes(currentProfile?.age?.toString())
  ).slice(0, 6);

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
    setShowBookInfo(false);
    setIsLoadingBook(true);
    
    // Simulate loading
    setTimeout(() => {
      setIsLoadingBook(false);
      setShowReader(true);
    }, 2000);
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
    return (
      <AdminPanel onBack={() => setShowAdmin(false)} />
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
                title={`${currentProfile?.name || 'Sana'} İçin Öneriler`}
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
      {showPremiumModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center">
            <div className="text-5xl mb-4">👑</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Premium İçerik</h2>
            <p className="text-gray-600 mb-6">
              Bu hikayeye erişmek için Premium üyelik gerekiyor. 
              Tüm hikayelere sınırsız erişim için abone olun!
            </p>
            
            {!isAuthenticated ? (
              <>
                <button
                  onClick={() => { setShowPremiumModal(false); login(); }}
                  className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold mb-3 hover:bg-orange-600"
                >
                  Giriş Yap
                </button>
                <p className="text-sm text-gray-500 mb-3">Giriş yaptıktan sonra abone olabilirsiniz</p>
              </>
            ) : (
              <button
                onClick={() => { setShowPremiumModal(false); /* TODO: Open subscription flow */ }}
                className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white py-3 rounded-xl font-semibold mb-3 hover:opacity-90"
              >
                Premium&apos;a Abone Ol
              </button>
            )}
            
            <button
              onClick={() => setShowPremiumModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              Daha sonra
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Wrap with AuthProvider
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
