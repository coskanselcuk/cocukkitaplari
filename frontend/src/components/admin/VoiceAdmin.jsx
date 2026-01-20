import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Trash2, Edit, Save, X, Mic, Star, StarOff, 
  Loader2, CheckCircle, AlertCircle, ExternalLink, RefreshCw,
  Download, Play, Pause, Volume2
} from 'lucide-react';
import { voicesApi } from '../../services/api';

const VoiceAdmin = () => {
  const [voices, setVoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showElevenLabsModal, setShowElevenLabsModal] = useState(false);
  const [editingVoice, setEditingVoice] = useState(null);
  const [verifyingId, setVerifyingId] = useState(null);
  const [deletingVoice, setDeletingVoice] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // ElevenLabs voices state
  const [elevenLabsVoices, setElevenLabsVoices] = useState([]);
  const [isLoadingEL, setIsLoadingEL] = useState(false);
  const [importingVoiceId, setImportingVoiceId] = useState(null);
  const [playingPreview, setPlayingPreview] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const audioRef = useRef(null);

  // New voice form
  const [newVoice, setNewVoice] = useState({
    elevenlabs_id: '',
    name: '',
    description: '',
    is_default: false
  });

  useEffect(() => {
    fetchVoices();
  }, []);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const fetchVoices = async () => {
    setIsLoading(true);
    try {
      const data = await voicesApi.getAll();
      setVoices(data.voices || []);
    } catch (err) {
      console.error('Failed to fetch voices:', err);
      setError('Sesler yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchElevenLabsVoices = async () => {
    setIsLoadingEL(true);
    setError(null);
    try {
      const data = await voicesApi.fetchFromElevenLabs();
      setElevenLabsVoices(data.voices || []);
      setShowElevenLabsModal(true);
    } catch (err) {
      console.error('Failed to fetch ElevenLabs voices:', err);
      setError(err.response?.data?.detail || 'ElevenLabs sesleri alınamadı. API anahtarını kontrol edin.');
    } finally {
      setIsLoadingEL(false);
    }
  };

  const handleImportVoice = async (voice) => {
    setImportingVoiceId(voice.voice_id);
    try {
      const imported = await voicesApi.importFromElevenLabs(voice);
      setVoices([imported, ...voices]);
      // Update the ElevenLabs list to show it's added
      setElevenLabsVoices(elevenLabsVoices.map(v => 
        v.voice_id === voice.voice_id ? { ...v, already_added: true } : v
      ));
      setSuccess(`"${voice.name}" başarıyla eklendi!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to import voice:', err);
      setError(err.response?.data?.detail || 'Ses eklenirken hata oluştu');
    } finally {
      setImportingVoiceId(null);
    }
  };

  const handlePlayPreview = (voice) => {
    if (!voice.preview_url) return;

    if (playingPreview === voice.voice_id) {
      // Stop playing
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPlayingPreview(null);
    } else {
      // Stop any current audio
      if (audioRef.current) {
        audioRef.current.pause();
      }
      // Play new audio
      audioRef.current = new Audio(voice.preview_url);
      audioRef.current.onended = () => setPlayingPreview(null);
      audioRef.current.onerror = () => {
        setPlayingPreview(null);
        setError('Önizleme yüklenemedi');
        setTimeout(() => setError(null), 3000);
      };
      audioRef.current.play();
      setPlayingPreview(voice.voice_id);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    
    if (!newVoice.elevenlabs_id.trim()) {
      setError('ElevenLabs Voice ID gereklidir');
      return;
    }
    if (!newVoice.name.trim()) {
      setError('Ses adı gereklidir');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const created = await voicesApi.create(newVoice);
      setVoices([created, ...voices]);
      setShowAddModal(false);
      setNewVoice({ elevenlabs_id: '', name: '', description: '', is_default: false });
      setSuccess('Ses başarıyla eklendi!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to create voice:', err);
      setError(err.response?.data?.detail || 'Ses eklenirken hata oluştu');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingVoice) return;

    setIsSaving(true);
    setError(null);

    try {
      const updated = await voicesApi.update(editingVoice.id, {
        name: editingVoice.name,
        description: editingVoice.description
      });
      setVoices(voices.map(v => v.id === editingVoice.id ? updated : v));
      setEditingVoice(null);
      setSuccess('Ses güncellendi!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to update voice:', err);
      setError('Ses güncellenirken hata oluştu');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingVoice) return;
    
    try {
      await voicesApi.delete(deletingVoice.id);
      setVoices(voices.filter(v => v.id !== deletingVoice.id));
      setSuccess('Ses silindi');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to delete voice:', err);
      setError('Ses silinirken hata oluştu');
    } finally {
      setDeletingVoice(null);
    }
  };

  const handleSetDefault = async (voiceId) => {
    try {
      await voicesApi.setDefault(voiceId);
      setVoices(voices.map(v => ({
        ...v,
        is_default: v.id === voiceId
      })));
      setSuccess('Varsayılan ses güncellendi');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to set default:', err);
      setError('Varsayılan ses ayarlanırken hata oluştu');
    }
  };

  const handleVerify = async (voiceId) => {
    setVerifyingId(voiceId);
    setError(null);
    try {
      const result = await voicesApi.verify(voiceId);
      if (result.verified) {
        setVoices(voices.map(v => v.id === voiceId ? { ...v, verified: true } : v));
        setSuccess(`Ses doğrulandı! ElevenLabs adı: ${result.elevenlabs_name}`);
      } else {
        setError(result.message || 'Ses ElevenLabs\'te bulunamadı. Voice ID\'yi kontrol edin.');
      }
      setTimeout(() => { setSuccess(null); setError(null); }, 5000);
    } catch (err) {
      console.error('Failed to verify voice:', err);
      setError(err.response?.data?.detail || 'Doğrulama başarısız oldu. Voice ID\'yi kontrol edin.');
    } finally {
      setVerifyingId(null);
    }
  };

  // Filter ElevenLabs voices by search
  const filteredELVoices = elevenLabsVoices.filter(v => 
    v.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    Object.values(v.labels || {}).some(label => 
      label?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Mic size={24} />
            Ses Yönetimi
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            ElevenLabs seslerini ekleyin ve yönetin
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchElevenLabsVoices}
            disabled={isLoadingEL}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
            data-testid="fetch-elevenlabs-btn"
          >
            {isLoadingEL ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Download size={18} />
            )}
            ElevenLabs&apos;tan Al
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
            data-testid="add-voice-btn"
          >
            <Plus size={18} />
            Manuel Ekle
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle size={18} />
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={18} />
          {error}
          <button onClick={() => setError(null)} className="ml-auto">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Voices List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin text-gray-400" />
          </div>
        ) : voices.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Mic size={48} className="mx-auto mb-3 text-gray-300" />
            <p className="font-medium">Henüz ses eklenmemiş</p>
            <p className="text-sm mt-1">Varsayılan ses (Irem) kullanılacak</p>
            <button
              onClick={fetchElevenLabsVoices}
              disabled={isLoadingEL}
              className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium inline-flex items-center gap-2"
            >
              {isLoadingEL ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Download size={18} />
              )}
              ElevenLabs Seslerini Getir
            </button>
          </div>
        ) : (
          <div className="divide-y">
            {voices.map((voice) => (
              <div key={voice.id} className="p-4 hover:bg-gray-50" data-testid={`voice-item-${voice.id}`}>
                {editingVoice?.id === voice.id ? (
                  // Edit mode
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editingVoice.name}
                      onChange={(e) => setEditingVoice({ ...editingVoice, name: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white"
                      placeholder="Ses adı"
                    />
                    <input
                      type="text"
                      value={editingVoice.description}
                      onChange={(e) => setEditingVoice({ ...editingVoice, description: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white"
                      placeholder="Açıklama (opsiyonel)"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingVoice(null)}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                      >
                        İptal
                      </button>
                      <button
                        onClick={handleUpdate}
                        disabled={isSaving}
                        className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-1"
                      >
                        {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        Kaydet
                      </button>
                    </div>
                  </div>
                ) : (
                  // View mode
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                      voice.is_default ? 'bg-yellow-100' : 'bg-purple-100'
                    }`}>
                      <Mic size={24} className={voice.is_default ? 'text-yellow-600' : 'text-purple-600'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-800">{voice.name}</h3>
                        {voice.is_default && (
                          <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Star size={10} /> Varsayılan
                          </span>
                        )}
                        {voice.verified ? (
                          <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle size={10} /> Doğrulanmış
                          </span>
                        ) : (
                          <span className="bg-orange-100 text-orange-600 text-xs px-2 py-0.5 rounded-full">
                            Doğrulanmamış
                          </span>
                        )}
                        {voice.category && (
                          <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                            {voice.category}
                          </span>
                        )}
                      </div>
                      {voice.description && (
                        <p className="text-sm text-gray-600 mt-1">{voice.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1 font-mono">
                        ID: {voice.elevenlabs_id}
                      </p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {voice.preview_url && (
                        <button
                          onClick={() => handlePlayPreview(voice)}
                          className="p-2 hover:bg-purple-100 rounded-lg text-purple-600"
                          title="Önizle"
                        >
                          {playingPreview === voice.id ? (
                            <Pause size={16} />
                          ) : (
                            <Play size={16} />
                          )}
                        </button>
                      )}
                      {!voice.verified && (
                        <button
                          onClick={() => handleVerify(voice.id)}
                          disabled={verifyingId === voice.id}
                          className="p-2 hover:bg-green-100 rounded-lg text-green-600 disabled:opacity-50"
                          title="Doğrula"
                        >
                          {verifyingId === voice.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <RefreshCw size={16} />
                          )}
                        </button>
                      )}
                      {!voice.is_default && (
                        <button
                          onClick={() => handleSetDefault(voice.id)}
                          className="p-2 hover:bg-yellow-100 rounded-lg text-yellow-600"
                          title="Varsayılan yap"
                        >
                          <StarOff size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => setEditingVoice(voice)}
                        className="p-2 hover:bg-blue-100 rounded-lg text-blue-600"
                        title="Düzenle"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => setDeletingVoice(voice)}
                        className="p-2 hover:bg-red-100 rounded-lg text-red-600"
                        title="Sil"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ElevenLabs Voices Modal */}
      {showElevenLabsModal && (
        <div 
          className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4" 
          onClick={(e) => e.target === e.currentTarget && setShowElevenLabsModal(false)}
        >
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl max-h-[85vh] flex flex-col">
            <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
              <div>
                <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                  <Volume2 size={20} className="text-blue-500" />
                  ElevenLabs Sesleriniz
                </h3>
                <p className="text-sm text-gray-500">{elevenLabsVoices.length} ses bulundu</p>
              </div>
              <button
                onClick={() => {
                  setShowElevenLabsModal(false);
                  if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current = null;
                  }
                  setPlayingPreview(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b">
              <input
                type="text"
                placeholder="Ses ara (isim, kategori, etiket)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Voices List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredELVoices.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Mic size={40} className="mx-auto mb-2 text-gray-300" />
                  <p>Ses bulunamadı</p>
                </div>
              ) : (
                filteredELVoices.map((voice) => (
                  <div 
                    key={voice.voice_id} 
                    className={`border rounded-xl p-4 transition-colors ${
                      voice.already_added 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-white hover:bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Mic size={20} className="text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-gray-800">{voice.name}</h4>
                          {voice.category && (
                            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                              {voice.category}
                            </span>
                          )}
                          {voice.already_added && (
                            <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle size={10} /> Eklendi
                            </span>
                          )}
                        </div>
                        {voice.labels && Object.keys(voice.labels).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {Object.entries(voice.labels).map(([key, value]) => (
                              <span key={key} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded">
                                {value}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-gray-400 mt-1 font-mono">
                          {voice.voice_id}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        {voice.preview_url && (
                          <button
                            onClick={() => handlePlayPreview(voice)}
                            className={`p-2 rounded-lg transition-colors ${
                              playingPreview === voice.voice_id
                                ? 'bg-blue-500 text-white'
                                : 'hover:bg-blue-100 text-blue-600'
                            }`}
                            title="Önizle"
                          >
                            {playingPreview === voice.voice_id ? (
                              <Pause size={18} />
                            ) : (
                              <Play size={18} />
                            )}
                          </button>
                        )}
                        {!voice.already_added && (
                          <button
                            onClick={() => handleImportVoice(voice)}
                            disabled={importingVoiceId === voice.voice_id}
                            className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-1 text-sm font-medium"
                          >
                            {importingVoiceId === voice.voice_id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Plus size={16} />
                            )}
                            Ekle
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-gray-50 rounded-b-2xl">
              <p className="text-xs text-gray-500 text-center">
                <a 
                  href="https://elevenlabs.io/app/voice-library" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline inline-flex items-center gap-1"
                >
                  ElevenLabs Voice Library&apos;ye git <ExternalLink size={10} />
                </a>
                {' '}daha fazla ses eklemek için
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal (Manual) */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setShowAddModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white">
              <h3 className="font-bold text-lg text-gray-800">Manuel Ses Ekle</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            {/* Info Box */}
            <div className="mx-4 mt-4 bg-purple-50 border border-purple-200 rounded-xl p-3">
              <h4 className="font-medium text-purple-800 text-sm mb-1">Voice ID Nasıl Bulunur?</h4>
              <ol className="text-xs text-purple-700 space-y-0.5 list-decimal list-inside">
                <li>
                  <a 
                    href="https://elevenlabs.io/app/voice-lab" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline hover:text-purple-900"
                  >
                    My Voices sayfasına gidin
                  </a>
                </li>
                <li>Sesin üzerindeki &quot;ID&quot; butonuna tıklayın</li>
              </ol>
            </div>

            <form onSubmit={handleCreate} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ElevenLabs Voice ID *
                </label>
                <input
                  type="text"
                  value={newVoice.elevenlabs_id}
                  onChange={(e) => setNewVoice({ ...newVoice, elevenlabs_id: e.target.value.trim() })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="e79twtVS2278lVZZQiAD"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ses Adı *
                </label>
                <input
                  type="text"
                  value={newVoice.name}
                  onChange={(e) => setNewVoice({ ...newVoice, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Örn: Ahmet - Erkek Çocuk"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Açıklama (opsiyonel)
                </label>
                <input
                  type="text"
                  value={newVoice.description}
                  onChange={(e) => setNewVoice({ ...newVoice, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Örn: Enerjik, neşeli çocuk sesi"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={newVoice.is_default}
                  onChange={(e) => setNewVoice({ ...newVoice, is_default: e.target.checked })}
                  className="rounded border-gray-300 text-purple-500 focus:ring-purple-500"
                />
                <label htmlFor="is_default" className="text-sm text-gray-700">
                  Varsayılan ses olarak ayarla
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Ekleniyor...
                    </>
                  ) : (
                    <>
                      <Plus size={18} />
                      Ses Ekle
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingVoice && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 size={24} className="text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-800">Sesi Sil</h3>
                <p className="text-sm text-gray-500">Bu işlem geri alınamaz</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              <strong>"{deletingVoice.name}"</strong> sesini silmek istediğinize emin misiniz?
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingVoice(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
              >
                İptal
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium flex items-center justify-center gap-2"
              >
                <Trash2 size={16} />
                Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceAdmin;
