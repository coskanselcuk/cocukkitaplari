import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Check, Star, BookOpen, Clock, Award, User } from 'lucide-react';
import { profiles } from '../../data/mockData';

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

const ProfilePage = ({ profile, onBack, onParentDashboard }) => {
  const avatarColors = ['bg-pink-400', 'bg-blue-400', 'bg-green-400', 'bg-purple-400', 'bg-orange-400'];
  
  return (
    <div className="min-h-screen pb-24">
      {/* Profile Header */}
      <div className="bg-gradient-to-b from-orange-400 to-orange-500 px-4 py-8 text-center">
        <div className="w-28 h-28 bg-white rounded-full mx-auto flex items-center justify-center shadow-xl mb-4">
          <span className="text-orange-500 text-5xl font-bold">{profile.name.charAt(0).toUpperCase()}</span>
        </div>
        <h1 className="text-white text-2xl font-bold">{profile.name}</h1>
        <p className="text-white/80">{profile.age} yaşında</p>
      </div>
      
      {/* Stats */}
      <div className="px-4 -mt-6">
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
      
      {/* Badges */}
      <div className="px-4 mt-6">
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
      <div className="px-4 mt-6">
        <button 
          onClick={onParentDashboard}
          className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-2xl py-4 font-bold shadow-lg hover:shadow-xl transition-all duration-300"
        >
          Ebeveyn Paneli
        </button>
      </div>
    </div>
  );
};

export { ProfileSelector, ProfilePage };
