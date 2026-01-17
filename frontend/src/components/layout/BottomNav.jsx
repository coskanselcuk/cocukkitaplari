import React from 'react';
import { Home, BookOpen, User } from 'lucide-react';

const BottomNav = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'home', icon: Home, label: 'Ana Sayfa' },
    { id: 'library', icon: BookOpen, label: 'Kitaplık' },
    { id: 'profile', icon: User, label: 'Profil' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
      <div className="bg-white rounded-t-3xl shadow-2xl px-2 py-2">
        <div className="flex justify-around items-center max-w-md mx-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col items-center py-2 px-4 rounded-2xl transition-all duration-300 ${
                  isActive 
                    ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-lg shadow-orange-200' 
                    : 'text-gray-500 hover:text-orange-500'
                }`}
              >
                <Icon 
                  size={24} 
                  className={`transition-transform duration-300 ${isActive ? 'scale-110' : ''}`}
                />
                <span className={`text-xs mt-1 font-semibold ${isActive ? 'text-white' : ''}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
