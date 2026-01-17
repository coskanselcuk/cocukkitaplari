import React, { useEffect, useState, useMemo } from 'react';
import { Star, BookOpen, Home, RotateCcw } from 'lucide-react';

const CompletionCelebration = ({ book, onClose, onRestart }) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Trigger animations in sequence
    setTimeout(() => setShowConfetti(true), 100);
    setTimeout(() => setShowContent(true), 500);
  }, []);

  // Generate confetti particles with useMemo to avoid re-rendering issues
  const confettiColors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181', '#A8E6CF', '#FFD93D'];
  
  const confetti = useMemo(() => 
    Array.from({ length: 50 }, (_, i) => ({
      id: i,
      color: confettiColors[i % confettiColors.length],
      left: `${(i * 2) % 100}%`,
      delay: (i % 10) * 0.2,
      duration: 3 + (i % 5) * 0.5,
      size: 8 + (i % 4) * 4,
      isCircle: i % 2 === 0
    }))
  , []);

  // Generate stars with useMemo
  const stars = useMemo(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      size: 12 + (i % 4) * 4,
      left: `${(i * 5) % 100}%`,
      top: `${(i * 7) % 100}%`,
      delay: (i % 5) * 0.4,
      opacity: 0.6 + (i % 4) * 0.1
    }))
  , []);

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-purple-600 via-purple-500 to-indigo-600 flex items-center justify-center overflow-hidden">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {confetti.map((particle) => (
            <div
              key={particle.id}
              className="absolute animate-confetti-fall"
              style={{
                left: particle.left,
                top: '-20px',
                width: particle.size,
                height: particle.size,
                backgroundColor: particle.color,
                borderRadius: particle.isCircle ? '50%' : '2px',
                animationDelay: `${particle.delay}s`,
                animationDuration: `${particle.duration}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Stars Background */}
      <div className="absolute inset-0 pointer-events-none">
        {stars.map((star) => (
          <Star
            key={star.id}
            className="absolute text-yellow-300 animate-pulse"
            size={star.size}
            style={{
              left: star.left,
              top: star.top,
              animationDelay: `${star.delay}s`,
              opacity: star.opacity
            }}
            fill="currentColor"
          />
        ))}
      </div>

      {/* Main Content */}
      <div 
        className={`relative z-10 text-center transition-all duration-700 transform ${
          showContent ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
        }`}
      >
        {/* Trophy/Badge */}
        <div className="mb-6 relative">
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full flex items-center justify-center shadow-2xl animate-bounce-slow">
            <Star className="text-white" size={64} fill="white" />
          </div>
          {/* Sparkles around trophy */}
          <div className="absolute -top-2 -right-2 animate-ping">
            <Star className="text-yellow-300" size={20} fill="currentColor" />
          </div>
          <div className="absolute -bottom-1 -left-3 animate-ping" style={{ animationDelay: '0.5s' }}>
            <Star className="text-yellow-300" size={16} fill="currentColor" />
          </div>
        </div>

        {/* Congratulations Text */}
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 drop-shadow-lg">
          Tebrikler! 🎉
        </h1>
        <p className="text-xl text-purple-100 mb-2">
          Hikayeyi bitirdin!
        </p>
        {book && (
          <p className="text-lg text-purple-200 mb-8 flex items-center justify-center gap-2">
            <BookOpen size={20} />
            {book.title}
          </p>
        )}

        {/* Fun Message */}
        <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 mb-8 max-w-sm mx-auto">
          <p className="text-white text-lg">
            Harika bir okuyucusun! ⭐
          </p>
          <p className="text-purple-100 text-sm mt-1">
            Başka bir hikaye okumaya ne dersin?
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onRestart}
            className="bg-white/20 hover:bg-white/30 text-white font-bold py-4 px-8 rounded-2xl shadow-lg transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm"
            data-testid="restart-book-btn"
          >
            <RotateCcw size={20} />
            Tekrar Oku
          </button>
          <button
            onClick={onClose}
            className="bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white font-bold py-4 px-8 rounded-2xl shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
            data-testid="go-home-btn"
          >
            <Home size={20} />
            Ana Sayfaya Dön
          </button>
        </div>
      </div>

      {/* CSS for confetti animation */}
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti-fall {
          animation: confetti-fall linear forwards;
        }
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default CompletionCelebration;
