import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await authApi.getCurrentUser();
        setUser(userData);
        setIsAuthenticated(true);
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
      console.error('Session exchange failed:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(() => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin;
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
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

  const value = {
    user,
    isLoading,
    isAuthenticated,
    isPremiumUser,
    isAdmin,
    login,
    logout,
    canAccessBook
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
