import React from 'react';
import { X, User, Lock, Mail, ArrowRight } from 'lucide-react';

const CreateProfileModal = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = React.useState('');
  const [age, setAge] = React.useState('');
  const [selectedColor, setSelectedColor] = React.useState('bg-pink-400');

  const colorOptions = [
    'bg-pink-400', 'bg-blue-400', 'bg-green-400', 'bg-purple-400', 
    'bg-orange-400', 'bg-teal-400', 'bg-red-400', 'bg-yellow-400',
    'bg-indigo-400', 'bg-cyan-400', 'bg-rose-400', 'bg-emerald-400'
  ];

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (name && age) {
      onSave({ name, age: parseInt(age), avatarColor: selectedColor });
      setName('');
      setAge('');
      setSelectedColor('bg-pink-400');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">Yeni Profil Oluştur</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Avatar Color Selection */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">Renk Seç</label>
          <div className="flex flex-wrap gap-3">
            {colorOptions.map((color, index) => (
              <button
                key={index}
                onClick={() => setSelectedColor(color)}
                className={`w-10 h-10 rounded-full ${color} transition-all duration-300 ${
                  selectedColor === color 
                    ? 'ring-2 ring-offset-2 ring-orange-500 scale-110' 
                    : 'hover:scale-105'
                }`}
              />
            ))}
          </div>
          
          {/* Preview */}
          <div className="mt-4 flex justify-center">
            <div className={`w-20 h-20 ${selectedColor} rounded-full flex items-center justify-center shadow-lg`}>
              <span className="text-white text-2xl font-bold">
                {name ? name.charAt(0).toUpperCase() : '?'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Name Input */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">İsim</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Çocuğunuzun adı"
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
        </div>
        
        {/* Age Input */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Yaş</label>
          <select
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 appearance-none bg-white"
          >
            <option value="">Yaş seçin</option>
            {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(a => (
              <option key={a} value={a}>{a} yaş</option>
            ))}
          </select>
        </div>
        
        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!name || !age}
          className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 ${
            name && age 
              ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-lg hover:shadow-xl' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          Profil Oluştur
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default CreateProfileModal;
