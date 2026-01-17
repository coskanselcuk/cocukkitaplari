import React, { useState, useEffect } from 'react';
import Header from './components/layout/Header';
import BottomNav from './components/layout/BottomNav';
import IslandMap from './components/home/IslandMap';
import BookCarousel from './components/books/BookCarousel';
import BookReader from './components/books/BookReader';
import BookLibrary from './components/books/BookLibrary';
import GamesPage from './components/games/GamesPage';
import { ProfileSelector, ProfilePage } from './components/profile/ProfileComponents';
import ParentDashboard from './components/profile/ParentDashboard';
import SearchModal from './components/search/SearchModal';
import CreateProfileModal from './components/profile/CreateProfileModal';
import { books, categories, profiles } from './data/mockData';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [currentProfile, setCurrentProfile] = useState(profiles[0]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showReader, setShowReader] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showParentDashboard, setShowParentDashboard] = useState(false);
  const [showCreateProfile, setShowCreateProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate splash screen
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const newBooks = books.filter(book => book.isNew);
  const popularBooks = books.sort((a, b) => b.readCount - a.readCount).slice(0, 6);
  const recommendedBooks = books.filter(book => 
    book.ageGroup.includes(currentProfile?.age?.toString())
  ).slice(0, 6);

  const handleBookSelect = (book) => {
    setSelectedBook(book);
    setShowReader(true);
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setShowLibrary(true);
  };

  // Splash Screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cyan-400 via-cyan-500 to-cyan-600 flex flex-col items-center justify-center">
        <div className="animate-bounce-slow">
          <div className="bg-white rounded-3xl p-6 shadow-2xl mb-6">
            <div className="text-center">
              <h1 className="text-4xl font-black">
                <span className="text-cyan-500">TRT</span>
                <span className="text-orange-500 ml-1">Çocuk</span>
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

  // Book Reader View
  if (showReader && selectedBook) {
    return (
      <BookReader 
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

  // Library View
  if (showLibrary) {
    return (
      <BookLibrary 
        category={selectedCategory}
        onBack={() => {
          setShowLibrary(false);
          setSelectedCategory(null);
        }}
        onBookSelect={handleBookSelect}
      />
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
            <div className="mt-4">
              {/* Personalized */}
              <BookCarousel 
                title={`${currentProfile?.name || 'Sana'} İçin Öneriler`}
                books={recommendedBooks.length > 0 ? recommendedBooks : books.slice(0, 6)}
                onBookSelect={handleBookSelect}
                onSeeAll={() => {
                  setSelectedCategory(null);
                  setShowLibrary(true);
                }}
              />
              
              {/* New Books */}
              <BookCarousel 
                title="Yeni Eklenenler"
                books={newBooks}
                onBookSelect={handleBookSelect}
                onSeeAll={() => {
                  setSelectedCategory(null);
                  setShowLibrary(true);
                }}
              />
              
              {/* Popular */}
              <BookCarousel 
                title="En Çok Okunanlar"
                books={popularBooks}
                onBookSelect={handleBookSelect}
                onSeeAll={() => {
                  setSelectedCategory(null);
                  setShowLibrary(true);
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
        
        {activeTab === 'games' && (
          <GamesPage />
        )}
        
        {activeTab === 'profile' && (
          <ProfilePage 
            profile={currentProfile}
            onBack={() => setActiveTab('home')}
            onParentDashboard={() => setShowParentDashboard(true)}
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
      
      {/* Create Profile Modal */}
      <CreateProfileModal
        isOpen={showCreateProfile}
        onClose={() => setShowCreateProfile(false)}
        onSave={(profile) => {
          console.log('New profile:', profile);
          setShowCreateProfile(false);
        }}
      />
    </div>
  );
}

export default App;
