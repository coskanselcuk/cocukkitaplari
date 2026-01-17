import React from 'react';
import { ArrowLeft, BookOpen, Clock, TrendingUp, PieChart } from 'lucide-react';
import { parentStats } from '../../data/mockData';

const ParentDashboard = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 px-4 py-6 safe-area-top">
        <div className="flex items-center gap-4 mb-4">
          <button 
            onClick={onBack}
            className="bg-white/20 rounded-full p-2 text-white"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-white text-xl font-bold">Ebeveyn Paneli</h1>
        </div>
        <p className="text-white/80 text-sm">
          Çocuğunuzun okuma alışkanlıklarını takip edin
        </p>
      </div>
      
      {/* Stats Overview */}
      <div className="px-4 -mt-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-4 shadow-lg">
            <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center mb-3">
              <BookOpen className="text-cyan-600" size={20} />
            </div>
            <p className="text-3xl font-bold text-gray-800">{parentStats.totalBooksRead}</p>
            <p className="text-gray-500 text-sm">Toplam Okunan</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-lg">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mb-3">
              <Clock className="text-orange-600" size={20} />
            </div>
            <p className="text-3xl font-bold text-gray-800">{parentStats.totalReadingTime}</p>
            <p className="text-gray-500 text-sm">Toplam Süre</p>
          </div>
        </div>
      </div>
      
      {/* Comprehension Score */}
      <div className="px-4 mt-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-gray-800 font-bold text-lg">Anlama Düzeyi</h2>
            <TrendingUp className="text-green-500" size={24} />
          </div>
          <div className="relative w-32 h-32 mx-auto">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="#E5E7EB"
                strokeWidth="12"
                fill="none"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="url(#gradient)"
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${parentStats.averageComprehension * 3.52} 352`}
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FF9500" />
                  <stop offset="100%" stopColor="#FF6B00" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-bold text-gray-800">%{parentStats.averageComprehension}</span>
            </div>
          </div>
          <p className="text-center text-gray-500 mt-4">Ortalama başarı oranı</p>
        </div>
      </div>
      
      {/* Weekly Progress */}
      <div className="px-4 mt-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h2 className="text-gray-800 font-bold text-lg mb-4">Haftalık İlerleme</h2>
          <div className="flex items-end justify-between h-32">
            {parentStats.weeklyProgress.map((day, index) => (
              <div key={index} className="flex flex-col items-center">
                <div 
                  className="w-8 bg-gradient-to-t from-orange-400 to-orange-500 rounded-t-lg transition-all duration-500"
                  style={{ height: `${day.books * 20}px` }}
                />
                <span className="text-xs text-gray-500 mt-2">{day.day}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Category Distribution */}
      <div className="px-4 mt-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-gray-800 font-bold text-lg">Kategori Dağılımı</h2>
            <PieChart className="text-cyan-500" size={24} />
          </div>
          <div className="space-y-3">
            {parentStats.categoryStats.map((cat, index) => {
              const colors = ['bg-red-400', 'bg-green-400', 'bg-yellow-400', 'bg-blue-400', 'bg-pink-400'];
              return (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 font-medium">{cat.category}</span>
                    <span className="text-gray-500">{cat.count} kitap</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${colors[index]} rounded-full transition-all duration-500`}
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;
