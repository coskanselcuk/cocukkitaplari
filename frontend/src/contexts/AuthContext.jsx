import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { authApi } from '../services/api';
import { setUserId as setIapUserId, clearUserId as clearIapUserId } from '../services/iapService';

const AuthContext = createContext(null);

// Admin email - only this user can access admin panel
const ADMIN_EMAIL = 'coskanselcuk@gmail.com';

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH

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

    checkAuth();
  }, []);

  // Google Sign-In - Native on iOS/Android, OAuth popup on web
  const loginWithGoogle = useCallback(async () => {
    setAuthError(null);
    setIsLoading(true);
    
    try {
      const platform = Capacitor.getPlatform();
      
      if (platform === 'ios' || platform === 'android') {
        // Native Google Sign-In for mobile
        const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
        
        // Initialize Google Auth (uses capacitor.config.json settings)
        await GoogleAuth.initialize({
          clientId: '60785703056-d07ioivj55tmk45p1evgc8o873q1um1q.apps.googleusercontent.com',
          scopes: ['email', 'profile'],
          grantOfflineAccess: true
        });
        
        const result = await GoogleAuth.signIn();
        
        if (result && result.authentication && result.authentication.idToken) {
          // Send ID token to backend for verification
          const response = await authApi.verifyGoogleToken({
            idToken: result.authentication.idToken,
            accessToken: result.authentication.accessToken,
            serverAuthCode: result.serverAuthCode
          });
          
          if (response.success && response.user) {
            setUser(response.user);
            setIsAuthenticated(true);
            if (response.user.user_id) {
              setIapUserId(response.user.user_id);
            }
          } else {
            throw new Error('Google Sign-In verification failed');
          }
        } else {
          throw new Error('No ID token received from Google');
        }
      } else {
        // Web - Use standard OAuth popup flow
        const clientId = '60785703056-d07ioivj55tmk45p1evgc8o873q1um1q.apps.googleusercontent.com';
        const redirectUri = window.location.origin;
        const scope = 'email profile openid';
        
        // Create OAuth URL
        const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
        authUrl.searchParams.set('client_id', clientId);
        authUrl.searchParams.set('redirect_uri', redirectUri);
        authUrl.searchParams.set('response_type', 'id_token');
        authUrl.searchParams.set('scope', scope);
        authUrl.searchParams.set('nonce', Math.random().toString(36).substring(2));
        authUrl.searchParams.set('prompt', 'select_account');
        
        // Open popup
        const width = 500;
        const height = 600;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        
        const popup = window.open(
          authUrl.toString(),
          'Google Sign In',
          `width=${width},height=${height},left=${left},top=${top},popup=yes`
        );
        
        // Listen for redirect with token
        const checkPopup = setInterval(() => {
          try {
            if (popup.closed) {
              clearInterval(checkPopup);
              setIsLoading(false);
              return;
            }
            
            // Check if popup has redirected back to our origin
            if (popup.location.origin === window.location.origin) {
              clearInterval(checkPopup);
              
              // Extract id_token from URL hash
              const hash = popup.location.hash.substring(1);
              const params = new URLSearchParams(hash);
              const idToken = params.get('id_token');
              
              popup.close();
              
              if (idToken) {
                // Verify token with backend
                authApi.verifyGoogleToken({ idToken })
                  .then(response => {
                    if (response.success && response.user) {
                      setUser(response.user);
                      setIsAuthenticated(true);
                      if (response.user.user_id) {
                        setIapUserId(response.user.user_id);
                      }
                    }
                  })
                  .catch(err => {
                    setAuthError(err.message || 'Google ile giriş başarısız oldu');
                  })
                  .finally(() => {
                    setIsLoading(false);
                  });
              } else {
                setIsLoading(false);
              }
            }
          } catch (e) {
            // Cross-origin error - popup still on Google's domain, keep waiting
          }
        }, 500);
      }
    } catch (error) {
      if (error.message?.includes('cancelled') || error.message?.includes('popup_closed')) {
        // User cancelled - not an error
        setAuthError(null);
      } else {
        setAuthError(error.message || 'Google ile giriş başarısız oldu');
      }
    } finally {
      setIsLoading(false);
    }
  }, [handleGoogleCallback]);

  // Apple Sign-In - Only on iOS
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
      
      // Also sign out from Google on native
      const platform = Capacitor.getPlatform();
      if (platform === 'ios' || platform === 'android') {
        try {
          const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
          await GoogleAuth.signOut();
        } catch (e) {
          // Ignore errors signing out of Google
        }
      }
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
