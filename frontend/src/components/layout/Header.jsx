import React from 'react';
import { Search, Bell, Menu } from 'lucide-react';

const Header = ({ onSearchClick, onMenuClick, showBack, onBack, title }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 safe-area-top">
      <div className="bg-transparent px-4 py-3">
        <div className="flex items-center justify-between max-w-md mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="bg-white rounded-2xl p-2 shadow-lg">
              <div className="flex items-center">
                <span className="text-cyan-500 font-black text-lg">Çocuk</span>
                <span className="text-orange-500 font-black text-lg ml-1">Kitapları</span>
              </div>
            </div>
          </div>
          
          {/* Title (optional) */}
          {title && (
            <h1 className="text-white font-bold text-lg">{title}</h1>
          )}
          
          {/* Actions */}
          <div className="flex items-center gap-2">
            <button 
              onClick={onSearchClick}
              className="bg-white/20 backdrop-blur-sm rounded-full p-2.5 text-white hover:bg-white/30 transition-all duration-300"
            >
              <Search size={20} />
            </button>
            <button 
              className="bg-white/20 backdrop-blur-sm rounded-full p-2.5 text-white hover:bg-white/30 transition-all duration-300 relative"
            >
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                3
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
