/**
 * In-App Purchase Service for Çocuk Kitapları
 * Uses cordova-plugin-purchase for native iOS/Android purchases
 * Integrates with backend for purchase verification and user sync
 */

import api from './api';

// Product IDs - these must match your App Store Connect / Google Play Console setup
export const PRODUCTS = {
  MONTHLY_SUBSCRIPTION: 'cocukkitaplari_premium_monthly',
  YEARLY_SUBSCRIPTION: 'cocukkitaplari_premium_yearly'
};

// Check if running in native app
export const isNativeApp = () => {
  return window.Capacitor?.isNativePlatform() || false;
};

// Get current platform
export const getPlatform = () => {
  if (!isNativeApp()) return 'web';
  
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  if (/iPad|iPhone|iPod/.test(userAgent)) return 'ios';
  return 'android';
};

// Store reference for callbacks
let storeInstance = null;
let purchaseCallback = null;

// Initialize the store
export const initializeStore = (onPurchaseUpdate) => {
  if (!isNativeApp()) {
    console.log('Not running in native app, IAP disabled');
    return false;
  }

  purchaseCallback = onPurchaseUpdate;

  // Wait for device ready
  document.addEventListener('deviceready', () => {
    if (!window.CdvPurchase) {
      console.error('CdvPurchase not available');
      return;
    }

    const { store, ProductType, Platform } = window.CdvPurchase;
    storeInstance = store;

    // Enable debug logging in development
    store.verbosity = store.DEBUG;

    // Register products for both platforms
    store.register([
      {
        id: PRODUCTS.MONTHLY_SUBSCRIPTION,
        type: ProductType.PAID_SUBSCRIPTION,
        platform: Platform.APPLE_APPSTORE
      },
      {
        id: PRODUCTS.MONTHLY_SUBSCRIPTION,
        type: ProductType.PAID_SUBSCRIPTION,
        platform: Platform.GOOGLE_PLAY
      },
      {
        id: PRODUCTS.YEARLY_SUBSCRIPTION,
        type: ProductType.PAID_SUBSCRIPTION,
        platform: Platform.APPLE_APPSTORE
      },
      {
        id: PRODUCTS.YEARLY_SUBSCRIPTION,
        type: ProductType.PAID_SUBSCRIPTION,
        platform: Platform.GOOGLE_PLAY
      }
    ]);

    // Handle purchase updates
    store.when()
      .approved(async (transaction) => {
        console.log('Purchase approved:', transaction);
        
        // Verify with our backend
        try {
          await verifyPurchaseWithBackend(transaction);
          transaction.verify();
        } catch (error) {
          console.error('Backend verification failed:', error);
          // Still verify locally to complete the transaction
          transaction.verify();
        }
      })
      .verified(async (receipt) => {
        console.log('Purchase verified:', receipt);
        receipt.finish();
        
        if (purchaseCallback) {
          purchaseCallback({ 
            success: true, 
            receipt,
            message: 'Satın alma başarılı!'
          });
        }
      })
      .finished((transaction) => {
        console.log('Purchase finished:', transaction);
      })
      .unverified((receipt) => {
        console.error('Purchase unverified:', receipt);
        if (purchaseCallback) {
          purchaseCallback({ 
            success: false, 
            error: 'Doğrulama başarısız oldu. Lütfen tekrar deneyin.' 
          });
        }
      });

    // Handle purchase errors
    store.error((error) => {
      console.error('Store error:', error);
      if (purchaseCallback && error.code !== 'E_USER_CANCELLED') {
        purchaseCallback({
          success: false,
          error: error.message || 'Bir hata oluştu'
        });
      }
    });

    // Initialize store with appropriate platforms
    const platforms = [];
    if (getPlatform() === 'ios') {
      platforms.push(Platform.APPLE_APPSTORE);
    } else {
      platforms.push(Platform.GOOGLE_PLAY);
    }

    store.initialize(platforms).then(() => {
      console.log('Store initialized');
      store.update();
    }).catch((error) => {
      console.error('Store initialization failed:', error);
    });

  }, false);

  return true;
};

