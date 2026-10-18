const AUTH_STORAGE_KEY = 'raku_auth_user';

export function parseJwtPayload(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function getCurrentAuthUser() {
  try {
    const isPasscodeOk = localStorage.getItem('raku_lab_passcode_verified') === 'true';
    if (!isPasscodeOk) return null;
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setAuthUserSession(user) {
  try {
    if (!user) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return;
    }
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  } catch {
  }
}

export function clearAuthUserSession() {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
  }
}

export function getActiveUserId() {
  const user = getCurrentAuthUser();
  if (!user || user.isGuest || user.authProvider === 'guest') {
    return 'guest';
  }
  const raw = user.uid || user.id || (user.email ? user.email.replace(/[^a-zA-Z0-9_-]/g, '_') : 'auth_user');
  return String(raw).replace(/[^a-zA-Z0-9_-]/g, '_');
}

export function getUserStorageKey(keyType, specificUid = null) {
  const uid = specificUid || getActiveUserId();
  return `raku_user_${uid}_${keyType}`;
}

export function getUserStorageData(keyType, defaultVal = []) {
  const uid = getActiveUserId();
  const userKey = getUserStorageKey(keyType, uid);
  try {
    const raw = localStorage.getItem(userKey);
    if (raw !== null) {
      return JSON.parse(raw);
    }
    if (uid === 'guest') {
      const legacyKey = `raku_demo_${keyType}`;
      const legacyRaw = localStorage.getItem(legacyKey);
      if (legacyRaw !== null) {
        return JSON.parse(legacyRaw);
      }
    }
  } catch {
  }
  return defaultVal;
}

export function setUserStorageData(keyType, data, specificUid = null) {
  const uid = specificUid || getActiveUserId();
  const userKey = getUserStorageKey(keyType, uid);
  try {
    const serialized = typeof data === 'string' ? data : JSON.stringify(data);
    localStorage.setItem(userKey, serialized);
    if (uid === 'guest') {
      const legacyKey = `raku_demo_${keyType}`;
      localStorage.setItem(legacyKey, serialized);
    }
  } catch {
  }
}

export function removeUserStorageData(keyType, specificUid = null) {
  const uid = specificUid || getActiveUserId();
  const userKey = getUserStorageKey(keyType, uid);
  try {
    localStorage.removeItem(userKey);
    if (uid === 'guest') {
      localStorage.removeItem(`raku_demo_${keyType}`);
    }
  } catch {
  }
}

export function clearGuestSessionData() {
  const dataTypes = [
    'meals',
    'workouts',
    'metrics',
    'logs',
    'streak',
    'body_height',
    'target_weight',
    'target_calories',
    'protein_presets',
    'my_protein',
    'selected_goal'
  ];
  dataTypes.forEach((t) => {
    try {
      localStorage.removeItem(`raku_user_guest_${t}`);
      localStorage.removeItem(`raku_demo_${t}`);
    } catch {
    }
  });
}

export function createGuestSession() {
  const user = {
    uid: 'guest',
    id: 'guest',
    name: 'ゲストユーザー',
    email: 'guest@rakubody.app',
    avatarUrl: '',
    initial: 'G',
    bgColor: 'bg-slate-600',
    authProvider: 'guest',
    isGuest: true,
    sessionStatus: 'guest'
  };
  setAuthUserSession(user);
  return user;
}

export function createAuthenticatedSession(accountData) {
  const rawId = accountData.id || (accountData.email ? accountData.email.replace(/[^a-zA-Z0-9_-]/g, '_') : `user_${Date.now()}`);
  const user = {
    uid: `usr_${rawId}`,
    id: String(rawId),
    name: accountData.name || 'ユーザー',
    email: accountData.email || '',
    avatarUrl: accountData.avatarUrl || '',
    initial: accountData.initial || (accountData.name ? accountData.name.charAt(0).toUpperCase() : 'U'),
    bgColor: accountData.bgColor || 'bg-blue-600',
    authProvider: accountData.authProvider || 'google',
    isGuest: false,
    sessionStatus: 'authenticated'
  };
  setAuthUserSession(user);
  return user;
}

export function handleGoogleCredentialResponse(response, onLoginSuccess) {
  if (!response || !response.credential) return null;
  const payload = parseJwtPayload(response.credential);
  if (!payload) return null;
  const user = {
    uid: payload.sub ? `google_${payload.sub}` : `google_${Date.now()}`,
    id: payload.sub || `google_${Date.now()}`,
    name: payload.name || payload.given_name || 'Googleユーザー',
    email: payload.email || '',
    avatarUrl: payload.picture || '',
    initial: (payload.name || payload.email || 'G').charAt(0).toUpperCase(),
    bgColor: 'bg-blue-600',
    authProvider: 'google',
    isGuest: false,
    sessionStatus: 'authenticated',
    idToken: response.credential
  };
  setAuthUserSession(user);
  if (onLoginSuccess) {
    onLoginSuccess(user);
  }
  return user;
}

export function initializeGoogleIdentityServices(clientId, onLoginSuccess) {
  if (typeof window === 'undefined' || !window.google?.accounts?.id) {
    return false;
  }
  try {
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (res) => handleGoogleCredentialResponse(res, onLoginSuccess),
      auto_select: false,
      cancel_on_tap_outside: true
    });
    return true;
  } catch {
    return false;
  }
}

export function renderGoogleButton(containerId, options = {}) {
  if (typeof window === 'undefined' || !window.google?.accounts?.id) return false;
  const target = document.getElementById(containerId);
  if (!target) return false;
  try {
    window.google.accounts.id.renderButton(target, {
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      shape: 'rectangular',
      width: 280,
      ...options
    });
    return true;
  } catch {
    return false;
  }
}

export function handleFirebaseAuthUser(firebaseUser, onLoginSuccess) {
  if (!firebaseUser) return null;
  const user = {
    uid: firebaseUser.uid ? `fb_${firebaseUser.uid}` : `fb_${Date.now()}`,
    id: firebaseUser.uid || `fb_${Date.now()}`,
    name: firebaseUser.displayName || 'ユーザー',
    email: firebaseUser.email || '',
    avatarUrl: firebaseUser.photoURL || '',
    initial: (firebaseUser.displayName || firebaseUser.email || 'U').charAt(0).toUpperCase(),
    bgColor: 'bg-indigo-600',
    authProvider: firebaseUser.providerData?.[0]?.providerId === 'google.com' ? 'google' : 'firebase',
    isGuest: false,
    sessionStatus: 'authenticated'
  };
  setAuthUserSession(user);
  if (onLoginSuccess) {
    onLoginSuccess(user);
  }
  return user;
}
