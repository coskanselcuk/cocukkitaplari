import React from 'react';
import { X, Play, RotateCcw, Volume2 } from 'lucide-react';

const ReaderSettings = ({ 
  isOpen, 
  onClose, 
  autoPlay, 
  setAutoPlay, 
  resumeContinue, 
  setResumeContinue 
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={(e) => { e.stopPropagation(); onClose(); }}
    >
      <div 
        className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 px-6 py-4 flex items-center justify-between">
          <h2 className="text-white font-bold text-lg">Okuma Ayarları</h2>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Settings Options */}
        <div className="p-6 space-y-6">
          {/* Auto-Play Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Play size={20} className="text-orange-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">Otomatik Oynat</p>
                <p className="text-sm text-gray-500">Ses ile sayfaları otomatik çevir</p>
              </div>
            </div>
            <button
              onClick={() => setAutoPlay(!autoPlay)}
              className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${autoPlay ? 'bg-orange-500' : 'bg-gray-300'}`}
            >
              <div 
                className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${autoPlay ? 'translate-x-7' : 'translate-x-1'}`}
              />
            </button>
          </div>
          
          {/* Resume/Continue Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center">
                <RotateCcw size={20} className="text-cyan-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">Kaldığın Yerden Devam</p>
                <p className="text-sm text-gray-500">Okuma ilerlemeni kaydet</p>
              </div>
            </div>
            <button
              onClick={() => setResumeContinue(!resumeContinue)}
              className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${resumeContinue ? 'bg-cyan-500' : 'bg-gray-300'}`}
            >
              <div 
                className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${resumeContinue ? 'translate-x-7' : 'translate-x-1'}`}
              />
            </button>
          </div>
          
          {/* Info Box */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <Volume2 size={20} className="text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">
                  <strong>Otomatik Oynat</strong> açıkken, ses kaydı çalarken sayfalar otomatik olarak değişir.
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  <strong>Kaldığın Yerden Devam</strong> açıkken, kitaptan çıktığınızda ilerlemeniz kaydedilir.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Done Button */}
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-orange-400 to-orange-500 text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Tamam
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReaderSettings;
