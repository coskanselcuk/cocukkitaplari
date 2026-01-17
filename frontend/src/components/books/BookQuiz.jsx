import React, { useState } from 'react';
import { CheckCircle, XCircle, ArrowRight, Home } from 'lucide-react';

const BookQuiz = ({ book, onClose }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);

  // Sample quiz questions - would come from book data
  const questions = [
    {
      question: 'Bu hikayede Pırıl nereye gitti?',
      options: [
        { text: 'Ormana', image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=100&h=100&fit=crop', correct: true },
        { text: 'Denize', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=100&h=100&fit=crop', correct: false },
        { text: 'Okula', image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=100&h=100&fit=crop', correct: false }
      ]
    },
    {
      question: 'Pırıl ormanda kimi buldu?',
      options: [
        { text: 'Bir kuş', image: 'https://images.unsplash.com/photo-1444464666168-49d633b86797?w=100&h=100&fit=crop', correct: false },
        { text: 'Bir sincap', image: 'https://images.unsplash.com/photo-1474511320723-9a56873571b7?w=100&h=100&fit=crop', correct: true },
        { text: 'Bir kedi', image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=100&h=100&fit=crop', correct: false }
      ]
    },
    {
      question: 'Hikayenin sonunda ne oldu?',
      options: [
        { text: 'Arkadaş oldular', image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=100&h=100&fit=crop', correct: true },
        { text: 'Eve döndüler', image: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=100&h=100&fit=crop', correct: false },
        { text: 'Uyudular', image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=100&h=100&fit=crop', correct: false }
      ]
    }
  ];

  const handleAnswerSelect = (option, index) => {
    if (showResult) return;
    
    setSelectedAnswer(index);
    setShowResult(true);
    
    if (option.correct) {
      setScore(prev => prev + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setQuizComplete(true);
    }
  };

  if (quizComplete) {
    const percentage = Math.round((score / questions.length) * 100);
    
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-b from-purple-500 to-purple-700 flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
          <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 ${percentage >= 70 ? 'bg-green-100' : 'bg-orange-100'}`}>
            {percentage >= 70 ? (
              <CheckCircle className="text-green-500" size={48} />
            ) : (
              <span className="text-4xl">📚</span>
            )}
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {percentage >= 70 ? 'Tebrikler!' : 'İyi Deneme!'}
          </h2>
          
          <p className="text-gray-600 mb-4">
            {questions.length} sorudan {score} tanesini doğru bildin!
          </p>
          
          <div className="text-5xl font-bold text-purple-600 mb-6">
            %{percentage}
          </div>
          
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-orange-400 to-orange-500 text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
          >
            <Home size={20} />
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-cyan-400 to-cyan-600 flex flex-col items-center justify-center p-6">
      {/* Progress */}
      <div className="w-full max-w-md mb-6">
        <div className="flex justify-between text-white text-sm mb-2">
          <span>Soru {currentQuestion + 1}/{questions.length}</span>
          <span>Puan: {score}</span>
        </div>
        <div className="h-2 bg-white/30 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>
      
      {/* Question Card */}
      <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl">
        <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">
          {question.question}
        </h2>
        
        {/* Options */}
        <div className="space-y-3">
          {question.options.map((option, index) => {
            let buttonClass = 'bg-gray-50 hover:bg-gray-100 border-2 border-gray-200';
            
            if (showResult) {
              if (option.correct) {
                buttonClass = 'bg-green-50 border-2 border-green-500';
              } else if (selectedAnswer === index && !option.correct) {
                buttonClass = 'bg-red-50 border-2 border-red-500';
              }
            } else if (selectedAnswer === index) {
              buttonClass = 'bg-cyan-50 border-2 border-cyan-500';
            }
            
            return (
              <button
                key={index}
                onClick={() => handleAnswerSelect(option, index)}
                disabled={showResult}
                className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all duration-300 ${buttonClass}`}
              >
                <img 
                  src={option.image} 
                  alt={option.text}
                  className="w-16 h-16 rounded-xl object-cover"
                />
                <span className="text-gray-800 font-medium flex-1 text-left">
                  {option.text}
                </span>
                {showResult && option.correct && (
                  <CheckCircle className="text-green-500" size={24} />
                )}
                {showResult && selectedAnswer === index && !option.correct && (
                  <XCircle className="text-red-500" size={24} />
                )}
              </button>
            );
          })}
        </div>
        
        {/* Next Button */}
        {showResult && (
          <button
            onClick={nextQuestion}
            className="w-full mt-6 bg-gradient-to-r from-orange-400 to-orange-500 text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
          >
            {currentQuestion < questions.length - 1 ? (
              <>
                Sonraki Soru
                <ArrowRight size={20} />
              </>
            ) : (
              'Sonuçları Gör'
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default BookQuiz;
