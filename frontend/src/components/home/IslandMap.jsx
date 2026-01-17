import React, { useState, useEffect } from 'react';
import { categoriesApi } from '../../services/api';
import { categories as mockCategories } from '../../data/mockData';

const IslandMap = ({ onCategorySelect }) => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoriesApi.getAll();
        if (response.categories && response.categories.length > 0) {
          setCategories(response.categories);
        } else {
          setCategories(mockCategories);
        }
      } catch (error) {
        console.log('Using mock categories:', error.message);
        setCategories(mockCategories);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // Dynamic island positions based on number of categories
  const getIslandConfigs = (count) => {
    // Default positions for up to 7 islands
    const positions = [
      { top: '5%', left: '50%', transform: 'translateX(-50%)', size: 'large', decoration: 'volcano' },
      { top: '30%', left: '8%', size: 'medium', decoration: 'trees' },
      { top: '25%', right: '8%', size: 'medium', decoration: 'castle' },
      { top: '55%', left: '15%', size: 'medium', decoration: 'lab' },
      { top: '55%', right: '15%', size: 'medium', decoration: 'house' },
      { top: '75%', left: '35%', size: 'small', decoration: 'trees' },
      { top: '75%', right: '35%', size: 'small', decoration: 'castle' },
    ];
    return positions.slice(0, count);
  };

  const decorations = ['volcano', 'trees', 'castle', 'lab', 'house'];
  
  const islandConfigs = getIslandConfigs(categories.length);

  const getIslandDecoration = (type, color) => {
    switch (type) {
      case 'volcano':
        return (
          <svg viewBox="0 0 100 80" className="w-full h-16 absolute -top-12">
            <path d="M50 0 L70 40 L65 40 L75 60 L25 60 L35 40 L30 40 Z" fill="#8B4513" />
            <ellipse cx="50" cy="5" rx="10" ry="5" fill="#FF6B35" />
            <ellipse cx="50" cy="5" rx="6" ry="3" fill="#FFD700" />
          </svg>
        );
      case 'trees':
        return (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex gap-1">
            <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-b-[16px] border-l-transparent border-r-transparent border-b-green-600" />
            <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-b-[20px] border-l-transparent border-r-transparent border-b-green-500" />
            <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-b-[16px] border-l-transparent border-r-transparent border-b-green-600" />
          </div>
        );
      case 'castle':
        return (
          <div className="absolute -top-14 left-1/2 -translate-x-1/2">
            <div className="flex justify-center gap-1">
              <div className="w-3 h-8 bg-amber-200 rounded-t" />
              <div className="w-4 h-12 bg-amber-100 rounded-t" />
              <div className="w-3 h-8 bg-amber-200 rounded-t" />
            </div>
            <div className="w-12 h-4 bg-amber-300 -mt-1 rounded-t" />
          </div>
        );
      case 'lab':
        return (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2">
            <div className="w-6 h-8 bg-blue-200 rounded-t-lg relative">
              <div className="absolute top-1 left-1 w-1 h-1 bg-blue-400 rounded-full animate-pulse" />
              <div className="absolute top-3 right-1 w-1 h-1 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
            </div>
          </div>
        );
      case 'house':
        return (
          <div className="absolute -top-12 left-1/2 -translate-x-1/2">
            <div className="w-0 h-0 border-l-[16px] border-r-[16px] border-b-[12px] border-l-transparent border-r-transparent border-b-red-400" />
            <div className="w-8 h-6 bg-amber-100 flex items-center justify-center">
              <div className="w-2 h-3 bg-amber-600 rounded-t" />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative w-full h-[58vh] overflow-hidden">
      {/* Animated clouds */}
      <div className="absolute top-6 left-[5%] w-20 h-10 bg-white/40 rounded-full blur-sm animate-float" style={{ animationDelay: '0s' }} />
      <div className="absolute top-3 right-[10%] w-16 h-8 bg-white/30 rounded-full blur-sm animate-float" style={{ animationDelay: '1s' }} />
      <div className="absolute top-16 left-[20%] w-12 h-6 bg-white/35 rounded-full blur-sm animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute top-10 right-[25%] w-14 h-7 bg-white/25 rounded-full blur-sm animate-float" style={{ animationDelay: '0.5s' }} />
      <div className="absolute top-20 left-[60%] w-10 h-5 bg-white/30 rounded-full blur-sm animate-float" style={{ animationDelay: '1.5s' }} />
      
      {/* Sun */}
      <div className="absolute top-4 right-8 w-12 h-12 bg-yellow-300 rounded-full shadow-lg shadow-yellow-200/50 animate-pulse" style={{ animationDuration: '3s' }}>
        <div className="absolute inset-1 bg-yellow-200 rounded-full" />
      </div>
      
      {/* Islands */}
      {categories.map((category, index) => (
        <button
          key={category.id}
          onClick={() => onCategorySelect(category)}
          className="island absolute cursor-pointer group focus:outline-none"
          style={{
            top: islandConfigs[index]?.top,
            left: islandConfigs[index]?.left,
            right: islandConfigs[index]?.right,
            transform: islandConfigs[index]?.transform,
          }}
        >
          <div className="relative animate-float" style={{ animationDelay: `${index * 0.5}s`, animationDuration: `${3 + index * 0.3}s` }}>
            {/* Island decoration */}
            {getIslandDecoration(islandConfigs[index]?.decoration, category.gradient)}
            
            {/* Island base with grass top */}
            <div className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-b ${category.gradient} shadow-2xl flex flex-col items-center justify-center overflow-visible group-hover:scale-110 group-active:scale-95 transition-transform duration-300`}>
              {/* Grass ring on top */}
              <div className="absolute -top-1 w-full h-4 bg-gradient-to-b from-green-400 to-transparent rounded-t-full" />
              
              {/* Shine effect */}
              <div className="absolute top-3 left-3 w-6 h-6 bg-white/40 rounded-full blur-sm" />
              
              {/* Island Label */}
              <span className="text-white font-bold text-xs sm:text-sm text-center leading-tight px-3 drop-shadow-lg z-10 mt-2">
                {category.name}
              </span>
              
              {/* Hover glow */}
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/20 rounded-full transition-colors duration-300" />
            </div>
            
            {/* Shadow beneath island */}
            <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-20 h-4 bg-cyan-700/30 rounded-full blur-md" />
            
            {/* Floating particles */}
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-300 rounded-full animate-bounce-slow shadow-lg" style={{ animationDelay: `${index * 0.2}s` }} />
            <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-white rounded-full animate-bounce-slow opacity-80" style={{ animationDelay: `${0.5 + index * 0.2}s` }} />
          </div>
        </button>
      ))}
      
      {/* Birds */}
      <div className="absolute top-16 left-[40%] text-gray-600 text-xl animate-float" style={{ animationDelay: '2s' }}>
        <svg width="20" height="10" viewBox="0 0 20 10">
          <path d="M0 5 Q5 0 10 5 Q15 0 20 5" stroke="currentColor" fill="none" strokeWidth="1.5" />
        </svg>
      </div>
      <div className="absolute top-24 right-[30%] text-gray-600 text-lg animate-float" style={{ animationDelay: '1s' }}>
        <svg width="16" height="8" viewBox="0 0 20 10">
          <path d="M0 5 Q5 0 10 5 Q15 0 20 5" stroke="currentColor" fill="none" strokeWidth="1.5" />
        </svg>
      </div>
      
      {/* Water waves at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none">
        <svg viewBox="0 0 1440 80" className="w-full h-full" preserveAspectRatio="none">
          <path 
            fill="rgba(255,255,255,0.1)" 
            d="M0,40 C150,60 350,20 500,40 C650,60 850,20 1000,40 C1150,60 1350,20 1440,40 L1440,80 L0,80 Z"
          >
            <animate attributeName="d" dur="4s" repeatCount="indefinite"
              values="M0,40 C150,60 350,20 500,40 C650,60 850,20 1000,40 C1150,60 1350,20 1440,40 L1440,80 L0,80 Z;
                      M0,40 C150,20 350,60 500,40 C650,20 850,60 1000,40 C1150,20 1350,60 1440,40 L1440,80 L0,80 Z;
                      M0,40 C150,60 350,20 500,40 C650,60 850,20 1000,40 C1150,60 1350,20 1440,40 L1440,80 L0,80 Z"
            />
          </path>
          <path 
            fill="rgba(255,255,255,0.06)" 
            d="M0,50 C200,70 400,30 600,50 C800,70 1000,30 1200,50 C1300,60 1400,40 1440,50 L1440,80 L0,80 Z"
          >
            <animate attributeName="d" dur="5s" repeatCount="indefinite"
              values="M0,50 C200,70 400,30 600,50 C800,70 1000,30 1200,50 C1300,60 1400,40 1440,50 L1440,80 L0,80 Z;
                      M0,50 C200,30 400,70 600,50 C800,30 1000,70 1200,50 C1300,40 1400,60 1440,50 L1440,80 L0,80 Z;
                      M0,50 C200,70 400,30 600,50 C800,70 1000,30 1200,50 C1300,60 1400,40 1440,50 L1440,80 L0,80 Z"
            />
          </path>
        </svg>
      </div>
    </div>
  );
};

export default IslandMap;
