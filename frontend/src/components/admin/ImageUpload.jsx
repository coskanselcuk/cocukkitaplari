import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Image, Loader2, Link, Check } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ImageUpload = ({ 
  value, 
  onChange, 
  label = "Resim", 
  placeholder = "Resim yükleyin veya URL girin",
  className = ""
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [mode, setMode] = useState('upload'); // 'upload' or 'url'
  const fileInputRef = useRef(null);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      uploadFile(file);
    }
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      uploadFile(file);
    }
  };

  const uploadFile = async (file) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Sadece JPG, PNG, GIF, WEBP dosyaları yüklenebilir');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Dosya boyutu 10MB\'dan küçük olmalı');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API_URL}/api/upload/image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Construct full URL for the uploaded image
      const imageUrl = `${API_URL}${response.data.url}`;
      onChange(imageUrl);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error.response?.data?.detail || 'Yükleme başarısız oldu');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlChange = (e) => {
    setUploadError(null);
    onChange(e.target.value);
  };

  const clearImage = () => {
    onChange('');
    setUploadError(null);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-2 py-1 text-xs rounded-md transition-colors ${
              mode === 'upload' 
                ? 'bg-white text-gray-800 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Upload size={12} className="inline mr-1" />
            Yükle
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-2 py-1 text-xs rounded-md transition-colors ${
              mode === 'url' 
                ? 'bg-white text-gray-800 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Link size={12} className="inline mr-1" />
            URL
          </button>
        </div>
      </div>

      {mode === 'upload' ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer
            transition-all duration-200
            ${isDragging 
              ? 'border-orange-500 bg-orange-50' 
              : 'border-gray-300 hover:border-orange-400 hover:bg-orange-50/50'
            }
            ${isUploading ? 'pointer-events-none opacity-70' : ''}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />

          {isUploading ? (
            <div className="flex flex-col items-center gap-2 py-2">
              <Loader2 size={24} className="animate-spin text-orange-500" />
              <span className="text-sm text-gray-500">Yükleniyor...</span>
            </div>
          ) : value ? (
            <div className="relative">
              <img 
                src={value} 
                alt="Preview" 
                className="max-h-32 mx-auto rounded-lg object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  clearImage();
                }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-md"
              >
                <X size={14} />
              </button>
              <div className="flex items-center justify-center gap-1 mt-2 text-xs text-green-600">
                <Check size={12} />
                <span>Resim yüklendi</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-2">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <Image size={24} className="text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Resim sürükleyin veya tıklayın
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  JPG, PNG, GIF, WEBP • Maks 10MB
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <input
            type="text"
            value={value}
            onChange={handleUrlChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            placeholder={placeholder}
          />
          {value && (
            <div className="relative inline-block">
              <img 
                src={value} 
                alt="Preview" 
                className="max-h-24 rounded-lg object-contain border"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}
        </div>
      )}

      {uploadError && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <X size={12} />
          {uploadError}
        </p>
      )}
    </div>
  );
};

export default ImageUpload;