// Verify purchase with backend
async function verifyPurchaseWithBackend(transaction) {
  const userId = localStorage.getItem('user_id');
  if (!userId) {
    console.log('No user ID, skipping backend verification');
    return;
  }

  const platform = getPlatform();
  
  const verificationData = {
    user_id: userId,
    platform: platform,
    product_id: transaction.products[0]?.id || transaction.productId,
    transaction_id: transaction.transactionId || transaction.id,
    receipt_data: platform === 'ios' 
      ? transaction.appStoreReceipt || ''
      : transaction.purchaseToken || ''
  };

  try {
    const response = await api.post('/subscriptions/verify-purchase', verificationData);
    console.log('Backend verification successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('Backend verification error:', error);
    throw error;
  }
}

// Get product info
export const getProducts = () => {
  if (!isNativeApp() || !window.CdvPurchase || !storeInstance) {
    // Return mock products for web preview
    return [
      {
        id: PRODUCTS.MONTHLY_SUBSCRIPTION,
        title: 'Aylık Premium',
        description: 'Tüm kitaplara sınırsız erişim',
        price: '₺29.99',
        priceMicros: 2999000000,
        billingPeriod: 'P1M'
      },
      {
        id: PRODUCTS.YEARLY_SUBSCRIPTION,
        title: 'Yıllık Premium',
        description: 'Tüm kitaplara sınırsız erişim - %40 indirimli',
        price: '₺214.99',
        priceMicros: 21499000000,
        billingPeriod: 'P1Y'
      }
    ];
  }

  return storeInstance.products.map(p => ({
    id: p.id,
    title: p.title || (p.id.includes('yearly') ? 'Yıllık Premium' : 'Aylık Premium'),
    description: p.description || 'Tüm kitaplara sınırsız erişim',
    price: p.pricing?.price || 'N/A',
    priceMicros: p.pricing?.priceMicros || 0,
    billingPeriod: p.billingPeriod || (p.id.includes('yearly') ? 'P1Y' : 'P1M'),
    owned: p.owned || false
  }));
};

// Purchase a product
export const purchaseProduct = async (productId) => {
  if (!isNativeApp()) {
    console.log('Web purchase not supported');
    return { 
      success: false, 
      error: 'Uygulama içi satın alma için iOS veya Android uygulamasını kullanın.' 
    };
  }

  if (!window.CdvPurchase || !storeInstance) {
    return { success: false, error: 'Mağaza başlatılamadı' };
  }

  try {
    const product = storeInstance.get(productId);
    
    if (!product) {
      console.error('Product not found:', productId);
      return { success: false, error: 'Ürün bulunamadı' };
    }

    const offer = product.getOffer();
    if (!offer) {
      console.error('No offer available for:', productId);
      return { success: false, error: 'Teklif mevcut değil' };
    }

    console.log('Ordering product:', productId);
    await offer.order();
    
    return { success: true, pending: true };
  } catch (error) {
    console.error('Purchase error:', error);
    
    // Handle user cancellation
    if (error.code === 'E_USER_CANCELLED' || error.message?.includes('cancelled')) {
      return { success: false, cancelled: true };
    }
    
    return { success: false, error: error.message || 'Satın alma başarısız oldu' };
  }
};

// Restore purchases
export const restorePurchases = async () => {
  if (!isNativeApp() || !window.CdvPurchase || !storeInstance) {
    return { success: false, error: 'Mağaza mevcut değil' };
  }

  try {
    console.log('Restoring purchases...');
    await storeInstance.restorePurchases();
    
    // Sync with backend
    const userId = localStorage.getItem('user_id');
    if (userId) {
      try {
        await api.post('/subscriptions/restore', {
          user_id: userId,
          platform: getPlatform(),
          receipts: []  // The store handles receipts internally
        });
      } catch (backendError) {
        console.error('Backend restore sync failed:', backendError);
      }
    }
    
    // Check if any subscription is now owned
    const hasSubscription = hasActiveSubscription();
    
    return { 
      success: true, 
      hasSubscription,
      message: hasSubscription 
        ? 'Satın almalar geri yüklendi!' 
        : 'Geri yüklenecek satın alma bulunamadı'
    };
  } catch (error) {
    console.error('Restore error:', error);
    return { success: false, error: error.message || 'Geri yükleme başarısız oldu' };
  }
};

// Check if user has active subscription (local check)
export const hasActiveSubscription = () => {
  if (!isNativeApp() || !window.CdvPurchase || !storeInstance) {
    return false;
  }

  // Check monthly subscription
  const monthly = storeInstance.get(PRODUCTS.MONTHLY_SUBSCRIPTION);
  if (monthly?.owned) return true;
  
  // Check yearly subscription
  const yearly = storeInstance.get(PRODUCTS.YEARLY_SUBSCRIPTION);
  if (yearly?.owned) return true;
  
  return false;
};

// Get subscription status from backend
export const getSubscriptionStatus = async (userId) => {
  if (!userId) return null;
  
  try {
    const response = await api.get(`/subscriptions/status/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to get subscription status:', error);
    return null;
  }
};

// Start free trial
export const startFreeTrial = async (userId) => {
  if (!userId) {
    return { success: false, error: 'Kullanıcı bulunamadı' };
  }
  
  try {
    const response = await api.post('/subscriptions/start-trial', {
      user_id: userId
    });
    return { 
      success: true, 
      ...response.data 
    };
  } catch (error) {
    console.error('Failed to start trial:', error);
    const errorMessage = error.response?.data?.detail || 'Deneme başlatılamadı';
    return { success: false, error: errorMessage };
  }
};

// Get trial status
export const getTrialStatus = async (userId) => {
  if (!userId) return null;
  
  try {
    const response = await api.get(`/subscriptions/trial-status/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to get trial status:', error);
    return null;
  }
};

// Manage subscription (opens native subscription management)
export const manageSubscription = () => {
  if (!isNativeApp()) {
    // For web, redirect to app store subscription management
    const platform = getPlatform();
    if (platform === 'ios') {
      window.open('https://apps.apple.com/account/subscriptions', '_blank');
    } else {
      window.open('https://play.google.com/store/account/subscriptions', '_blank');
    }
    return;
  }

  if (window.CdvPurchase && storeInstance) {
    storeInstance.manageSubscriptions();
  }
};

// Set user ID for purchase tracking (call after login)
export const setUserId = (userId) => {
  localStorage.setItem('user_id', userId);
  console.log('IAP User ID set:', userId);
};

// Clear user ID (call after logout)
export const clearUserId = () => {
  localStorage.removeItem('user_id');
  console.log('IAP User ID cleared');
};

export default {
  PRODUCTS,
  isNativeApp,
  getPlatform,
  initializeStore,
  getProducts,
  purchaseProduct,
  restorePurchases,
  hasActiveSubscription,
  getSubscriptionStatus,
  manageSubscription,
  setUserId,
  clearUserId
};
