import React from 'react';
import { categories } from '../../data/mockData';

const IslandMap = ({ onCategorySelect }) => {
  const islandPositions = [
    { top: '5%', left: '50%', transform: 'translateX(-50%)' },
    { top: '25%', left: '15%' },
    { top: '25%', right: '15%' },
    { top: '50%', left: '25%' },
    { top: '50%', right: '25%' },
  ];

  const getIslandGradient = (index) => {
    const gradients = [
      'from-red-400 to-orange-400',
      'from-green-400 to-teal-400',
      'from-yellow-400 to-amber-400',
      'from-blue-400 to-cyan-400',
      'from-pink-400 to-rose-400',
    ];
    return gradients[index % gradients.length];
  };

  return (
    <div className="relative w-full h-[60vh] overflow-hidden">
      {/* Clouds */}
      <div className="absolute top-10 left-10 w-20 h-10 bg-white/40 rounded-full blur-sm animate-float" style={{ animationDelay: '0s' }} />
      <div className="absolute top-20 right-20 w-24 h-12 bg-white/30 rounded-full blur-sm animate-float" style={{ animationDelay: '1s' }} />
      <div className="absolute top-5 right-10 w-16 h-8 bg-white/35 rounded-full blur-sm animate-float" style={{ animationDelay: '2s' }} />
      
      {/* Islands */}
      {categories.map((category, index) => (
        <button
          key={category.id}
          onClick={() => onCategorySelect(category)}
          className="island absolute cursor-pointer group"
          style={{
            ...islandPositions[index],
            animationDelay: `${index * 0.2}s`
          }}
        >
          <div className={`relative animate-float`} style={{ animationDelay: `${index * 0.5}s` }}>
            {/* Island Base */}
            <div className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-b ${getIslandGradient(index)} shadow-2xl flex items-center justify-center relative overflow-hidden`}>
              {/* Island Glow */}
              <div className="absolute inset-0 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Island Content */}
              <div className="text-center z-10 p-2">
                <span className="text-4xl sm:text-5xl block mb-1">{category.icon}</span>
                <span className="text-white font-bold text-xs sm:text-sm leading-tight drop-shadow-lg">
                  {category.name}
                </span>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-36 h-6 bg-gradient-to-t from-cyan-600/50 to-transparent rounded-full blur-md" />
            </div>
            
            {/* Floating particles */}
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-300 rounded-full animate-bounce-slow opacity-80" />
            <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white rounded-full animate-bounce-slow" style={{ animationDelay: '0.5s' }} />
          </div>
        </button>
      ))}
      
      {/* Water waves effect */}
      <div className="absolute bottom-0 left-0 right-0 h-20">
        <svg viewBox="0 0 1440 120" className="w-full h-full">
          <path 
            fill="rgba(255,255,255,0.1)" 
            d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,64C960,75,1056,85,1152,80C1248,75,1344,53,1392,42.7L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
          />
        </svg>
      </div>
    </div>
  );
};

export default IslandMap;
