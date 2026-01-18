import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Edit, Save, X, Mic, Star, StarOff, 
  Loader2, CheckCircle, AlertCircle, ExternalLink, RefreshCw
} from 'lucide-react';
import { voicesApi } from '../../services/api';

const VoiceAdmin = () => {
  const [voices, setVoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVoice, setEditingVoice] = useState(null);
  const [verifyingId, setVerifyingId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

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

  const handleDelete = async (voiceId) => {
    if (!window.confirm('Bu sesi silmek istediğinize emin misiniz?')) return;

    try {
      await voicesApi.delete(voiceId);
      setVoices(voices.filter(v => v.id !== voiceId));
      setSuccess('Ses silindi');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to delete voice:', err);
      setError('Ses silinirken hata oluştu');
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
    try {
      const result = await voicesApi.verify(voiceId);
      if (result.verified) {
        setVoices(voices.map(v => v.id === voiceId ? { ...v, verified: true } : v));
        setSuccess(`Ses doğrulandı! ElevenLabs adı: ${result.elevenlabs_name}`);
      } else {
        setError(result.message || 'Ses doğrulanamadı');
      }
      setTimeout(() => { setSuccess(null); setError(null); }, 3000);
    } catch (err) {
      console.error('Failed to verify voice:', err);
      setError('Doğrulama başarısız oldu');
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Mic size={24} />
            Ses Yönetimi
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            ElevenLabs seslerini ekleyin ve yönetin
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <Plus size={18} />
          Yeni Ses Ekle
        </button>
      </div>

      {/* Info Box */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
        <h3 className="font-medium text-purple-800 mb-2">ElevenLabs Voice ID Nasıl Bulunur?</h3>
        <ol className="text-sm text-purple-700 space-y-1 list-decimal list-inside">
          <li>
            <a 
              href="https://elevenlabs.io/app/voice-library" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline hover:text-purple-900 inline-flex items-center gap-1"
            >
              ElevenLabs Voice Library'ye gidin <ExternalLink size={12} />
            </a>
          </li>
          <li>Kullanmak istediğiniz sesi bulun ve tıklayın</li>
          <li>Ses detay sayfasında URL'den ID'yi kopyalayın (örn: <code className="bg-purple-100 px-1 rounded">NsFK0aDGLbVusA7tQfOB</code>)</li>
          <li>Veya "ID" butonuna tıklayarak doğrudan kopyalayın</li>
        </ol>
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
          </div>
        ) : (
          <div className="divide-y">
            {voices.map((voice) => (
              <div key={voice.id} className="p-4 hover:bg-gray-50">
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
                          <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                            Doğrulanmamış
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
                        onClick={() => handleDelete(voice.id)}
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

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setShowAddModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-bold text-lg text-gray-800">Yeni Ses Ekle</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ElevenLabs Voice ID *
                </label>
                <input
                  type="text"
                  value={newVoice.elevenlabs_id}
                  onChange={(e) => setNewVoice({ ...newVoice, elevenlabs_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="NsFK0aDGLbVusA7tQfOB"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  ElevenLabs'tan kopyaladığınız Voice ID
                </p>
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
    </div>
  );
};

export default VoiceAdmin;
