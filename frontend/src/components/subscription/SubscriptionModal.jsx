import React, { useState, useEffect } from 'react';
import { X, Crown, Check, Loader2, Smartphone } from 'lucide-react';
import { isNativeApp, getProducts, purchaseProduct, restorePurchases, PRODUCTS } from '../../services/iapService';

const SubscriptionModal = ({ isOpen, onClose, onSubscriptionComplete }) => {
  const [products, setProducts] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(PRODUCTS.MONTHLY_SUBSCRIPTION);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState(null);
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsNative(isNativeApp());
      setProducts(getProducts());
      setError(null);
    }
  }, [isOpen]);

  const handlePurchase = async () => {
    setIsPurchasing(true);
    setError(null);

    try {
      const result = await purchaseProduct(selectedPlan);
      
      if (result.success) {
        // Purchase initiated or completed
        if (!result.pending) {
          onSubscriptionComplete?.();
          onClose();
        }
        // If pending, the store event handlers will handle completion
      } else {
        setError(result.error || 'Satın alma başarısız oldu');
      }
    } catch (err) {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    setError(null);

    try {
      const result = await restorePurchases();
      if (result.success) {
        onSubscriptionComplete?.();
        onClose();
      } else {
        setError('Satın alma geçmişi bulunamadı');
      }
    } catch (err) {
      setError('Geri yükleme başarısız oldu');
    } finally {
      setIsRestoring(false);
    }
  };

  if (!isOpen) return null;

  const monthlyProduct = products.find(p => p.id === PRODUCTS.MONTHLY_SUBSCRIPTION);
  const yearlyProduct = products.find(p => p.id === PRODUCTS.YEARLY_SUBSCRIPTION);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-400 p-6 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white/20 rounded-full p-2 text-white hover:bg-white/30"
          >
            <X size={20} />
          </button>
          
          <div className="w-16 h-16 bg-white rounded-full mx-auto flex items-center justify-center mb-3 shadow-lg">
            <Crown size={32} className="text-yellow-500" />
          </div>
          <h2 className="text-white text-2xl font-bold">Premium'a Geç</h2>
          <p className="text-white/90 mt-1">Tüm kitaplara sınırsız erişim</p>
        </div>

        {/* Benefits */}
        <div className="p-6">
          <div className="space-y-3 mb-6">
            {[
              'Tüm premium kitaplara erişim',
              'Yeni kitaplar öncelikli',
              'Reklamsız deneyim',
              'Çevrimdışı okuma',
              'Aile paylaşımı (5 profil)'
            ].map((benefit, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check size={14} className="text-green-600" />
                </div>
                <span className="text-gray-700">{benefit}</span>
              </div>
            ))}
          </div>

          {/* Plan Selection */}
          <div className="space-y-3 mb-6">
            {/* Monthly Plan */}
            <button
              onClick={() => setSelectedPlan(PRODUCTS.MONTHLY_SUBSCRIPTION)}
              className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                selectedPlan === PRODUCTS.MONTHLY_SUBSCRIPTION
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-orange-300'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-gray-800">Aylık Plan</p>
                  <p className="text-sm text-gray-500">Her ay yenilenir</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-xl text-gray-800">
                    {monthlyProduct?.price || '₺29.99'}
                  </p>
                  <p className="text-xs text-gray-500">/ay</p>
                </div>
              </div>
            </button>

            {/* Yearly Plan */}
            <button
              onClick={() => setSelectedPlan(PRODUCTS.YEARLY_SUBSCRIPTION)}
              className={`w-full p-4 rounded-2xl border-2 text-left transition-all relative ${
                selectedPlan === PRODUCTS.YEARLY_SUBSCRIPTION
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-orange-300'
              }`}
            >
              <div className="absolute -top-2 right-4 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                %40 İNDİRİM
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-gray-800">Yıllık Plan</p>
                  <p className="text-sm text-gray-500">En tasarruflu seçenek</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-xl text-gray-800">
                    {yearlyProduct?.price || '₺214.99'}
                  </p>
                  <p className="text-xs text-gray-500">/yıl</p>
                </div>
              </div>
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Not Native Warning */}
          {!isNative && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-sm flex items-start gap-2">
              <Smartphone size={18} className="flex-shrink-0 mt-0.5" />
              <span>
                Uygulama içi satın alma için iOS veya Android uygulamamızı kullanın.
              </span>
            </div>
          )}

          {/* Purchase Button */}
          <button
            onClick={handlePurchase}
            disabled={isPurchasing || !isNative}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isPurchasing ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                İşleniyor...
              </>
            ) : (
              <>
                <Crown size={20} />
                {isNative ? 'Şimdi Abone Ol' : 'Uygulamada Satın Al'}
              </>
            )}
          </button>

          {/* Restore Purchases */}
          {isNative && (
            <button
              onClick={handleRestore}
              disabled={isRestoring}
              className="w-full mt-3 py-2 text-orange-600 font-medium text-sm hover:underline disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isRestoring ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Geri yükleniyor...
                </>
              ) : (
                'Satın Almaları Geri Yükle'
              )}
            </button>
          )}

          {/* Terms */}
          <p className="text-xs text-gray-400 text-center mt-4">
            Abonelik otomatik olarak yenilenir. İstediğiniz zaman iptal edebilirsiniz.
            {' '}
            <a href="#" className="underline">Kullanım Koşulları</a>
            {' • '}
            <a href="#" className="underline">Gizlilik Politikası</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal;
