import React, { useState, useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import {
  createAuthenticatedSession,
  createGuestSession,
  initializeGoogleIdentityServices
} from '../utils/authService';

const LAB_PASSCODE = '2026';

const PRESET_ACCOUNTS = [
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
  const [isPasscodeUnlocked, setIsPasscodeUnlocked] = useState(() => {
    try {
      return localStorage.getItem('raku_lab_passcode_verified') === 'true';
    } catch {
      return false;
    }
  });
  const [passcodeInput, setPasscodeInput] = useState('');
  const [passcodeError, setPasscodeError] = useState('');

  const [selectedAccountIdx, setSelectedAccountIdx] = useState(0);
  const [demoEmail, setDemoEmail] = useState('');
  const [demoEmailError, setDemoEmailError] = useState('');

  useEffect(() => {
    const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();
    if (googleClientId && typeof window !== 'undefined' && window.google?.accounts?.id) {
      initializeGoogleIdentityServices(googleClientId, (user) => {
        onLoginSuccess(user);
      });
    }
  }, [onLoginSuccess]);

  const verifyPasscodeValue = (val) => {
    if (val.trim() === LAB_PASSCODE) {
      try {
        localStorage.setItem('raku_lab_passcode_verified', 'true');
      } catch {
      }
      setPasscodeError('');
      setIsPasscodeUnlocked(true);
      return true;
    }
    return false;
  };

  const handlePasscodeChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPasscodeInput(val);
    if (passcodeError) setPasscodeError('');
    if (val.length === 4) {
      verifyPasscodeValue(val);
    }
  };

  const handlePasscodeSubmit = (e) => {
    e.preventDefault();
    if (!verifyPasscodeValue(passcodeInput)) {
      setPasscodeError('招待パスコードが正しくありません（研究室指定の4桁を入力してください）');
    }
  };

  const handleRelockPasscode = () => {
    try {
      localStorage.removeItem('raku_lab_passcode_verified');
    } catch {
    }
    setPasscodeInput('');
    setPasscodeError('');
    setIsPasscodeUnlocked(false);
  };

  const handleGoogleOAuthSuccess = (credentialResponse) => {
    try {
      if (!credentialResponse?.credential) return;
      const decoded = jwtDecode(credentialResponse.credential);
      const userData = {
        uid: decoded.sub ? `google_${decoded.sub}` : `google_${Date.now()}`,
        id: decoded.sub || `google_${Date.now()}`,
        name: decoded.name || decoded.given_name || 'Googleユーザー',
        email: decoded.email || '',
        avatarUrl: decoded.picture || '',
        initial: (decoded.name || decoded.email || 'G').charAt(0).toUpperCase(),
        bgColor: 'bg-blue-600',
        authProvider: 'google',
        isGuest: false,
        sessionStatus: 'authenticated',
        idToken: credentialResponse.credential
      };
      localStorage.setItem('raku_auth_user', JSON.stringify(userData));
      onLoginSuccess(userData);
    } catch {
    }
  };

  const handleOneTapGoogleLogin = () => {
    const acc = PRESET_ACCOUNTS[selectedAccountIdx] || PRESET_ACCOUNTS[0];
    const user = createAuthenticatedSession(acc);
    onLoginSuccess(user);
  };

  const handleGuestLogin = () => {
    const user = createGuestSession();
    onLoginSuccess(user);
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
    const user = createAuthenticatedSession({
      id: localPart,
      name: localPart,
      email: trimmed,
      initial: localPart.charAt(0).toUpperCase(),
      bgColor: 'bg-indigo-600',
      authProvider: 'email'
    });
    onLoginSuccess(user);
  };

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-3.5 flex flex-col justify-between bg-slate-100 no-scrollbar [&::-webkit-scrollbar]:hidden space-y-3.5 w-full max-w-full box-border">
      <div className="space-y-3.5 w-full max-w-full">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 text-center space-y-3 w-full max-w-full box-border">
          <div className="flex items-center justify-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-sm flex items-center justify-center font-black text-xl tracking-tight shrink-0">
              R
            </div>
            <div className="text-left">
              <h1 className="text-xl font-black text-slate-900 tracking-tight leading-tight">
                らくボディ
              </h1>
              <p className="text-[11px] font-bold text-blue-600 tracking-tight">
                AI栄養分析 × かんたん習慣化ボディメイク
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5 text-center w-full">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 flex flex-col items-center gap-1 min-w-0">
              <span className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200/60 flex items-center justify-center text-xs">
                📸
              </span>
              <span className="text-[11px] font-extrabold text-slate-800 leading-tight">AI画像解析</span>
              <span className="text-[9px] text-slate-500 leading-tight">食事・体型診断</span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 flex flex-col items-center gap-1 min-w-0">
              <span className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-xs">
                💪
              </span>
              <span className="text-[11px] font-extrabold text-slate-800 leading-tight">ジム・宅トレ</span>
              <span className="text-[9px] text-slate-500 leading-tight">直感ピッカー記録</span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 flex flex-col items-center gap-1 min-w-0">
              <span className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200/60 flex items-center justify-center text-xs">
                📊
              </span>
              <span className="text-[11px] font-extrabold text-slate-800 leading-tight">週間通信簿</span>
              <span className="text-[9px] text-slate-500 leading-tight">未来体重予測</span>
            </div>
          </div>
        </div>

        {!isPasscodeUnlocked ? (
          <div className="border border-slate-200/80 rounded-2xl p-4 bg-white shadow-sm w-full max-w-full box-border space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-1.5 w-full">
              <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2.5 py-1 rounded-lg">
                🛡️ 研究室実証テスト・メンバー限定ゲート
              </span>
              <span className="text-[10px] font-bold text-slate-400">初回のみ入力</span>
            </div>

            <div className="text-left space-y-1 w-full">
              <h2 className="text-sm font-extrabold text-slate-900 break-all whitespace-normal">
                招待パスコードを入力してロック解除
              </h2>
              <p className="text-[11px] text-slate-500 leading-relaxed break-all whitespace-normal">
                部外者アクセス防止のため、研究室メンバー専用の4桁パスコードを入力してください（一度解除すると次回から自動スキップされます）。
              </p>
            </div>

            <form onSubmit={handlePasscodeSubmit} className="rounded-xl p-3 bg-slate-50 border border-slate-100 w-full max-w-full box-border space-y-3">
              <div className="w-full space-y-2.5">
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={passcodeInput}
                  onChange={handlePasscodeChange}
                  placeholder="4桁 パスコード"
                  className="w-full max-w-full rounded-xl py-3 text-center border border-slate-200 bg-white shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-black tracking-[0.35em] text-slate-900 tabular-nums box-border"
                />
                <button
                  type="submit"
                  className="w-full max-w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all cursor-pointer text-center"
                >
                  ロック解除
                </button>
              </div>

              {passcodeError && (
                <p className="text-[11px] text-rose-600 font-bold text-center break-all whitespace-normal">
                  {passcodeError}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/70 text-[10px] whitespace-normal break-all w-full">
                <span className="text-slate-500 font-medium break-all whitespace-normal">
                  ※ 研究室テスト用パスコード: <strong className="text-slate-700 font-extrabold">2026</strong>
                </span>
                <button
                  type="button"
                  onClick={() => verifyPasscodeValue(LAB_PASSCODE)}
                  className="font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer shrink-0"
                >
                  ワンタップで2026を入力
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 space-y-3.5 w-full max-w-full box-border">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <h2 className="text-sm font-extrabold text-slate-900">ワンタップでシンプルに始める</h2>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  初期設定なしで今すぐトレーニング＆食事記録を開始
                </p>
              </div>
              <button
                type="button"
                onClick={handleRelockPasscode}
                className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-1 rounded-lg cursor-pointer shrink-0"
                title="パスコードロック画面へ戻す"
              >
                🔓 招待認証済
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 w-full">
              {PRESET_ACCOUNTS.map((acc, idx) => {
                const isSelected = selectedAccountIdx === idx;
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => setSelectedAccountIdx(idx)}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer min-w-0 w-full ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-500 shadow-2xs'
                        : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg ${acc.bgColor} text-white flex items-center justify-center font-bold text-xs shrink-0`}>
                      {acc.initial}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-extrabold text-slate-900 truncate">{acc.name}</div>
                      <div className="text-[9px] text-slate-500 truncate">{acc.email}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex flex-col items-center justify-center w-full max-w-full overflow-hidden box-border space-y-2">
              <span className="text-[11px] font-bold text-slate-700">Googleアカウントで簡単サインイン</span>
              <div className="w-full flex items-center justify-center max-w-full overflow-hidden">
                <GoogleLogin
                  onSuccess={handleGoogleOAuthSuccess}
                  onError={() => {}}
                  theme="outline"
                  size="large"
                  text="signin_with"
                  shape="rectangular"
                  width="100%"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 w-full">
              <button
                type="button"
                onClick={handleOneTapGoogleLogin}
                className="py-3 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-sm font-bold active:scale-98 flex items-center justify-center gap-2 cursor-pointer transition-all text-xs min-w-0 w-full"
              >
                <svg className="w-4 h-4 shrink-0 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
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
                <span className="truncate">ワンタップ開始</span>
              </button>

              <button
                type="button"
                onClick={handleGuestLogin}
                className="py-3 px-3 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-bold rounded-xl border border-slate-200/80 text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 min-w-0 w-full"
              >
                <span>🚀</span>
                <span className="truncate">ゲストで始める</span>
              </button>
            </div>

            <form onSubmit={handleEmailLoginSubmit} className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 space-y-2 w-full max-w-full box-border">
              <div className="flex items-center justify-between gap-2 w-full">
                <span className="text-[11px] font-bold text-slate-600 shrink-0">メール:</span>
                <input
                  type="email"
                  value={demoEmail}
                  onChange={(e) => {
                    setDemoEmail(e.target.value);
                    if (demoEmailError) setDemoEmailError('');
                  }}
                  placeholder="example@email.com"
                  className="flex-1 min-w-0 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-xs shadow-2xs transition-colors cursor-pointer shrink-0"
                >
                  ログイン
                </button>
              </div>
              {demoEmailError && (
                <p className="text-[11px] text-rose-600 font-semibold">{demoEmailError}</p>
              )}
            </form>
          </div>
        )}

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 space-y-2.5 w-full max-w-full box-border">
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-extrabold text-slate-800">🛡️ プライバシー＆端末内ローカル保護設計</span>
            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/70 shrink-0">
              標準搭載
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2.5 w-full">
            <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/70 min-w-0">
              <span className="text-[11px] font-bold text-slate-800 block">顔領域18%自動カット</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">体型写真の上部を自動トリミング</span>
            </div>
            <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/70 min-w-0">
              <span className="text-[11px] font-bold text-slate-800 block">元画像のメモリ即破棄</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">解析後は数値とテキストのみ保存</span>
            </div>
          </div>
          <div className="bg-emerald-50/80 rounded-xl p-2.5 border border-emerald-200/80 text-center w-full">
            <p className="text-[11px] font-bold text-emerald-900 leading-relaxed break-all whitespace-normal">
              🔒 記録データはお使いの端末内にのみ保存され、他のユーザーや外部に共有されることはありません
            </p>
          </div>
        </div>
      </div>

      <p className="text-[10px] text-slate-500 font-semibold text-center py-1">
        🔒 記録データはお使いの端末内にのみ保存され、他のユーザーや外部に共有されることはありません
      </p>
    </div>
  );
}
