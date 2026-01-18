import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bell, X, Check, CheckCheck, Book, FolderOpen, Crown, 
  Star, Megaphone, Gift, Clock, Loader2 
} from 'lucide-react';
import { notificationsApi } from '../../services/api';

// Icon mapping
const NOTIFICATION_ICONS = {
  book: Book,
  new_book: Book,
  folder: FolderOpen,
  new_category: FolderOpen,
  crown: Crown,
  subscription: Crown,
  star: Star,
  achievement: Star,
  megaphone: Megaphone,
  announcement: Megaphone,
  gift: Gift,
  trial: Gift,
  bell: Bell,
  reminder: Clock
};

// Color mapping for notification types
const NOTIFICATION_COLORS = {
  new_book: 'bg-blue-100 text-blue-600',
  new_category: 'bg-purple-100 text-purple-600',
  subscription: 'bg-yellow-100 text-yellow-600',
  achievement: 'bg-green-100 text-green-600',
  announcement: 'bg-orange-100 text-orange-600',
  trial: 'bg-pink-100 text-pink-600',
  reminder: 'bg-gray-100 text-gray-600'
};

const NotificationPanel = ({ isOpen, onClose, onUnreadCountChange }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await notificationsApi.getAll(20, false);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
      onUnreadCountChange?.(data.unread_count || 0);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [onUnreadCountChange]);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationsApi.markAsRead([notificationId]);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      onUnreadCountChange?.(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setIsMarkingAll(true);
      await notificationsApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      onUnreadCountChange?.(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    } finally {
      setIsMarkingAll(false);
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Az önce';
    if (diffMins < 60) return `${diffMins} dk önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    if (diffDays < 7) return `${diffDays} gün önce`;
    return date.toLocaleDateString('tr-TR');
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/30"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute right-4 top-16 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Bell size={20} />
            <h3 className="font-bold text-lg">Bildirimler</h3>
            {unreadCount > 0 && (
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm">
                {unreadCount} yeni
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Mark all as read button */}
        {unreadCount > 0 && (
          <div className="px-4 py-2 border-b bg-gray-50">
            <button
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAll}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 disabled:opacity-50"
            >
              {isMarkingAll ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <CheckCheck size={14} />
              )}
              Tümünü okundu işaretle
            </button>
          </div>
        )}

        {/* Notification list */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin text-gray-400" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Bell size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">Henüz bildirim yok</p>
              <p className="text-gray-400 text-sm mt-1">
                Yeni kitaplar ve duyurular burada görünecek
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const IconComponent = NOTIFICATION_ICONS[notification.type] || 
                                     NOTIFICATION_ICONS[notification.icon] || 
                                     Bell;
                const colorClass = NOTIFICATION_COLORS[notification.type] || 'bg-gray-100 text-gray-600';

                return (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                      !notification.read ? 'bg-blue-50/50' : ''
                    }`}
                    onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                  >
                    <div className="flex gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                        <IconComponent size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={`font-semibold text-gray-800 ${!notification.read ? 'text-blue-900' : ''}`}>
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2"></span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTimeAgo(notification.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationPanel;
