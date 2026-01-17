/**
 * In-App Purchase Service for Çocuk Kitapları
 * Uses cordova-plugin-purchase for native iOS/Android purchases
 */

// Product IDs - these must match your App Store Connect / Google Play Console setup
export const PRODUCTS = {
  MONTHLY_SUBSCRIPTION: 'cocukkitaplari_premium_monthly',
  YEARLY_SUBSCRIPTION: 'cocukkitaplari_premium_yearly'
};

// Check if running in native app
export const isNativeApp = () => {
  return window.Capacitor?.isNativePlatform() || false;
};

// Initialize the store
export const initializeStore = (onPurchaseUpdate) => {
  if (!isNativeApp()) {
    console.log('Not running in native app, IAP disabled');
    return false;
  }

  // Wait for device ready
  document.addEventListener('deviceready', () => {
    if (!window.CdvPurchase) {
      console.error('CdvPurchase not available');
      return;
    }

    const { store, ProductType, Platform } = window.CdvPurchase;

    // Register products
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
      .approved(transaction => {
        console.log('Purchase approved:', transaction);
        transaction.verify();
      })
      .verified(receipt => {
        console.log('Purchase verified:', receipt);
        receipt.finish();
        if (onPurchaseUpdate) {
          onPurchaseUpdate({ success: true, receipt });
        }
      })
      .finished(transaction => {
        console.log('Purchase finished:', transaction);
      })
      .unverified(receipt => {
        console.error('Purchase unverified:', receipt);
        if (onPurchaseUpdate) {
          onPurchaseUpdate({ success: false, error: 'Verification failed' });
        }
      });

    // Initialize store
    store.initialize([
      Platform.APPLE_APPSTORE,
      Platform.GOOGLE_PLAY
    ]).then(() => {
      console.log('Store initialized');
      store.update();
    });

  }, false);

  return true;
};

// Get product info
export const getProducts = () => {
  if (!isNativeApp() || !window.CdvPurchase) {
    // Return mock products for web
    return [
      {
        id: PRODUCTS.MONTHLY_SUBSCRIPTION,
        title: 'Aylık Premium',
        description: 'Tüm kitaplara sınırsız erişim',
        price: '₺29.99',
        priceMicros: 2999000000
      },
      {
        id: PRODUCTS.YEARLY_SUBSCRIPTION,
        title: 'Yıllık Premium',
        description: 'Tüm kitaplara sınırsız erişim - %40 indirimli',
        price: '₺214.99',
        priceMicros: 21499000000
      }
    ];
  }

  const { store } = window.CdvPurchase;
  return store.products.map(p => ({
    id: p.id,
    title: p.title,
    description: p.description,
    price: p.pricing?.price || 'N/A',
    priceMicros: p.pricing?.priceMicros || 0
  }));
};

// Purchase a product
export const purchaseProduct = async (productId) => {
  if (!isNativeApp()) {
    console.log('Web purchase not supported, redirecting to web checkout');
    // For web, you could redirect to Stripe checkout here
    return { success: false, error: 'Web purchases not supported. Please use the mobile app.' };
  }

  if (!window.CdvPurchase) {
    return { success: false, error: 'Store not available' };
  }

  try {
    const { store } = window.CdvPurchase;
    const product = store.get(productId);
    
    if (!product) {
      return { success: false, error: 'Product not found' };
    }

    const offer = product.getOffer();
    if (!offer) {
      return { success: false, error: 'No offer available' };
    }

    await offer.order();
    return { success: true, pending: true };
  } catch (error) {
    console.error('Purchase error:', error);
    return { success: false, error: error.message };
  }
};

// Restore purchases
export const restorePurchases = async () => {
  if (!isNativeApp() || !window.CdvPurchase) {
    return { success: false, error: 'Not available' };
  }

  try {
    const { store } = window.CdvPurchase;
    await store.restorePurchases();
    return { success: true };
  } catch (error) {
    console.error('Restore error:', error);
    return { success: false, error: error.message };
  }
};

// Check if user has active subscription
export const hasActiveSubscription = () => {
  if (!isNativeApp() || !window.CdvPurchase) {
    return false;
  }

  const { store } = window.CdvPurchase;
  
  // Check monthly subscription
  const monthly = store.get(PRODUCTS.MONTHLY_SUBSCRIPTION);
  if (monthly?.owned) return true;
  
  // Check yearly subscription
  const yearly = store.get(PRODUCTS.YEARLY_SUBSCRIPTION);
  if (yearly?.owned) return true;
  
  return false;
};

export default {
  PRODUCTS,
  isNativeApp,
  initializeStore,
  getProducts,
  purchaseProduct,
  restorePurchases,
  hasActiveSubscription
};
