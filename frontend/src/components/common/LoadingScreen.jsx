import React, { useState, useEffect } from 'react';
import { BookOpen, Headphones, Music } from 'lucide-react';

const LoadingScreen = ({ type = 'default', message = 'Yükleniyor...' }) => {
  const [bookPositions, setBookPositions] = useState([]);
  
  useEffect(() => {
    // Animate books onto shelves
    const positions = [];
    for (let i = 0; i < 12; i++) {
      positions.push({
        delay: i * 150,
        shelf: Math.floor(i / 4),
        position: i % 4
      });
    }
    setBookPositions(positions);
  }, []);

  if (type === 'bookshelf') {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-b from-indigo-900 via-indigo-800 to-indigo-900 flex flex-col items-center justify-center">
        {/* Stars */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                opacity: Math.random() * 0.8 + 0.2
              }}
            />
          ))}
        </div>
        
        {/* Bookshelf */}
        <div className="relative z-10 w-72">
          {/* Shelves */}
          {[0, 1, 2].map((shelf) => (
            <div key={shelf} className="relative mb-2">
              {/* Books on shelf */}
              <div className="flex justify-center gap-2 h-16 items-end">
                {bookPositions
                  .filter(b => b.shelf === shelf)
                  .map((book, idx) => {
                    const colors = ['bg-red-400', 'bg-blue-400', 'bg-green-400', 'bg-yellow-400', 'bg-purple-400', 'bg-pink-400', 'bg-orange-400', 'bg-teal-400'];
                    return (
                      <div
                        key={idx}
                        className={`w-10 ${colors[idx % colors.length]} rounded-t-sm shadow-lg animate-slide-up`}
                        style={{
                          height: `${40 + Math.random() * 20}px`,
                          animationDelay: `${book.delay}ms`
                        }}
                      />
                    );
                  })}
              </div>
              {/* Shelf board */}
              <div className="h-3 bg-amber-700 rounded shadow-lg" />
            </div>
          ))}
        </div>
        
        {/* Decorations */}
        <div className="absolute top-20 left-10 text-white/30 animate-bounce-slow">
          <Headphones size={32} />
        </div>
        <div className="absolute bottom-32 right-10 text-white/30 animate-bounce-slow" style={{ animationDelay: '0.5s' }}>
          <Music size={28} />
        </div>
        
        {/* Loading text */}
        <p className="text-white text-lg font-semibold mt-8 animate-pulse">
          {message}
        </p>
        
        {/* Loading dots */}
        <div className="flex gap-2 mt-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  // Default loading
  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-indigo-900 to-indigo-800 flex flex-col items-center justify-center">
      {/* Stars */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
      </div>
      
      {/* Loading animation */}
      <div className="relative">
        <div className="flex gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-4 h-4 bg-cyan-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      </div>
      
      <p className="text-white text-lg font-semibold mt-6 animate-pulse">
        {message}
      </p>
    </div>
  );
};

export default LoadingScreen;
