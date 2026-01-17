import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Share2,
  Sun,
  Moon
} from 'lucide-react';
import { bookPages } from '../../data/mockData';

const BookReader = ({ book, onClose }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const pages = bookPages;
  const totalPages = pages.length;

  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const togglePlay = () => setIsPlaying(!isPlaying);
  const toggleMute = () => setIsMuted(!isMuted);
  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  return (
    <div className={`fixed inset-0 z-50 ${isDarkMode ? 'bg-gray-900' : 'bg-amber-50'} transition-colors duration-300`}>
      {/* Header */}
      <header className={`absolute top-0 left-0 right-0 z-10 px-4 py-3 flex items-center justify-between transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <button 
          onClick={onClose}
          className={`${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} rounded-full p-2 shadow-lg`}
        >
          <ArrowLeft size={24} />
        </button>
        
        <div className={`${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} rounded-full px-4 py-2 shadow-lg font-semibold text-sm`}>
          {currentPage + 1} / {totalPages}
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={toggleDarkMode}
            className={`${isDarkMode ? 'bg-gray-800 text-yellow-400' : 'bg-white text-gray-800'} rounded-full p-2 shadow-lg`}
          >
            {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
          </button>
          <button 
            className={`${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} rounded-full p-2 shadow-lg`}
          >
            <Bookmark size={24} />
          </button>
        </div>
      </header>

      {/* Page Content */}
      <div 
        className="h-full flex flex-col pt-20 pb-32"
        onClick={() => setShowControls(!showControls)}
      >
        {/* Image */}
        <div className="flex-1 px-4">
          <div className="h-full max-h-[40vh] rounded-2xl overflow-hidden shadow-xl">
            <img 
              src={pages[currentPage]?.image} 
              alt={`Sayfa ${currentPage + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        
        {/* Text */}
        <div className={`px-6 py-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          <p className="text-xl leading-relaxed font-medium text-center">
            {pages[currentPage]?.text}
          </p>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button 
        onClick={prevPage}
        disabled={currentPage === 0}
        className={`absolute left-2 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-full p-3 shadow-lg transition-all duration-300 ${currentPage === 0 ? 'opacity-30' : 'opacity-100 hover:scale-110'}`}
      >
        <ChevronLeft size={28} className={isDarkMode ? 'text-white' : 'text-gray-800'} />
      </button>
      
      <button 
        onClick={nextPage}
        disabled={currentPage === totalPages - 1}
        className={`absolute right-2 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-full p-3 shadow-lg transition-all duration-300 ${currentPage === totalPages - 1 ? 'opacity-30' : 'opacity-100 hover:scale-110'}`}
      >
        <ChevronRight size={28} className={isDarkMode ? 'text-white' : 'text-gray-800'} />
      </button>

      {/* Audio Controls */}
      <div className={`absolute bottom-0 left-0 right-0 px-4 pb-8 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl p-4`}>
          {/* Progress Bar */}
          <div className="mb-4">
            <div className={`h-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full overflow-hidden`}>
              <div 
                className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-300"
                style={{ width: `${((currentPage + 1) / totalPages) * 100}%` }}
              />
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex items-center justify-between">
            <button 
              onClick={toggleMute}
              className={`p-2 rounded-full ${isDarkMode ? 'text-white hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'} transition-colors`}
            >
              {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
            </button>
            
            <button 
              onClick={togglePlay}
              className="bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              {isPlaying ? <Pause size={28} fill="white" /> : <Play size={28} fill="white" />}
            </button>
            
            <button 
              className={`p-2 rounded-full ${isDarkMode ? 'text-white hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'} transition-colors`}
            >
              <Share2 size={24} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookReader;
