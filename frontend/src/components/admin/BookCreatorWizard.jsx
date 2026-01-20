import React, { useState, useEffect } from 'react';
import { 
  X, BookOpen, ChevronRight, ChevronLeft, Plus, Trash2, 
  Loader2, Check, AlertTriangle, Volume2, Upload, Link, 
  Type, Image as ImageIcon, Mic, Wand2, FileText, Play, Pause
} from 'lucide-react';
import { voicesApi } from '../../services/api';
import axios from 'axios';
import ImageUpload from './ImageUpload';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Page separator patterns
const PAGE_SEPARATORS = ['---', '[PAGE]', '===', '***', '[SAYFA]'];

const BookCreatorWizard = ({ onClose, onBookCreated, categories, voices: initialVoices }) => {
  const [step, setStep] = useState(1); // 1: Book Info, 2: Pages, 3: Voice & Audio, 4: Review
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [voices, setVoices] = useState(initialVoices || []);
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);
  
  // Audio preview
  const [playingPreview, setPlayingPreview] = useState(null);
  const [audioRef, setAudioRef] = useState(null);

  // Book metadata
  const [bookInfo, setBookInfo] = useState({
    title: '',
    author: 'Çocuk Kitapları',
    category: categories?.[0]?.slug || 'bizim-masallar',
    coverImage: '',
    description: '',
    ageGroup: '4-6',
    duration: '5 dk',
    isPremium: false,
    isNew: true
  });

  // Pages data
  const [pages, setPages] = useState([
    { id: 1, text: '', imageUrl: '', imageSource: 'upload' }
  ]);

  // Text input mode
  const [textInputMode, setTextInputMode] = useState('manual'); // 'manual' or 'bulk'
  const [bulkText, setBulkText] = useState('');
  const [selectedSeparator, setSelectedSeparator] = useState('---');

  // Voice settings
  const [voiceSettings, setVoiceSettings] = useState({
    defaultVoiceId: '',
    usePerPageVoice: false
  });

  // Audio generation settings
  const [audioSettings, setAudioSettings] = useState({
    generateNow: false, // Generate audio immediately after creating book
  });

  // Fetch voices if not provided
  useEffect(() => {
    if (!initialVoices || initialVoices.length === 0) {
      fetchVoices();
    }
  }, [initialVoices]);

  const fetchVoices = async () => {
    setIsLoadingVoices(true);
    try {
      const response = await voicesApi.getAll();
      setVoices(response.voices || []);
      // Set default voice if available
      const defaultVoice = response.voices?.find(v => v.is_default);
      if (defaultVoice) {
        setVoiceSettings(prev => ({ ...prev, defaultVoiceId: defaultVoice.elevenlabs_id }));
      }
    } catch (err) {
      console.error('Failed to fetch voices:', err);
    } finally {
      setIsLoadingVoices(false);
    }
  };

  // Handle bulk text parsing
  const parseBulkText = () => {
    if (!bulkText.trim()) return;

    const separator = selectedSeparator;
    let textParts;

    if (separator === '[PAGE]' || separator === '[SAYFA]') {
      // Case-insensitive regex for these markers
      const regex = new RegExp(`\\[${separator === '[PAGE]' ? 'PAGE' : 'SAYFA'}\\]`, 'gi');
      textParts = bulkText.split(regex);
    } else {
      textParts = bulkText.split(separator);
    }

    // Filter out empty parts and trim
    const validParts = textParts
      .map(part => part.trim())
      .filter(part => part.length > 0);

    if (validParts.length === 0) {
      setError('Metin ayrıştırılamadı. Ayırıcıyı kontrol edin.');
      return;
    }

    // Create pages from parsed text
    const newPages = validParts.map((text, index) => ({
      id: index + 1,
      text,
      imageUrl: '',
      imageSource: 'upload',
      voiceId: ''
    }));

    setPages(newPages);
    setTextInputMode('manual'); // Switch to manual mode to show pages
    setSuccess(`${newPages.length} sayfa oluşturuldu!`);
    setTimeout(() => setSuccess(null), 3000);
  };

  // Add a new page
  const addPage = () => {
    const newId = Math.max(...pages.map(p => p.id), 0) + 1;
    setPages([...pages, { id: newId, text: '', imageUrl: '', imageSource: 'upload', voiceId: '' }]);
  };

  // Remove a page
  const removePage = (pageId) => {
    if (pages.length <= 1) {
      setError('En az bir sayfa gereklidir');
      setTimeout(() => setError(null), 3000);
      return;
    }
    setPages(pages.filter(p => p.id !== pageId));
  };

  // Update a page
  const updatePage = (pageId, field, value) => {
    setPages(pages.map(p => p.id === pageId ? { ...p, [field]: value } : p));
  };

  // Play voice preview
  const handlePlayPreview = (voice) => {
    if (!voice.preview_url) return;

    if (playingPreview === voice.elevenlabs_id) {
      if (audioRef) {
        audioRef.pause();
        setAudioRef(null);
      }
      setPlayingPreview(null);
    } else {
      if (audioRef) {
        audioRef.pause();
      }
      const audio = new Audio(voice.preview_url);
      audio.onended = () => setPlayingPreview(null);
      audio.play();
      setAudioRef(audio);
      setPlayingPreview(voice.elevenlabs_id);
    }
  };

  // Validation for each step
  const validateStep = (stepNum) => {
    switch (stepNum) {
      case 1:
        if (!bookInfo.title.trim()) {
          setError('Kitap başlığı gereklidir');
          return false;
        }
        if (!bookInfo.coverImage.trim()) {
          setError('Kapak resmi gereklidir');
          return false;
        }
        return true;
      case 2:
        const emptyTextPages = pages.filter(p => !p.text.trim());
        if (emptyTextPages.length > 0) {
          setError(`${emptyTextPages.length} sayfa için metin gereklidir`);
          return false;
        }
        const emptyImagePages = pages.filter(p => !p.imageUrl.trim());
        if (emptyImagePages.length > 0) {
          setError(`${emptyImagePages.length} sayfa için resim gereklidir`);
          return false;
        }
        return true;
      case 3:
        return true; // Voice selection is optional
      default:
        return true;
    }
  };

  // Navigate steps
  const nextStep = () => {
    setError(null);
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setError(null);
    setStep(step - 1);
  };

  // Create the book
  const handleCreateBook = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Step 1: Create the book
      const bookData = {
        ...bookInfo,
        hasAudio: false // Will be set to true after audio generation
      };

      const bookResponse = await axios.post(`${API_URL}/api/books`, bookData);
      const createdBook = bookResponse.data;

      // Step 2: Create all pages
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const pageVoiceId = voiceSettings.usePerPageVoice 
          ? (page.voiceId || voiceSettings.defaultVoiceId)
          : voiceSettings.defaultVoiceId;

        await axios.post(`${API_URL}/api/books/${createdBook.id}/pages`, {
          pageNumber: i + 1,
          text: page.text,
          image: page.imageUrl,
          voiceId: pageVoiceId || null
        });
      }

      // Step 3: Generate audio if requested
      if (audioSettings.generateNow && voiceSettings.defaultVoiceId) {
        setSuccess('Kitap oluşturuldu! Ses dosyaları oluşturuluyor...');
        try {
          await axios.post(`${API_URL}/api/admin/generate-audio/${createdBook.id}`);
        } catch (audioErr) {
          console.error('Audio generation failed:', audioErr);
          // Don't fail the whole operation, just notify
          setError('Kitap oluşturuldu ancak ses oluşturulamadı. Daha sonra deneyebilirsiniz.');
        }
      }

      setSuccess('Kitap başarıyla oluşturuldu!');
      
      // Notify parent and close after delay
      setTimeout(() => {
        if (onBookCreated) onBookCreated(createdBook);
        onClose();
      }, 1500);

    } catch (err) {
      console.error('Error creating book:', err);
      setError(err.response?.data?.detail || 'Kitap oluşturulurken hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step indicators
  const steps = [
    { num: 1, title: 'Kitap Bilgileri', icon: BookOpen },
    { num: 2, title: 'Sayfalar', icon: FileText },
    { num: 3, title: 'Ses Ayarları', icon: Mic },
    { num: 4, title: 'Önizleme', icon: Check }
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl max-h-[95vh] flex flex-col my-4">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <Wand2 size={20} className="text-orange-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-800">Yeni Kitap Oluştur</h3>
              <p className="text-sm text-gray-500">Adım {step} / 4</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        {/* Step Indicators */}
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {steps.map((s, idx) => (
              <React.Fragment key={s.num}>
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    step >= s.num 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    <s.icon size={18} />
                  </div>
                  <span className={`text-xs mt-1 hidden sm:block ${step >= s.num ? 'text-orange-600 font-medium' : 'text-gray-500'}`}>
                    {s.title}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 rounded ${step > s.num ? 'bg-orange-500' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertTriangle size={18} />
            {error}
            <button onClick={() => setError(null)} className="ml-auto">
              <X size={16} />
            </button>
          </div>
        )}
        {success && (
          <div className="mx-6 mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <Check size={18} />
            {success}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Book Info */}
          {step === 1 && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kitap Başlığı *
                </label>
                <input
                  type="text"
                  value={bookInfo.title}
                  onChange={(e) => setBookInfo({ ...bookInfo, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Örn: Küçük Prens'in Maceraları"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Yazar
                  </label>
                  <input
                    type="text"
                    value={bookInfo.author}
                    onChange={(e) => setBookInfo({ ...bookInfo, author: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kategori
                  </label>
                  <select
                    value={bookInfo.category}
                    onChange={(e) => setBookInfo({ ...bookInfo, category: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    {categories?.map(cat => (
                      <option key={cat.slug} value={cat.slug}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kapak Resmi *
                </label>
                <ImageUpload
                  value={bookInfo.coverImage}
                  onChange={(url) => setBookInfo({ ...bookInfo, coverImage: url })}
                  label="Kapak Resmi"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Açıklama
                </label>
                <textarea
                  value={bookInfo.description}
                  onChange={(e) => setBookInfo({ ...bookInfo, description: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Kitap hakkında kısa bir açıklama..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Yaş Grubu
                  </label>
                  <select
                    value={bookInfo.ageGroup}
                    onChange={(e) => setBookInfo({ ...bookInfo, ageGroup: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 bg-white"
                  >
                    <option value="2-4">2-4 yaş</option>
                    <option value="4-6">4-6 yaş</option>
                    <option value="6-8">6-8 yaş</option>
                    <option value="8+">8+ yaş</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Okuma Süresi
                  </label>
                  <input
                    type="text"
                    value={bookInfo.duration}
                    onChange={(e) => setBookInfo({ ...bookInfo, duration: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 bg-white"
                    placeholder="5 dk"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bookInfo.isPremium}
                      onChange={(e) => setBookInfo({ ...bookInfo, isPremium: e.target.checked })}
                      className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700">Premium Kitap</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Pages */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Text Input Mode Toggle */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setTextInputMode('manual')}
                  className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
                    textInputMode === 'manual' 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Type size={18} />
                  Sayfa Sayfa Ekle
                </button>
                <button
                  onClick={() => setTextInputMode('bulk')}
                  className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
                    textInputMode === 'bulk' 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <FileText size={18} />
                  Toplu Metin Yapıştır
                </button>
              </div>

              {textInputMode === 'bulk' ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-2">Toplu Metin Girişi</h4>
                    <p className="text-sm text-blue-700">
                      Hikayenin tamamını yapıştırın. Sayfaları ayırmak için seçtiğiniz ayırıcıyı kullanın.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sayfa Ayırıcısı
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {PAGE_SEPARATORS.map(sep => (
                        <button
                          key={sep}
                          onClick={() => setSelectedSeparator(sep)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-mono ${
                            selectedSeparator === sep
                              ? 'bg-orange-500 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {sep}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hikaye Metni
                    </label>
                    <textarea
                      value={bulkText}
                      onChange={(e) => setBulkText(e.target.value)}
                      rows={12}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-white font-mono text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder={`Bir varmış bir yokmuş, uzak diyarlarda küçük bir kız yaşarmış.\n${selectedSeparator}\nKüçük kız her gün ormana gider, kuşlarla konuşurmuş.\n${selectedSeparator}\nBir gün ormanda parlak bir ışık gördü...`}
                    />
                  </div>

                  <button
                    onClick={parseBulkText}
                    disabled={!bulkText.trim()}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
                  >
                    <Wand2 size={18} />
                    Sayfalara Ayır
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-gray-800">Sayfalar ({pages.length})</h4>
                    <button
                      onClick={addPage}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1"
                    >
                      <Plus size={16} />
                      Sayfa Ekle
                    </button>
                  </div>

                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    {pages.map((page, index) => (
                      <div key={page.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium">
                            Sayfa {index + 1}
                          </span>
                          <button
                            onClick={() => removePage(page.id)}
                            className="text-red-500 hover:bg-red-100 p-1.5 rounded-lg"
                            title="Sayfayı Sil"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Sayfa Metni *
                            </label>
                            <textarea
                              value={page.text}
                              onChange={(e) => updatePage(page.id, 'text', e.target.value)}
                              rows={3}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                              placeholder="Bu sayfanın hikaye metni..."
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Sayfa Resmi *
                            </label>
                            <div className="flex gap-2 mb-2">
                              <button
                                onClick={() => updatePage(page.id, 'imageSource', 'upload')}
                                className={`px-3 py-1 rounded text-xs ${
                                  page.imageSource === 'upload' 
                                    ? 'bg-orange-500 text-white' 
                                    : 'bg-gray-200 text-gray-700'
                                }`}
                              >
                                <Upload size={12} className="inline mr-1" />
                                Yükle
                              </button>
                              <button
                                onClick={() => updatePage(page.id, 'imageSource', 'url')}
                                className={`px-3 py-1 rounded text-xs ${
                                  page.imageSource === 'url' 
                                    ? 'bg-orange-500 text-white' 
                                    : 'bg-gray-200 text-gray-700'
                                }`}
                              >
                                <Link size={12} className="inline mr-1" />
                                URL Gir
                              </button>
                            </div>
                            
                            {page.imageSource === 'upload' ? (
                              <ImageUpload
                                value={page.imageUrl}
                                onChange={(url) => updatePage(page.id, 'imageUrl', url)}
                                label={`Sayfa ${index + 1} Resmi`}
                                compact
                              />
                            ) : (
                              <input
                                type="url"
                                value={page.imageUrl}
                                onChange={(e) => updatePage(page.id, 'imageUrl', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white text-sm"
                                placeholder="https://example.com/image.jpg"
                              />
                            )}
                            
                            {page.imageUrl && (
                              <div className="mt-2">
                                <img 
                                  src={page.imageUrl} 
                                  alt={`Sayfa ${index + 1}`}
                                  className="h-20 w-auto object-cover rounded border"
                                  onError={(e) => e.target.style.display = 'none'}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Voice & Audio */}
          {step === 3 && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                <h4 className="font-medium text-purple-800 mb-2 flex items-center gap-2">
                  <Volume2 size={18} />
                  Ses Ayarları
                </h4>
                <p className="text-sm text-purple-700">
                  Kitap için varsayılan sesi seçin. İsterseniz her sayfa için farklı ses kullanabilirsiniz.
                </p>
              </div>

              {/* Default Voice Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Varsayılan Ses
                </label>
                {isLoadingVoices ? (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Loader2 size={16} className="animate-spin" />
                    Sesler yükleniyor...
                  </div>
                ) : voices.length === 0 ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-700">
                      Henüz ses eklenmemiş. Varsayılan ses (Irem) kullanılacak.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {voices.map(voice => (
                      <div
                        key={voice.id}
                        onClick={() => setVoiceSettings({ ...voiceSettings, defaultVoiceId: voice.elevenlabs_id })}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          voiceSettings.defaultVoiceId === voice.elevenlabs_id
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              voiceSettings.defaultVoiceId === voice.elevenlabs_id
                                ? 'bg-purple-500 text-white'
                                : 'bg-gray-200 text-gray-600'
                            }`}>
                              <Mic size={14} />
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">{voice.name}</p>
                              {voice.description && (
                                <p className="text-xs text-gray-500">{voice.description}</p>
                              )}
                            </div>
                          </div>
                          {voice.preview_url && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handlePlayPreview(voice); }}
                              className={`p-2 rounded-lg transition-colors ${
                                playingPreview === voice.elevenlabs_id
                                  ? 'bg-purple-500 text-white'
                                  : 'hover:bg-purple-100 text-purple-600'
                              }`}
                            >
                              {playingPreview === voice.elevenlabs_id ? (
                                <Pause size={16} />
                              ) : (
                                <Play size={16} />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Per-page voice option */}
              <div className="border-t pt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={voiceSettings.usePerPageVoice}
                    onChange={(e) => setVoiceSettings({ ...voiceSettings, usePerPageVoice: e.target.checked })}
                    className="rounded border-gray-300 text-purple-500 focus:ring-purple-500 w-5 h-5"
                  />
                  <div>
                    <span className="font-medium text-gray-800">Sayfa başına farklı ses kullan</span>
                    <p className="text-sm text-gray-500">Her sayfa için ayrı ses seçebilirsiniz</p>
                  </div>
                </label>
              </div>

              {voiceSettings.usePerPageVoice && (
                <div className="space-y-3 border-t pt-4">
                  <h4 className="font-medium text-gray-800">Sayfa Sesleri</h4>
                  {pages.map((page, index) => (
                    <div key={page.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-sm font-medium">
                        S.{index + 1}
                      </span>
                      <select
                        value={page.voiceId || voiceSettings.defaultVoiceId}
                        onChange={(e) => updatePage(page.id, 'voiceId', e.target.value)}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white text-sm"
                      >
                        <option value="">Varsayılan Ses</option>
                        {voices.map(v => (
                          <option key={v.id} value={v.elevenlabs_id}>{v.name}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}

              {/* Audio generation option */}
              <div className="border-t pt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={audioSettings.generateNow}
                    onChange={(e) => setAudioSettings({ ...audioSettings, generateNow: e.target.checked })}
                    className="rounded border-gray-300 text-purple-500 focus:ring-purple-500 w-5 h-5"
                  />
                  <div>
                    <span className="font-medium text-gray-800">Sesleri hemen oluştur</span>
                    <p className="text-sm text-gray-500">
                      Kitap oluşturulduktan sonra tüm sayfalar için ses dosyaları otomatik oluşturulur
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                  <Check size={18} />
                  Kitap Özeti
                </h4>
                <p className="text-sm text-green-700">
                  Kitabınızı oluşturmadan önce bilgileri kontrol edin.
                </p>
              </div>

              {/* Book Info Summary */}
              <div className="border rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b">
                  <h4 className="font-medium text-gray-800">Kitap Bilgileri</h4>
                </div>
                <div className="p-4">
                  <div className="flex gap-4">
                    {bookInfo.coverImage && (
                      <img 
                        src={bookInfo.coverImage} 
                        alt={bookInfo.title}
                        className="w-24 h-32 object-cover rounded-lg border"
                      />
                    )}
                    <div className="flex-1 space-y-1">
                      <h3 className="font-bold text-lg text-gray-800">{bookInfo.title}</h3>
                      <p className="text-sm text-gray-600">{bookInfo.author}</p>
                      <p className="text-sm text-gray-500">
                        {categories?.find(c => c.slug === bookInfo.category)?.name || bookInfo.category}
                        {' • '}{bookInfo.ageGroup} yaş
                        {' • '}{bookInfo.duration}
                      </p>
                      {bookInfo.isPremium && (
                        <span className="inline-block bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full">
                          Premium
                        </span>
                      )}
                      {bookInfo.description && (
                        <p className="text-sm text-gray-600 mt-2">{bookInfo.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Pages Summary */}
              <div className="border rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b">
                  <h4 className="font-medium text-gray-800">Sayfalar ({pages.length})</h4>
                </div>
                <div className="p-4 space-y-2 max-h-48 overflow-y-auto">
                  {pages.map((page, index) => (
                    <div key={page.id} className="flex items-center gap-3 text-sm">
                      <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs font-medium w-10 text-center">
                        {index + 1}
                      </span>
                      <span className="text-gray-700 truncate flex-1">
                        {page.text.substring(0, 60)}{page.text.length > 60 ? '...' : ''}
                      </span>
                      {page.imageUrl ? (
                        <Check size={14} className="text-green-500" />
                      ) : (
                        <AlertTriangle size={14} className="text-red-500" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Voice Summary */}
              <div className="border rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b">
                  <h4 className="font-medium text-gray-800">Ses Ayarları</h4>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-700">
                    <strong>Varsayılan Ses:</strong>{' '}
                    {voices.find(v => v.elevenlabs_id === voiceSettings.defaultVoiceId)?.name || 'Irem (Varsayılan)'}
                  </p>
                  {voiceSettings.usePerPageVoice && (
                    <p className="text-sm text-gray-500 mt-1">
                      Sayfa başına farklı sesler ayarlandı
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">
                    {audioSettings.generateNow ? (
                      <span className="text-purple-600">✓ Sesler otomatik oluşturulacak</span>
                    ) : (
                      <span>Sesler daha sonra oluşturulabilir</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 rounded-b-2xl flex justify-between items-center">
          <button
            onClick={step === 1 ? onClose : prevStep}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium flex items-center gap-2"
          >
            <ChevronLeft size={18} />
            {step === 1 ? 'İptal' : 'Geri'}
          </button>

          {step < 4 ? (
            <button
              onClick={nextStep}
              className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium flex items-center gap-2"
            >
              İleri
              <ChevronRight size={18} />
            </button>
          ) : (
            <button
              onClick={handleCreateBook}
              disabled={isSubmitting}
              className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Oluşturuluyor...
                </>
              ) : (
                <>
                  <Check size={18} />
                  Kitabı Oluştur
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookCreatorWizard;
