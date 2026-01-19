import React, { useState, useEffect } from 'react';
import { X, Crown, Check, Loader2, Smartphone, RefreshCw, ExternalLink, Gift, Clock } from 'lucide-react';
import { 
  isNativeApp, 
  getProducts, 
  purchaseProduct, 
  restorePurchases, 
  manageSubscription,
  startFreeTrial,
  getTrialStatus,
  PRODUCTS 
} from '../../services/iapService';
import { useAuth } from '../../contexts/AuthContext';

const SubscriptionModal = ({ isOpen, onClose, onSubscriptionComplete }) => {
  const { user, isAuthenticated } = useAuth();
  const [products, setProducts] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(PRODUCTS.MONTHLY_SUBSCRIPTION);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isStartingTrial, setIsStartingTrial] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isNative, setIsNative] = useState(false);
  const [trialStatus, setTrialStatus] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setIsNative(isNativeApp());
      setProducts(getProducts());
      setError(null);
      setSuccessMessage(null);
      
      // Fetch trial status if authenticated
      if (isAuthenticated && user?.user_id) {
        fetchTrialStatus();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isAuthenticated, user?.user_id]);

  const fetchTrialStatus = async () => {
    if (!user?.user_id) return;
    const status = await getTrialStatus(user.user_id);
    setTrialStatus(status);
  };

  const handleStartTrial = async () => {
    if (!isAuthenticated || !user?.user_id) {
      setError('Ücretsiz deneme için giriş yapmanız gerekiyor');
      return;
    }

    setIsStartingTrial(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await startFreeTrial(user.user_id);
      
      if (result.success) {
        setSuccessMessage(result.message || '7 günlük ücretsiz denemeniz başladı!');
        setTimeout(() => {
          onSubscriptionComplete?.();
          onClose();
        }, 2000);
      } else {
        setError(result.error || 'Deneme başlatılamadı');
      }
    } catch (err) {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsStartingTrial(false);
    }
  };

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      setError('Satın alma için giriş yapmanız gerekiyor');
      return;
    }

    setIsPurchasing(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await purchaseProduct(selectedPlan);
      
      if (result.cancelled) {
        setIsPurchasing(false);
        return;
      }
      
      if (result.success) {
        if (!result.pending) {
          setSuccessMessage('Abonelik başarıyla tamamlandı!');
          setTimeout(() => {
            onSubscriptionComplete?.();
            onClose();
          }, 1500);
        }
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
    if (!isAuthenticated) {
      setError('Geri yükleme için giriş yapmanız gerekiyor');
      return;
    }

    setIsRestoring(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await restorePurchases();
      
      if (result.success && result.hasSubscription) {
        setSuccessMessage('Satın almalar başarıyla geri yüklendi!');
        setTimeout(() => {
          onSubscriptionComplete?.();
          onClose();
        }, 1500);
      } else if (result.success) {
        setError('Geri yüklenecek satın alma bulunamadı');
      } else {
        setError(result.error || 'Geri yükleme başarısız oldu');
      }
    } catch (err) {
      setError('Geri yükleme başarısız oldu');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleManageSubscription = () => {
    manageSubscription();
  };

  if (!isOpen) return null;

  const monthlyProduct = products.find(p => p.id === PRODUCTS.MONTHLY_SUBSCRIPTION);
  const yearlyProduct = products.find(p => p.id === PRODUCTS.YEARLY_SUBSCRIPTION);

  // Check if user already has premium or is in trial
  const isPremium = user?.subscription_tier === 'premium';
  const isInTrial = trialStatus?.is_trial;
  const canStartTrial = trialStatus?.can_start_trial && !isPremium;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-400 p-6 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white/20 rounded-full p-2 text-white hover:bg-white/30 transition-colors"
            data-testid="close-subscription-modal"
          >
            <X size={20} />
          </button>
          
          <div className="w-16 h-16 bg-white rounded-full mx-auto flex items-center justify-center mb-3 shadow-lg">
            <Crown size={32} className="text-yellow-500" />
          </div>
          <h2 className="text-white text-2xl font-bold">
            {isPremium ? 'Premium Üyelik' : "Premium'a Geç"}
          </h2>
          <p className="text-white/90 mt-1">
            {isPremium 
              ? (isInTrial ? `Deneme süresi: ${trialStatus?.days_remaining} gün kaldı` : 'Aktif aboneliğinizi yönetin')
              : 'Tüm kitaplara sınırsız erişim'}
          </p>
        </div>

        <div className="p-6">
          {/* Already Premium */}
          {isPremium ? (
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full mx-auto flex items-center justify-center mb-4">
                <Check size={40} className="text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {isInTrial ? 'Deneme Süreniz Aktif!' : 'Premium Üyesiniz!'}
              </h3>
              <p className="text-gray-600 mb-4">Tüm kitaplara sınırsız erişiminiz var.</p>
              
              {isInTrial && trialStatus?.days_remaining !== undefined && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                  <div className="flex items-center justify-center gap-2 text-amber-700 mb-2">
                    <Clock size={20} />
                    <span className="font-semibold">{trialStatus.days_remaining} gün kaldı</span>
                  </div>
                  <p className="text-sm text-amber-600">
                    Deneme süreniz bitince premium özelliklere erişiminiz sona erecek.
                  </p>
                </div>
              )}
              
              {isInTrial && (
                <div className="space-y-3 mb-4">
                  <p className="text-sm text-gray-500 mb-2">Deneme sonrasına hazırlanın:</p>
                  {/* Plan Selection for trial users */}
                  <button
                    onClick={() => setSelectedPlan(PRODUCTS.MONTHLY_SUBSCRIPTION)}
                    className={`w-full p-3 rounded-xl border-2 text-left transition-all text-sm ${
                      selectedPlan === PRODUCTS.MONTHLY_SUBSCRIPTION
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-800">Aylık</span>
                      <span className="font-bold text-gray-800">{monthlyProduct?.price || '₺29.99'}/ay</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setSelectedPlan(PRODUCTS.YEARLY_SUBSCRIPTION)}
                    className={`w-full p-3 rounded-xl border-2 text-left transition-all text-sm relative ${
                      selectedPlan === PRODUCTS.YEARLY_SUBSCRIPTION
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    <div className="absolute -top-2 right-3 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      %40 İNDİRİM
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-800">Yıllık</span>
                      <span className="font-bold text-gray-800">{yearlyProduct?.price || '₺214.99'}/yıl</span>
                    </div>
                  </button>
                  
                  {isNative && (
                    <button
                      onClick={handlePurchase}
                      disabled={isPurchasing}
                      className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isPurchasing ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          İşleniyor...
                        </>
                      ) : (
                        'Şimdi Abone Ol'
                      )}
                    </button>
                  )}
                </div>
              )}
              
              {isNative && !isInTrial && (
                <button
                  onClick={handleManageSubscription}
                  className="w-full py-3 border-2 border-orange-500 text-orange-600 font-semibold rounded-2xl flex items-center justify-center gap-2 hover:bg-orange-50 transition-colors"
                >
                  <ExternalLink size={18} />
                  Aboneliği Yönet
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Benefits */}
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

              {/* Free Trial CTA - Only show if user can start trial */}
              {canStartTrial && isAuthenticated && (
                <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Gift size={20} className="text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800">7 Gün Ücretsiz Dene!</h4>
                      <p className="text-sm text-gray-600">Kredi kartı gerekmez</p>
                    </div>
                  </div>
                  <button
                    onClick={handleStartTrial}
                    disabled={isStartingTrial}
                    className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    data-testid="start-trial-button"
                  >
                    {isStartingTrial ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Başlatılıyor...
                      </>
                    ) : (
                      <>
                        <Gift size={18} />
                        Ücretsiz Denemeyi Başlat
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Trial already used message */}
              {trialStatus?.trial_used && !isPremium && (
                <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 text-sm">
                  Ücretsiz deneme hakkınızı daha önce kullandınız.
                </div>
              )}

              {/* Divider */}
              {canStartTrial && isAuthenticated && (
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex-1 h-px bg-gray-200"></div>
                  <span className="text-sm text-gray-400">veya</span>
                  <div className="flex-1 h-px bg-gray-200"></div>
                </div>
              )}

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
                  data-testid="monthly-plan-button"
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
                  data-testid="yearly-plan-button"
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

              {/* Success Message */}
              {successMessage && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm flex items-center gap-2">
                  <Check size={18} />
                  {successMessage}
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}

              {/* Not Authenticated Warning */}
              {!isAuthenticated && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
                  Satın alma veya deneme için önce giriş yapmanız gerekiyor.
                </div>
              )}

              {/* Not Native Warning */}
              {!isNative && isAuthenticated && !canStartTrial && (
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
                disabled={isPurchasing || (!isNative && !canStartTrial) || !isAuthenticated}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                data-testid="subscribe-button"
              >
                {isPurchasing ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    İşleniyor...
                  </>
                ) : (
                  <>
                    <Crown size={20} />
                    {!isAuthenticated 
                      ? 'Giriş Yapın' 
                      : isNative 
                        ? 'Şimdi Abone Ol' 
                        : 'Uygulamada Satın Al'
                    }
                  </>
                )}
              </button>

              {/* Restore Purchases */}
              {isNative && (
                <button
                  onClick={handleRestore}
                  disabled={isRestoring || !isAuthenticated}
                  className="w-full mt-3 py-3 text-orange-600 font-medium text-sm hover:bg-orange-50 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                  data-testid="restore-purchases-button"
                >
                  {isRestoring ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Geri yükleniyor...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={16} />
                      Satın Almaları Geri Yükle
                    </>
                  )}
                </button>
              )}

              {/* Terms */}
              <p className="text-xs text-gray-400 text-center mt-4">
                Abonelik otomatik olarak yenilenir. İstediğiniz zaman iptal edebilirsiniz.
                {' '}
                <a href="#" className="underline hover:text-gray-600">Kullanım Koşulları</a>
                {' • '}
                <a href="#" className="underline hover:text-gray-600">Gizlilik Politikası</a>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal;
