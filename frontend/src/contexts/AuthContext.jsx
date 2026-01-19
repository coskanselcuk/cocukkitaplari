import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { authApi } from '../services/api';
import { setUserId as setIapUserId, clearUserId as clearIapUserId } from '../services/iapService';

const AuthContext = createContext(null);

// Admin email - only this user can access admin panel
const ADMIN_EMAIL = 'coskanselcuk@gmail.com';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await authApi.getCurrentUser();
        setUser(userData);
        setIsAuthenticated(true);
        // Set user ID for IAP tracking
        if (userData?.user_id) {
          setIapUserId(userData.user_id);
        }
      } catch (error) {
        // Not authenticated - that's fine
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    // Check for session_id in URL hash (after Google OAuth redirect)
    const hash = window.location.hash;
    if (hash.includes('session_id=')) {
      const sessionId = hash.split('session_id=')[1]?.split('&')[0];
      if (sessionId) {
        // Exchange session_id for session_token
        exchangeSession(sessionId);
        // Clear the hash
        window.history.replaceState(null, '', window.location.pathname);
        return;
      }
    }

    checkAuth();
  }, []);

  const exchangeSession = async (sessionId) => {
    setIsLoading(true);
    try {
      const result = await authApi.exchangeSession(sessionId);
      if (result.success && result.user) {
        setUser(result.user);
        setIsAuthenticated(true);
        // Set user ID for IAP tracking
        if (result.user.user_id) {
          setIapUserId(result.user.user_id);
        }
      }
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Google Sign-In (existing Emergent auth)
  const loginWithGoogle = useCallback(() => {
    setAuthError(null);
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin;
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  }, []);

  // Apple Sign-In
  const loginWithApple = useCallback(async () => {
    setAuthError(null);
    setIsLoading(true);
    
    try {
      const platform = Capacitor.getPlatform();
      
      if (platform === 'ios') {
        // Native iOS Apple Sign-In
        const { SignInWithApple } = await import('@capacitor-community/apple-sign-in');
        
        const result = await SignInWithApple.authorize({
          clientId: 'com.cocukkitaplari.app',
          redirectURI: '',
          scopes: 'email name',
          state: '',
          nonce: ''
        });
        
        if (result.response && result.response.identityToken) {
          // Send identity token to backend for verification
          const response = await authApi.verifyAppleToken({
            identityToken: result.response.identityToken,
            userIdentifier: result.response.user,
            email: result.response.email,
            fullName: result.response.givenName || result.response.familyName ? {
              givenName: result.response.givenName,
              familyName: result.response.familyName
            } : null,
            authorizationCode: result.response.authorizationCode
          });
          
          if (response.success && response.user) {
            setUser(response.user);
            setIsAuthenticated(true);
            if (response.user.user_id) {
              setIapUserId(response.user.user_id);
            }
          } else {
            throw new Error('Apple Sign-In verification failed');
          }
        } else {
          throw new Error('No identity token received from Apple');
        }
      } else {
        // Web/Android - show message that Apple Sign-In is only available on iOS
        setAuthError('Apple ile giriş sadece iOS cihazlarda kullanılabilir. Lütfen Google ile giriş yapın.');
      }
    } catch (error) {
      if (error.message?.includes('cancelled') || error.code === 1001) {
        // User cancelled - not an error
        setAuthError(null);
      } else {
        setAuthError(error.message || 'Apple ile giriş başarısız oldu');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Legacy login function - defaults to Google
  const login = useCallback(() => {
    loginWithGoogle();
  }, [loginWithGoogle]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      // Ignore logout errors
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setAuthError(null);
      // Clear IAP user ID
      clearIapUserId();
    }
  }, []);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  // Check if user has premium access
  const isPremiumUser = user?.subscription_tier === 'premium';

  // Check if user is admin (coskanselcuk@gmail.com)
  const isAdmin = user?.email === ADMIN_EMAIL;

  // Check if user can access a book
  const canAccessBook = useCallback((book) => {
    if (!book.isPremium) return true; // Free books
    if (!isAuthenticated) return false; // Not logged in
    return isPremiumUser; // Premium users can access premium books
  }, [isAuthenticated, isPremiumUser]);

  // Check if running on iOS
  const isIOS = Capacitor.getPlatform() === 'ios';

  const value = {
    user,
    isLoading,
    isAuthenticated,
    isPremiumUser,
    isAdmin,
    isIOS,
    authError,
    login,
    loginWithGoogle,
    loginWithApple,
    logout,
    canAccessBook,
    clearAuthError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
