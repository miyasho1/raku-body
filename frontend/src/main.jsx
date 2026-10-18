import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.jsx';
import './index.css';

const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '1029384756-raku-body-demo-client-id.apps.googleusercontent.com').trim();

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  const isSubdir = window.location.pathname.startsWith('/raku-body');
  const swUrl = isSubdir ? '/raku-body/sw.js' : '/sw.js';

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(swUrl)
      .then((registration) => {
        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.addEventListener('statechange', () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                if ('caches' in window) {
                  caches.keys().then((names) => {
                    Promise.all(names.map((name) => caches.delete(name))).then(() => {
                      window.location.reload();
                    });
                  });
                } else {
                  window.location.reload();
                }
              }
            });
          }
        });
      })
      .catch(() => {});
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg) {
          reg.update().catch(() => {});
        }
      });
    }
  });

  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      if ('caches' in window) {
        caches.keys().then((names) => {
          Promise.all(names.map((name) => caches.delete(name))).then(() => {
            window.location.reload();
          });
        });
      } else {
        window.location.reload();
      }
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);
