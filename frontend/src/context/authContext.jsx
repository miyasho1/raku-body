import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getCurrentAuthUser,
  setAuthUserSession,
  clearAuthUserSession,
  clearGuestSessionData,
  createGuestSession,
  createAuthenticatedSession,
  handleGoogleCredentialResponse,
  initializeGoogleIdentityServices,
  getUserStorageData,
  setUserStorageData,
  getActiveUserId
} from '../utils/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => getCurrentAuthUser());

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'raku_auth_user') {
        setCurrentUser(getCurrentAuthUser());
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const loginAsGuest = () => {
    const user = createGuestSession();
    setCurrentUser(user);
    return user;
  };

  const loginWithAccount = (accountData) => {
    const user = createAuthenticatedSession(accountData);
    setCurrentUser(user);
    return user;
  };

  const logout = () => {
    if (currentUser?.isGuest || currentUser?.authProvider === 'guest') {
      clearGuestSessionData();
    }
    clearAuthUserSession();
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    isGuest: !currentUser || currentUser.isGuest || currentUser.authProvider === 'guest',
    userId: getActiveUserId(),
    loginAsGuest,
    loginWithAccount,
    logout,
    getUserData: getUserStorageData,
    setUserData: setUserStorageData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  return ctx;
}
