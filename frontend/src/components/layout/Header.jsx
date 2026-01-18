import React, { useState, useEffect, useCallback } from 'react';
import { Search, Bell } from 'lucide-react';
import NotificationPanel from '../notifications/NotificationPanel';
import { notificationsApi } from '../../services/api';

const Header = ({ onSearchClick, onMenuClick, showBack, onBack, title }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread count on mount and periodically
  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await notificationsApi.getUnreadCount();
      setUnreadCount(data.unread_count || 0);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    
    // Refresh every 60 seconds
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const handleNotificationClick = () => {
    setShowNotifications(true);
  };

  const handleUnreadCountChange = (count) => {
    setUnreadCount(count);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 safe-area-top">
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
                data-testid="search-button"
              >
                <Search size={20} />
              </button>
              <button 
                onClick={handleNotificationClick}
                className="bg-white/20 backdrop-blur-sm rounded-full p-2.5 text-white hover:bg-white/30 transition-all duration-300 relative"
                data-testid="notification-button"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Notification Panel */}
      <NotificationPanel
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        onUnreadCountChange={handleUnreadCountChange}
      />
    </>
  );
};

export default Header;
