import React from 'react';
import { Gamepad2, Trophy, Star, Lock } from 'lucide-react';
import { miniGames } from '../../data/mockData';

const GamesPage = () => {
  const gameCategories = [
    { name: 'Yapboz Oyunları', games: miniGames.filter(g => g.type === 'puzzle'), color: 'from-purple-400 to-purple-600' },
    { name: 'Eşleştirme', games: miniGames.filter(g => g.type === 'matching'), color: 'from-green-400 to-green-600' },
    { name: 'Bilgi Yarışması', games: miniGames.filter(g => g.type === 'quiz'), color: 'from-blue-400 to-blue-600' },
    { name: 'Boyama', games: miniGames.filter(g => g.type === 'coloring'), color: 'from-pink-400 to-pink-600' },
  ];

  return (
    <div className="min-h-screen pb-24 pt-20">
      {/* Header */}
      <div className="px-4 mb-6">
        <h1 className="text-white text-2xl font-bold mb-2">Oyunlar</h1>
        <p className="text-white/80">Eğlenceli mini oyunlarla öğren!</p>
      </div>
      
      {/* Featured Games */}
      <div className="px-4 mb-8">
        <div className="bg-gradient-to-r from-orange-400 to-pink-500 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-8 -mb-8" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="text-yellow-300" size={24} />
              <span className="text-white/90 font-semibold">Günün Oyunu</span>
            </div>
            <h2 className="text-white text-2xl font-bold mb-2">Hafiza Oyunu</h2>
            <p className="text-white/80 mb-4">Kartları eşleştir ve hafızanı test et!</p>
            <button className="bg-white text-orange-500 font-bold py-3 px-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
              Oyna
            </button>
          </div>
        </div>
      </div>
      
      {/* Game Categories */}
      <div className="px-4 space-y-6">
        {gameCategories.map((category, catIndex) => (
          <div key={catIndex}>
            <h2 className="text-white font-bold text-lg mb-3">{category.name}</h2>
            <div className="grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, index) => {
                const game = category.games[0];
                const isLocked = index > 1;
                
                return (
                  <button
                    key={index}
                    className={`bg-white rounded-2xl p-4 shadow-lg relative overflow-hidden ${isLocked ? 'opacity-60' : 'hover:shadow-xl'} transition-all duration-300`}
                    disabled={isLocked}
                  >
                    {isLocked && (
                      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-10 rounded-2xl">
                        <Lock className="text-white" size={32} />
                      </div>
                    )}
                    
                    <div className={`w-14 h-14 bg-gradient-to-br ${category.color} rounded-2xl flex items-center justify-center mb-3 shadow-lg`}>
                      <span className="text-3xl">{game?.icon}</span>
                    </div>
                    <h3 className="font-bold text-gray-800 text-left">
                      {game?.name} {index + 1}
                    </h3>
                    <div className="flex items-center gap-1 mt-2">
                      {[1, 2, 3].map((star) => (
                        <Star 
                          key={star}
                          size={14} 
                          className={star <= (isLocked ? 0 : index + 1) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} 
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GamesPage;
