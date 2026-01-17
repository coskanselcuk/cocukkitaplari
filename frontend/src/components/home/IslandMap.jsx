import React from 'react';
import { categories } from '../../data/mockData';
import { Users, Leaf, BookOpen, Microscope, Home } from 'lucide-react';

const IslandMap = ({ onCategorySelect }) => {
  const islandPositions = [
    { top: '5%', left: '50%', transform: 'translateX(-50%)' },
    { top: '25%', left: '10%' },
    { top: '25%', right: '10%' },
    { top: '50%', left: '20%' },
    { top: '50%', right: '20%' },
  ];

  const getIcon = (iconType) => {
    const iconProps = { size: 32, className: "text-white drop-shadow-lg" };
    switch (iconType) {
      case 'hero': return <Users {...iconProps} />;
      case 'nature': return <Leaf {...iconProps} />;
      case 'fairytale': return <BookOpen {...iconProps} />;
      case 'science': return <Microscope {...iconProps} />;
      case 'life': return <Home {...iconProps} />;
      default: return <BookOpen {...iconProps} />;
    }
  };

  return (
    <div className="relative w-full h-[55vh] overflow-hidden">
      {/* Decorative clouds */}
      <div className="absolute top-8 left-8 w-16 h-8 bg-white/30 rounded-full blur-sm animate-float" style={{ animationDelay: '0s' }} />
      <div className="absolute top-16 right-16 w-20 h-10 bg-white/25 rounded-full blur-sm animate-float" style={{ animationDelay: '1s' }} />
      <div className="absolute top-4 right-8 w-12 h-6 bg-white/30 rounded-full blur-sm animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute top-24 left-20 w-14 h-7 bg-white/20 rounded-full blur-sm animate-float" style={{ animationDelay: '0.5s' }} />
      
      {/* Islands */}
      {categories.map((category, index) => (
        <button
          key={category.id}
          onClick={() => onCategorySelect(category)}
          className="island absolute cursor-pointer group focus:outline-none"
          style={{
            ...islandPositions[index],
            animationDelay: `${index * 0.2}s`
          }}
        >
          <div className={`relative animate-float`} style={{ animationDelay: `${index * 0.5}s` }}>
            {/* Island Shadow */}
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-cyan-700/30 rounded-full blur-lg" />
            
            {/* Island Base */}
            <div className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br ${category.gradient} shadow-2xl flex flex-col items-center justify-center overflow-hidden group-hover:scale-110 group-active:scale-95 transition-transform duration-300`}>
              {/* Shine effect */}
              <div className="absolute top-2 left-2 w-8 h-8 bg-white/30 rounded-full blur-md" />
              
              {/* Icon */}
              <div className="z-10 mb-1">
                {getIcon(category.icon)}
              </div>
              
              {/* Text */}
              <span className="text-white font-bold text-[10px] sm:text-xs text-center leading-tight px-2 drop-shadow-lg z-10">
                {category.name}
              </span>
              
              {/* Hover glow */}
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/20 rounded-full transition-colors duration-300" />
            </div>
            
            {/* Floating particles */}
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-300 rounded-full animate-bounce-slow shadow-lg" style={{ animationDelay: `${index * 0.2}s` }} />
            <div className="absolute -bottom-0 -left-1 w-2 h-2 bg-white rounded-full animate-bounce-slow opacity-80" style={{ animationDelay: `${0.5 + index * 0.2}s` }} />
          </div>
        </button>
      ))}
      
      {/* Water wave effect at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none">
        <svg viewBox="0 0 1440 100" className="w-full h-full" preserveAspectRatio="none">
          <path 
            fill="rgba(255,255,255,0.08)" 
            d="M0,50 C150,80 350,20 500,50 C650,80 850,20 1000,50 C1150,80 1350,20 1440,50 L1440,100 L0,100 Z"
          />
          <path 
            fill="rgba(255,255,255,0.05)" 
            d="M0,60 C200,90 400,30 600,60 C800,90 1000,30 1200,60 C1300,75 1400,45 1440,60 L1440,100 L0,100 Z"
          />
        </svg>
      </div>
    </div>
  );
};

export default IslandMap;
