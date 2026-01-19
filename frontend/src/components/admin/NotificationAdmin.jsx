import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Send, Bell, Book, FolderOpen, Crown, 
  Star, Megaphone, Gift, Loader2, Users, UserCheck, X
} from 'lucide-react';
import { notificationsApi } from '../../services/api';

const NOTIFICATION_TYPES = [
  { value: 'announcement', label: 'Duyuru', icon: Megaphone },
  { value: 'new_book', label: 'Yeni Kitap', icon: Book },
  { value: 'new_category', label: 'Yeni Kategori', icon: FolderOpen },
  { value: 'subscription', label: 'Abonelik', icon: Crown },
  { value: 'achievement', label: 'Başarı', icon: Star },
  { value: 'trial', label: 'Deneme', icon: Gift },
  { value: 'reminder', label: 'Hatırlatma', icon: Bell }
];

const TARGET_AUDIENCES = [
  { value: 'all', label: 'Tüm Kullanıcılar', icon: Users },
  { value: 'free', label: 'Ücretsiz Kullanıcılar', icon: Users },
  { value: 'premium', label: 'Premium Kullanıcılar', icon: UserCheck }
];

const NotificationAdmin = () => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // New notification form
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'announcement',
    target_audience: 'all',
    link: ''
  });

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const data = await notificationsApi.listAll(50);
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError('Bildirimler yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    
    if (!newNotification.title || !newNotification.message) {
      setError('Başlık ve mesaj zorunludur');
      return;
    }

    try {
      setIsSending(true);
      setError(null);
      
      await notificationsApi.create(newNotification);
      
      setSuccess('Bildirim başarıyla gönderildi!');
      setShowCreateModal(false);
      setNewNotification({
        title: '',
        message: '',
        type: 'announcement',
        target_audience: 'all',
        link: ''
      });
      
      // Refresh list
      await fetchNotifications();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to create notification:', err);
      setError('Bildirim gönderilemedi');
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = async (notificationId) => {
    if (!window.confirm('Bu bildirimi silmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      await notificationsApi.delete(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setSuccess('Bildirim silindi');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to delete notification:', err);
      setError('Bildirim silinemedi');
    }
  };

  const getTypeIcon = (type) => {
    const typeConfig = NOTIFICATION_TYPES.find(t => t.value === type);
    return typeConfig?.icon || Bell;
  };

  const getTargetLabel = (target) => {
    const targetConfig = TARGET_AUDIENCES.find(t => t.value === target);
    return targetConfig?.label || target;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Bell size={24} />
          Bildirim Yönetimi
        </h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <Plus size={18} />
          Yeni Bildirim
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Notifications List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin text-gray-400" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Bell size={48} className="mx-auto mb-3 text-gray-300" />
            <p>Henüz bildirim yok</p>
            <p className="text-sm mt-1">Yeni bildirim oluşturmak için "Yeni Bildirim" butonuna tıklayın</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => {
              const IconComponent = getTypeIcon(notification.type);
              
              return (
                <div key={notification.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <IconComponent size={20} className="text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-gray-800">{notification.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                            <span className="bg-gray-100 px-2 py-0.5 rounded">
                              {getTargetLabel(notification.target_audience)}
                            </span>
                            <span>{formatDate(notification.created_at)}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelete(notification.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Sil"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setShowCreateModal(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white">
              <h3 className="font-bold text-lg text-gray-800">Yeni Bildirim Oluştur</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-4 space-y-4">
              {/* Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bildirim Türü
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {NOTIFICATION_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setNewNotification(prev => ({ ...prev, type: type.value }))}
                        className={`p-2 rounded-lg border text-center transition-all ${
                          newNotification.type === type.value
                            ? 'border-orange-500 bg-orange-50 text-orange-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                        }`}
                      >
                        <Icon size={20} className={`mx-auto mb-1 ${newNotification.type === type.value ? 'text-orange-600' : 'text-gray-500'}`} />
                        <span className="text-xs font-medium">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target Audience */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hedef Kitle
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {TARGET_AUDIENCES.map((target) => {
                    const Icon = target.icon;
                    return (
                      <button
                        key={target.value}
                        type="button"
                        onClick={() => setNewNotification(prev => ({ ...prev, target_audience: target.value }))}
                        className={`p-3 rounded-lg border text-center transition-all ${
                          newNotification.target_audience === target.value
                            ? 'border-orange-500 bg-orange-50 text-orange-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                        }`}
                      >
                        <Icon size={20} className={`mx-auto mb-1 ${newNotification.target_audience === target.value ? 'text-orange-600' : 'text-gray-500'}`} />
                        <span className="text-sm font-medium">{target.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Başlık *
                </label>
                <input
                  type="text"
                  value={newNotification.title}
                  onChange={(e) => setNewNotification(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Bildirim başlığı"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mesaj *
                </label>
                <textarea
                  value={newNotification.message}
                  onChange={(e) => setNewNotification(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Bildirim mesajı"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                />
              </div>

              {/* Link (optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bağlantı (opsiyonel)
                </label>
                <input
                  type="text"
                  value={newNotification.link}
                  onChange={(e) => setNewNotification(prev => ({ ...prev, link: e.target.value }))}
                  placeholder="Kitap ID veya kategori slug"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSending ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Gönderiliyor...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Gönder
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationAdmin;
