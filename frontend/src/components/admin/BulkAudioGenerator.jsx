import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, Play, Pause, Check, X, AlertTriangle, 
  Loader2, RefreshCw, Mic, ChevronDown
} from 'lucide-react';
import { voicesApi } from '../../services/api';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const BulkAudioGenerator = ({ 
  bookId, 
  bookTitle,
  totalPages,
  pagesWithAudio,
  onComplete,
  onClose 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, status: '' });
  const [results, setResults] = useState({ success: 0, errors: 0 });
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);
  const [isComplete, setIsComplete] = useState(false);
  
  // Voice selection
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [isLoadingVoices, setIsLoadingVoices] = useState(true);
  const [regenerateAll, setRegenerateAll] = useState(false);
  
  // Preview audio
  const [playingPreview, setPlayingPreview] = useState(null);
  const audioRef = useRef(null);
  
  const eventSourceRef = useRef(null);
  const logsEndRef = useRef(null);

  // Fetch available voices
  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const response = await voicesApi.getAll();
        setVoices(response.voices || []);
        // Set default voice if available
        const defaultVoice = response.voices?.find(v => v.is_default);
        if (defaultVoice) {
          setSelectedVoice(defaultVoice.elevenlabs_id);
        }
      } catch (err) {
        console.error('Failed to fetch voices:', err);
      } finally {
        setIsLoadingVoices(false);
      }
    };
    fetchVoices();
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString('tr-TR');
    setLogs(prev => [...prev, { message, type, timestamp }]);
  };

  const handlePlayPreview = (voice) => {
    if (!voice.preview_url) return;

    if (playingPreview === voice.elevenlabs_id) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPlayingPreview(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(voice.preview_url);
      audioRef.current.onended = () => setPlayingPreview(null);
      audioRef.current.play();
      setPlayingPreview(voice.elevenlabs_id);
    }
  };

  const startGeneration = () => {
    setIsGenerating(true);
    setError(null);
    setLogs([]);
    setResults({ success: 0, errors: 0 });
    setIsComplete(false);
    
    // Build URL with query params
    let url = `${API_URL}/api/admin/generate-audio-stream/${bookId}`;
    const params = new URLSearchParams();
    if (selectedVoice) params.append('voice_id', selectedVoice);
    if (regenerateAll) params.append('regenerate_all', 'true');
    if (params.toString()) url += `?${params.toString()}`;
    
    addLog(`Ses oluşturma başlatılıyor...`, 'info');
    if (selectedVoice) {
      const voiceName = voices.find(v => v.elevenlabs_id === selectedVoice)?.name || selectedVoice;
      addLog(`Seçilen ses: ${voiceName}`, 'info');
    }
    if (regenerateAll) {
      addLog(`Tüm sayfalar için ses yeniden oluşturulacak`, 'warning');
    }
    
    // Use EventSource for SSE
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'start':
            setProgress({ current: 0, total: data.total, status: 'starting' });
            addLog(`${data.total} sayfa için ses oluşturulacak`, 'info');
            break;
            
          case 'progress':
            setProgress({ 
              current: data.current, 
              total: data.total, 
              status: data.status 
            });
            
            if (data.status === 'generating') {
              addLog(`Sayfa ${data.page}: Oluşturuluyor...`, 'info');
            } else if (data.status === 'success') {
              addLog(`Sayfa ${data.page}: ✓ Başarılı`, 'success');
              setResults(prev => ({ ...prev, success: prev.success + 1 }));
            } else if (data.status === 'error') {
              addLog(`Sayfa ${data.page}: ✗ Hata - ${data.message || 'Bilinmeyen hata'}`, 'error');
              setResults(prev => ({ ...prev, errors: prev.errors + 1 }));
            } else if (data.status === 'skipped') {
              addLog(`Sayfa ${data.page}: Atlandı - ${data.message}`, 'warning');
            }
            break;
            
          case 'complete':
            setProgress({ current: data.total, total: data.total, status: 'complete' });
            setResults({ success: data.success, errors: data.errors });
            setIsComplete(true);
            addLog(`Tamamlandı: ${data.success} başarılı, ${data.errors} hata`, data.errors > 0 ? 'warning' : 'success');
            eventSource.close();
            setIsGenerating(false);
            if (onComplete) onComplete();
            break;
            
          case 'error':
            setError(data.message);
            addLog(`Hata: ${data.message}`, 'error');
            eventSource.close();
            setIsGenerating(false);
            break;
            
          default:
            console.log('Unknown event type:', data);
        }
      } catch (e) {
        console.error('Error parsing SSE data:', e);
      }
    };
    
    eventSource.onerror = (err) => {
      console.error('SSE Error:', err);
      setError('Bağlantı hatası oluştu');
      addLog('Bağlantı hatası - Sunucuyla bağlantı kesildi', 'error');
      eventSource.close();
      setIsGenerating(false);
    };
  };

  const stopGeneration = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsGenerating(false);
    addLog('Ses oluşturma iptal edildi', 'warning');
  };

  const progressPercentage = progress.total > 0 
    ? Math.round((progress.current / progress.total) * 100) 
    : 0;

  const pagesNeedingAudio = totalPages - pagesWithAudio;

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Volume2 size={20} className="text-purple-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-800">Toplu Ses Oluştur</h3>
              <p className="text-sm text-gray-500">{bookTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Status Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-blue-800 text-sm">
              <AlertTriangle size={16} />
              <span>
                <strong>{totalPages}</strong> sayfa mevcut, 
                <strong> {pagesWithAudio}</strong> sayfada ses var, 
                <strong> {pagesNeedingAudio}</strong> sayfada ses yok
              </span>
            </div>
          </div>

          {/* Voice Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ses Seçimi (Tüm Sayfalar İçin)
            </label>
            {isLoadingVoices ? (
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Loader2 size={16} className="animate-spin" />
                Sesler yükleniyor...
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <select
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    disabled={isGenerating}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 bg-white appearance-none pr-10 disabled:opacity-50"
                  >
                    <option value="">Varsayılan Ses (Irem)</option>
                    {voices.map(voice => (
                      <option key={voice.id} value={voice.elevenlabs_id}>
                        {voice.name} {voice.is_default ? '(Varsayılan)' : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                
                {/* Voice Preview */}
                {selectedVoice && (
                  <div className="flex items-center gap-2">
                    {voices.find(v => v.elevenlabs_id === selectedVoice)?.preview_url && (
                      <button
                        onClick={() => handlePlayPreview(voices.find(v => v.elevenlabs_id === selectedVoice))}
                        className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 ${
                          playingPreview === selectedVoice
                            ? 'bg-purple-500 text-white'
                            : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                        }`}
                      >
                        {playingPreview === selectedVoice ? (
                          <><Pause size={14} /> Durdur</>
                        ) : (
                          <><Play size={14} /> Önizle</>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Regenerate Option */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="regenerateAll"
              checked={regenerateAll}
              onChange={(e) => setRegenerateAll(e.target.checked)}
              disabled={isGenerating}
              className="rounded border-gray-300 text-purple-500 focus:ring-purple-500"
            />
            <label htmlFor="regenerateAll" className="text-sm text-gray-700">
              Mevcut sesleri de yeniden oluştur ({totalPages} sayfa)
            </label>
          </div>

          {/* Progress Bar */}
          {(isGenerating || isComplete) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {isGenerating ? 'Oluşturuluyor...' : 'Tamamlandı'}
                </span>
                <span className="font-medium text-gray-800">
                  {progress.current} / {progress.total} ({progressPercentage}%)
                </span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    isComplete 
                      ? results.errors > 0 ? 'bg-yellow-500' : 'bg-green-500'
                      : 'bg-purple-500'
                  }`}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className="flex gap-4 text-sm">
                <span className="text-green-600 flex items-center gap-1">
                  <Check size={14} /> {results.success} başarılı
                </span>
                {results.errors > 0 && (
                  <span className="text-red-600 flex items-center gap-1">
                    <X size={14} /> {results.errors} hata
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Logs */}
          {logs.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700">
                İşlem Günlüğü
              </div>
              <div className="max-h-48 overflow-y-auto p-2 bg-gray-50 font-mono text-xs space-y-1">
                {logs.map((log, idx) => (
                  <div 
                    key={idx} 
                    className={`px-2 py-1 rounded ${
                      log.type === 'success' ? 'bg-green-100 text-green-800' :
                      log.type === 'error' ? 'bg-red-100 text-red-800' :
                      log.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-white text-gray-700'
                    }`}
                  >
                    <span className="text-gray-400 mr-2">[{log.timestamp}]</span>
                    {log.message}
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm flex items-start gap-2">
              <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 rounded-b-2xl flex justify-end gap-3">
          {!isGenerating && !isComplete && (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium"
              >
                İptal
              </button>
              <button
                onClick={startGeneration}
                disabled={isLoadingVoices}
                className="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
              >
                <Volume2 size={18} />
                {regenerateAll ? `${totalPages} Sayfa İçin Oluştur` : `${pagesNeedingAudio} Sayfa İçin Oluştur`}
              </button>
            </>
          )}
          
          {isGenerating && (
            <button
              onClick={stopGeneration}
              className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium flex items-center gap-2"
            >
              <X size={18} />
              Durdur
            </button>
          )}
          
          {isComplete && (
            <>
              <button
                onClick={() => {
                  setIsComplete(false);
                  setLogs([]);
                  setResults({ success: 0, errors: 0 });
                  setProgress({ current: 0, total: 0, status: '' });
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium flex items-center gap-2"
              >
                <RefreshCw size={16} />
                Tekrar Dene
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium flex items-center gap-2"
              >
                <Check size={18} />
                Tamam
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkAudioGenerator;
