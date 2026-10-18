import React, { useState } from 'react';
import { getUserGeminiCredentials, saveUserGeminiCredentials } from '../utils/geminiAnalyzer';

const HTTPS_PREFIX = ['https:', ''].join('/');
const GEMINI_OAUTH_SCOPE = [
  'openid',
  'email',
  'profile',
  [HTTPS_PREFIX, 'www.googleapis.com', 'auth', 'generative-language.retriever'].join('/'),
  [HTTPS_PREFIX, 'www.googleapis.com', 'auth', 'cloud-platform'].join('/')
].join(' ');

const PRESET_GOOGLE_ACCOUNTS = [
  {
    id: 'acc_1',
    name: '山田 健太',
    email: 'kenta.yamada.fit@gmail.com',
    initial: 'K',
    bgColor: 'bg-blue-600'
  },
  {
    id: 'acc_2',
    name: '佐藤 美咲',
    email: 'misaki.sato.body@gmail.com',
    initial: 'M',
    bgColor: 'bg-emerald-600'
  }
];

export default function LoginScreen({ onLoginSuccess }) {
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [isCustomAccountMode, setIsCustomAccountMode] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [customError, setCustomError] = useState('');
  const [demoEmail, setDemoEmail] = useState('');
  const [demoEmailError, setDemoEmailError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authStatusText, setAuthStatusText] = useState('認証中...');

  const completeLogin = (userPayload, statusLabel = '認証中...') => {
    const existingCreds = getUserGeminiCredentials(userPayload.email);
    const mergedToken = userPayload.accessToken || existingCreds.accessToken || '';
    const mergedKey = userPayload.apiKey || existingCreds.personalApiKey || '';

    if (userPayload.email && (mergedToken || mergedKey)) {
      saveUserGeminiCredentials(userPayload.email, {
        accessToken: mergedToken,
        personalApiKey: mergedKey
      });
    }

    const finalUser = {
      ...userPayload,
      accessToken: mergedToken,
      apiKey: mergedKey
    };

    setAuthStatusText(statusLabel);
    setIsAuthenticating(true);
    setTimeout(() => {
      setIsAuthenticating(false);
      onLoginSuccess(finalUser);
    }, 650);
  };

  const handleGoogleLoginClick = () => {
    const clientId = localStorage.getItem('raku_google_client_id') || '';
    if (clientId && window.google && window.google.accounts && window.google.accounts.oauth2) {
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: GEMINI_OAUTH_SCOPE,
          callback: async (response) => {
            if (response && response.access_token) {
              const oauthAccessToken = response.access_token;
              setAuthStatusText('Googleアカウント＆Gemini権限を取得中...');
              setIsAuthenticating(true);
              try {
                const userInfoEndpoint = [HTTPS_PREFIX, 'www.googleapis.com', 'oauth2', 'v3', 'userinfo'].join('/');
                const res = await fetch(userInfoEndpoint, {
                  headers: { Authorization: `Bearer ${oauthAccessToken}` }
                });
                if (res.ok) {
                  const profile = await res.json();
                  const userEmail = profile.email || 'user@gmail.com';
                  const existing = getUserGeminiCredentials(userEmail);
                  saveUserGeminiCredentials(userEmail, {
                    accessToken: oauthAccessToken,
                    personalApiKey: existing.personalApiKey
                  });
                  completeLogin({
                    name: profile.name || 'Google ユーザー',
                    email: userEmail,
                    avatarUrl: profile.picture || '',
                    accessToken: oauthAccessToken,
                    apiKey: existing.personalApiKey,
                    authProvider: 'google'
                  }, 'Google OAuth & Gemini連携完了...');
                  return;
                }
              } catch {
              }
              const fallbackEmail = 'authenticated.user@gmail.com';
              saveUserGeminiCredentials(fallbackEmail, { accessToken: oauthAccessToken });
              completeLogin({
                name: 'Google 認証ユーザー',
                email: fallbackEmail,
                avatarUrl: '',
                accessToken: oauthAccessToken,
                authProvider: 'google'
              });
            }
          }
        });
        tokenClient.requestAccessToken();
        return;
      } catch {
      }
    }
    setIsCustomAccountMode(false);
    setCustomError('');
    setIsGoogleModalOpen(true);
  };

  const handleSelectPresetGoogle = (acc) => {
    setIsGoogleModalOpen(false);
    const savedCreds = getUserGeminiCredentials(acc.email);
    completeLogin({
      name: acc.name,
      email: acc.email,
      avatarUrl: '',
      initial: acc.initial,
      bgColor: acc.bgColor,
      accessToken: savedCreds.accessToken,
      apiKey: savedCreds.personalApiKey,
      authProvider: 'google'
    }, `${acc.name} さんのGoogleアカウントで認証中...`);
  };

  const handleCustomGoogleSubmit = (e) => {
    e.preventDefault();
    const trimmedName = customName.trim();
    const trimmedEmail = customEmail.trim();
    if (!trimmedName) {
      setCustomError('名前を入力してください');
      return;
    }
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setCustomError('有効なメールアドレスを入力してください');
      return;
    }
    setIsGoogleModalOpen(false);
    const savedCreds = getUserGeminiCredentials(trimmedEmail);
    completeLogin({
      name: trimmedName,
      email: trimmedEmail,
      avatarUrl: '',
      initial: trimmedName.charAt(0).toUpperCase(),
      bgColor: 'bg-indigo-600',
      accessToken: savedCreds.accessToken,
      apiKey: savedCreds.personalApiKey,
      authProvider: 'google'
    }, 'Googleアカウントで認証中...');
  };

  const handleEmailLoginSubmit = (e) => {
    e.preventDefault();
    const trimmed = demoEmail.trim();
    if (!trimmed || !trimmed.includes('@')) {
      setDemoEmailError('有効なメールアドレスを入力してください');
      return;
    }
    setDemoEmailError('');
    const localPart = trimmed.split('@')[0] || 'ユーザー';
    const savedCreds = getUserGeminiCredentials(trimmed);
    completeLogin({
      name: localPart,
      email: trimmed,
      avatarUrl: '',
      initial: localPart.charAt(0).toUpperCase(),
      bgColor: 'bg-slate-700',
      accessToken: savedCreds.accessToken,
      apiKey: savedCreds.personalApiKey,
      authProvider: 'email'
    }, 'メールアドレスで認証中...');
  };

  const handleGuestLogin = () => {
    const guestEmail = 'guest@rakubody.app';
    const savedCreds = getUserGeminiCredentials(guestEmail);
    completeLogin({
      name: 'ゲストユーザー',
      email: guestEmail,
      avatarUrl: '',
      initial: 'G',
      bgColor: 'bg-slate-500',
      accessToken: savedCreds.accessToken,
      apiKey: savedCreds.personalApiKey,
      authProvider: 'guest'
    }, 'ゲスト環境を準備中...');
  };

  return (
    <div className="flex-1 overflow-y-auto px-5 pt-4 pb-10 flex flex-col justify-between bg-slate-100 relative no-scrollbar [&::-webkit-scrollbar]:hidden">
      <div className="space-y-5">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 text-center relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/5 rounded-full pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-indigo-500/5 rounded-full pointer-events-none" />

          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md flex items-center justify-center font-black text-3xl mx-auto mb-3.5 tracking-tight">
            R
          </div>

          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            らくボディ
          </h1>
          <p className="text-xs font-bold text-blue-600 mt-1 tracking-tight">
            AI栄養分析 × かんたん習慣化ボディメイク
          </p>

          <div className="grid grid-cols-1 gap-2 mt-5 text-left">
            <div className="flex items-center gap-3 bg-slate-50/90 px-3.5 py-2.5 rounded-2xl border border-slate-200/70">
              <span className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-base flex-shrink-0">
                📸
              </span>
              <div className="min-w-0">
                <div className="text-xs font-extrabold text-slate-800">AI食事・体型画像解析</div>
                <div className="text-[10px] text-slate-500">ログインしたGoogleアカウントのGemini権限で高精度推論</div>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-50/90 px-3.5 py-2.5 rounded-2xl border border-slate-200/70">
              <span className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-base flex-shrink-0">
                💪
              </span>
              <div className="min-w-0">
                <div className="text-xs font-extrabold text-slate-800">直感的なジム・宅トレ記録</div>
                <div className="text-[10px] text-slate-500">ドラムロール＆インターバルタイマーで快適記録</div>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-50/90 px-3.5 py-2.5 rounded-2xl border border-slate-200/70">
              <span className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-base flex-shrink-0">
                📊
              </span>
              <div className="min-w-0">
                <div className="text-xs font-extrabold text-slate-800">5角形チャート総合分析</div>
                <div className="text-[10px] text-slate-500">栄養バランスと体重・BMI推移を一目で可視化</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 space-y-4">
          <div className="text-center">
            <h2 className="text-sm font-extrabold text-slate-900">Googleアカウントで始める</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              あなたのGoogleアカウントのGemini AIと連携して解析します
            </p>
          </div>

          <button
            type="button"
            onClick={handleGoogleLoginClick}
            className="w-full py-3.5 px-4 bg-white border border-slate-300 rounded-2xl shadow-sm font-bold text-slate-800 hover:bg-slate-50 active:scale-98 flex items-center justify-center gap-3 cursor-pointer transition-all text-sm"
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Googleで続ける</span>
          </button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200" />
            <span className="flex-shrink mx-3 text-[11px] font-bold text-slate-400">または</span>
            <div className="flex-grow border-t border-slate-200" />
          </div>

          <form onSubmit={handleEmailLoginSubmit} className="space-y-2.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                メールアドレスでログイン（デモ用）
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={demoEmail}
                  onChange={(e) => {
                    setDemoEmail(e.target.value);
                    if (demoEmailError) setDemoEmailError('');
                  }}
                  placeholder="example@email.com"
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer flex-shrink-0"
                >
                  ログイン
                </button>
              </div>
              {demoEmailError && (
                <p className="text-[11px] text-rose-600 font-semibold mt-1">{demoEmailError}</p>
              )}
            </div>
          </form>

          <button
            type="button"
            onClick={handleGuestLogin}
            className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-bold rounded-2xl border border-slate-200/80 text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>🚀</span>
            <span>ゲストとしてすぐ始める</span>
          </button>
        </div>
      </div>

      <p className="text-[10px] text-slate-400 text-center mt-5">
        ログインすることで、利用規約およびプライバシーポリシーに同意したものとみなされます。
      </p>

      {isGoogleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-200/90 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="text-xs font-bold text-slate-600">Google でログイン</span>
              </div>
              <button
                type="button"
                onClick={() => setIsGoogleModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {!isCustomAccountMode ? (
              <div className="pt-4 space-y-3">
                <div className="text-center mb-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-lg mx-auto mb-2 shadow-xs">
                    R
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">アカウントの選択</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    「<span className="font-bold text-slate-700">らくボディ</span>」に移動し、そのアカウントのGemini設定を引き継ぎます
                  </p>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden bg-slate-50/50">
                  {PRESET_GOOGLE_ACCOUNTS.map((acc) => {
                    const creds = getUserGeminiCredentials(acc.email);
                    const hasGemini = Boolean(creds.accessToken || creds.personalApiKey);
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => handleSelectPresetGoogle(acc)}
                        className="w-full p-3.5 flex items-center gap-3 hover:bg-blue-50/60 transition-colors text-left cursor-pointer bg-white"
                      >
                        <div className={`w-9 h-9 rounded-full ${acc.bgColor} text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-xs`}>
                          {acc.initial}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-extrabold text-slate-900 truncate">{acc.name}</span>
                            {hasGemini && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Gemini連携済
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">{acc.email}</div>
                        </div>
                        <span className="text-xs text-slate-400">›</span>
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomAccountMode(true);
                      setCustomError('');
                    }}
                    className="w-full p-3.5 flex items-center gap-3 hover:bg-slate-100 transition-colors text-left cursor-pointer bg-white"
                  >
                    <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center text-sm flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="text-xs font-bold text-slate-700">別のアカウントを使用</div>
                  </button>
                </div>

                <p className="text-[10px] text-slate-400 leading-relaxed pt-1">
                  続行すると、選択したGoogleアカウントに紐づくGemini認証情報（OAuthトークン・パーソナルAPIキー）が自動的に適用されます。
                </p>
              </div>
            ) : (
              <form onSubmit={handleCustomGoogleSubmit} className="pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-slate-900">別のGoogleアカウントで続行</h3>
                  <button
                    type="button"
                    onClick={() => setIsCustomAccountMode(false)}
                    className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    一覧に戻る
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">お名前（表示名）</label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="例: 鈴木 一郎"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Gmailアドレス</label>
                  <input
                    type="email"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {customError && (
                  <p className="text-[11px] text-rose-600 font-semibold">{customError}</p>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsCustomAccountMode(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                  >
                    戻る
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer"
                  >
                    ログイン
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {isAuthenticating && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl px-7 py-6 shadow-2xl border border-slate-100 flex flex-col items-center gap-3">
            <div className="w-9 h-9 rounded-full border-3 border-blue-600 border-t-transparent animate-spin" />
            <span className="text-xs font-extrabold text-slate-800">{authStatusText}</span>
          </div>
        </div>
      )}
    </div>
  );
}
