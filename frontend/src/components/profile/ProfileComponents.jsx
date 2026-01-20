import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Check, Star, BookOpen, Clock, Award, User, Settings, LogIn, LogOut, Crown } from 'lucide-react';
import { profiles } from '../../data/mockData';
import { useAuth } from '../../contexts/AuthContext';
import SubscriptionModal from '../subscription/SubscriptionModal';

// Apple Logo SVG component
const AppleLogo = ({ size = 20, className = "" }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor">
    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
  </svg>
);

// Google Logo SVG component
const GoogleLogo = ({ size = 20, className = "" }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={className}>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const ProfileSelector = ({ onProfileSelect, onCreateProfile }) => {
  const [isEditing, setIsEditing] = useState(false);

  const avatarColors = ['bg-pink-400', 'bg-blue-400', 'bg-green-400', 'bg-purple-400', 'bg-orange-400', 'bg-teal-400'];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <h1 className="text-white text-3xl font-bold mb-2 text-center">Merhaba!</h1>
      <p className="text-white/80 text-center mb-8">Profilini seç ve okumaya başla</p>
      
      <div className="flex flex-wrap justify-center gap-6 mb-8">
        {profiles.map((profile, index) => (
          <button
            key={profile.id}
            onClick={() => onProfileSelect(profile)}
            className="group flex flex-col items-center"
          >
            <div className="relative">
              <div className={`w-24 h-24 ${avatarColors[index % avatarColors.length]} rounded-full flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110`}>
                <span className="text-white text-4xl font-bold">{profile.name.charAt(0).toUpperCase()}</span>
              </div>
              {isEditing && (
                <button className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            <span className="text-white font-bold mt-3 text-lg">{profile.name}</span>
            <span className="text-white/60 text-sm">{profile.age} yaş</span>
          </button>
        ))}
        
        {/* Add Profile Button */}
        <button
          onClick={onCreateProfile}
          className="flex flex-col items-center group"
        >
          <div className="w-24 h-24 bg-white/20 border-2 border-dashed border-white/50 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-all duration-300">
            <Plus size={32} className="text-white" />
          </div>
          <span className="text-white/80 font-semibold mt-3">Profil Ekle</span>
        </button>
      </div>
      
      <button 
        onClick={() => setIsEditing(!isEditing)}
        className="text-white/60 hover:text-white transition-colors flex items-center gap-2"
      >
        <Edit2 size={16} />
        {isEditing ? 'Tamamla' : 'Profilleri Düzenle'}
      </button>
    </div>
  );
};

const ProfilePage = ({ profile, onBack, onParentDashboard, onAdminPanel }) => {
  const { 
    user, 
    isAuthenticated, 
    isPremiumUser, 
    isAdmin, 
    isIOS,
    isDevMode,
    isLoading,
    authError,
    loginWithGoogle, 
    loginWithApple,
    logout,
    devBypassLogin
  } = useAuth();
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const avatarColors = ['bg-pink-400', 'bg-blue-400', 'bg-green-400', 'bg-purple-400', 'bg-orange-400'];
  
  // Get display name - use authenticated user or show "Misafir" (Guest)
  const displayName = isAuthenticated && user?.name ? user.name : 'Misafir';
  const displayInitial = isAuthenticated && user?.name ? user.name.charAt(0).toUpperCase() : 'M';
  
  return (
    <div className="min-h-screen pb-24">
      {/* Profile Header */}
      <div className="bg-gradient-to-b from-orange-400 to-orange-500 px-4 py-8 text-center">
        <div className="w-28 h-28 bg-white rounded-full mx-auto flex items-center justify-center shadow-xl mb-4 overflow-hidden">
          {isAuthenticated && user?.picture ? (
            <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-orange-500 text-5xl font-bold">{displayInitial}</span>
          )}
        </div>
        <h1 className="text-white text-2xl font-bold">
          {displayName}
        </h1>
        <p className="text-white/80">
          {isAuthenticated ? user?.email : 'Giriş yaparak ilerlemenizi kaydedin'}
        </p>
        {isAuthenticated && isPremiumUser && (
          <div className="inline-flex items-center gap-1 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-semibold mt-2">
            <Crown size={14} /> Premium Üye
          </div>
        )}
      </div>

      {/* Auth Section */}
      <div className="px-4 -mt-6 mb-4">
        <div className="bg-white rounded-2xl shadow-xl p-4">
          {isLoading ? (
            <div className="text-center py-2 text-gray-500">Yükleniyor...</div>
          ) : isAuthenticated ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="text-green-600" size={20} />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Giriş Yapıldı</p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-2 text-red-500 hover:text-red-600 font-medium"
              >
                <LogOut size={18} /> Çıkış
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* DEV MODE: Quick admin login for testing */}
              {isDevMode && (
                <button
                  onClick={devBypassLogin}
                  className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors"
                  data-testid="dev-login-btn"
                >
                  <Settings size={20} />
                  🔧 Dev Admin Login (Test Only)
                </button>
              )}
              
              {/* Apple Sign-In - Primary on iOS */}
              {isIOS && (
                <button
                  onClick={loginWithApple}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors"
                  data-testid="apple-signin-btn"
                >
                  <AppleLogo size={20} />
                  Apple ile Giriş Yap
                </button>
              )}
              
              {/* Google Sign-In Button */}
              <button
                id="google-signin-btn"
                onClick={loginWithGoogle}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 disabled:opacity-50 transition-colors"
                data-testid="google-signin-btn"
              >
                <GoogleLogo size={20} />
                Google ile Giriş Yap
              </button>
              
              {/* Auth Error Message */}
              {authError && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2 rounded-lg">
                  {authError}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Stats */}
      <div className="px-4">
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-gray-800 font-bold text-lg mb-4">Başarılarım</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-14 h-14 bg-cyan-100 rounded-full mx-auto flex items-center justify-center mb-2">
                <BookOpen className="text-cyan-600" size={24} />
              </div>
              <p className="text-2xl font-bold text-gray-800">{profile.booksRead}</p>
              <p className="text-gray-500 text-sm">Okunan Kitap</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-orange-100 rounded-full mx-auto flex items-center justify-center mb-2">
                <Clock className="text-orange-600" size={24} />
              </div>
              <p className="text-2xl font-bold text-gray-800">{profile.totalReadingTime}</p>
              <p className="text-gray-500 text-sm">Okuma Süresi</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-yellow-100 rounded-full mx-auto flex items-center justify-center mb-2">
                <Star className="text-yellow-500" size={24} />
              </div>
              <p className="text-2xl font-bold text-gray-800">12</p>
              <p className="text-gray-500 text-sm">Rozet</p>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Management */}
      {isAuthenticated && (
        <div className="px-4 mt-4">
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl shadow-xl p-6 border border-yellow-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                <Crown className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-gray-800 font-bold text-lg">Üyelik Durumu</h2>
                <p className={`text-sm font-semibold ${isPremiumUser ? 'text-green-600' : 'text-gray-500'}`}>
                  {isPremiumUser ? '👑 Premium Üye' : '🆓 Ücretsiz Üye'}
                </p>
              </div>
            </div>
            
            {isPremiumUser ? (
              <div className="space-y-3">
                <div className="bg-white/80 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-green-600 mb-2">
                    <Check size={18} />
                    <span className="font-medium">Tüm kitaplara sınırsız erişim</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-600 mb-2">
                    <Check size={18} />
                    <span className="font-medium">Sesli okuma özelliği</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-600">
                    <Check size={18} />
                    <span className="font-medium">Yeni içeriklere öncelikli erişim</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 text-center">
                  Aboneliğinizi App Store veya Google Play üzerinden yönetebilirsiniz.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-white/80 rounded-xl p-4">
                  <p className="text-gray-600 mb-3">
                    Premium üyelik ile tüm hikayelere erişin!
                  </p>
                  <ul className="space-y-2 text-sm text-gray-500">
                    <li className="flex items-center gap-2">
                      <Crown size={14} className="text-yellow-500" />
                      50+ premium hikaye
                    </li>
                    <li className="flex items-center gap-2">
                      <Crown size={14} className="text-yellow-500" />
                      Sesli okuma özelliği
                    </li>
                    <li className="flex items-center gap-2">
                      <Crown size={14} className="text-yellow-500" />
                      Reklamsız deneyim
                    </li>
                  </ul>
                </div>
                <button
                  className="w-full bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                  onClick={() => setShowSubscriptionModal(true)}
                >
                  <Crown size={20} />
                  Premium&apos;a Yükselt
                </button>
                <p className="text-xs text-gray-400 text-center">
                  Aylık ₺29.99 • İstediğiniz zaman iptal edin
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Badges */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-gray-800 font-bold text-lg mb-4">Rozetlerim</h2>
          <div className="flex flex-wrap gap-3">
            {['bg-yellow-400', 'bg-blue-400', 'bg-green-400', 'bg-purple-400', 'bg-pink-400', 'bg-orange-400', 'bg-teal-400', 'bg-red-400'].map((color, index) => (
              <div 
                key={index}
                className={`w-12 h-12 ${color} rounded-full flex items-center justify-center shadow-md`}
              >
                <Award className="text-white" size={24} />
              </div>
            ))}
            {[1, 2, 3, 4].map((_, index) => (
              <div 
                key={`locked-${index}`}
                className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center opacity-50"
              >
                <Award className="text-gray-400" size={24} />
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Parent Dashboard Button */}
      <div className="px-4 mt-6 space-y-3">
        <button 
          onClick={onParentDashboard}
          className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-2xl py-4 font-bold shadow-lg hover:shadow-xl transition-all duration-300"
        >
          Ebeveyn Paneli
        </button>
        
        {/* Admin Panel Button - Only visible to admin (coskanselcuk@gmail.com) */}
        {isAdmin && (
          <button 
            onClick={onAdminPanel}
            className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-2xl py-4 font-bold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
          >
            <Settings size={20} />
            İçerik Yönetimi
          </button>
        )}
      </div>
      
      {/* Subscription Modal */}
      <SubscriptionModal 
        isOpen={showSubscriptionModal} 
        onClose={() => setShowSubscriptionModal(false)} 
      />
    </div>
  );
};

export { ProfileSelector, ProfilePage };
