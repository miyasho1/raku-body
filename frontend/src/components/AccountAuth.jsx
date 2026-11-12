import React, { useState } from 'react';
import { signInWithEmail, signUpWithEmail } from '../utils/serverSync';

export default function AccountAuth({ onAuthenticated }) {
  const [mode, setMode] = useState('signup');
  const [displayName, setDisplayName] = useState('');
  const [participantCode, setParticipantCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);

  const switchMode = (next) => {
    setMode(next);
    setStatus(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setStatus(null);
    if (!email.trim() || !password) {
      setStatus({ type: 'error', text: 'メールアドレスとパスワードを入れてください。' });
      return;
    }
    if (mode === 'signup') {
      if (!displayName.trim()) {
        setStatus({ type: 'error', text: 'ニックネームを入れてください。' });
        return;
      }
      if (password.length < 8) {
        setStatus({ type: 'error', text: 'パスワードは8文字以上にしてください。' });
        return;
      }
      if (!agreed) {
        setStatus({ type: 'error', text: '記録の保存についての説明を読み、同意のチェックを入れてください。' });
        return;
      }
    }
    setBusy(true);
    const result = mode === 'signup'
      ? await signUpWithEmail({ email, password, displayName, participantCode })
      : await signInWithEmail({ email, password });
    setBusy(false);
    if (!result.ok) {
      setStatus({ type: 'error', text: result.error });
      return;
    }
    if (result.needsConfirm) {
      setStatus({ type: 'success', text: '確認のメールを送りました。メールのリンクを開いてから、「ログイン」で入ってください。' });
      setMode('login');
      return;
    }
    onAuthenticated(result.user);
  };

  const inputClass = 'w-full min-w-0 bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500';

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-3.5 space-y-2.5">
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => switchMode('signup')}
          className={`py-2 text-[11px] font-bold rounded-xl border cursor-pointer ${mode === 'signup' ? 'bg-blue-50 text-blue-700 border-blue-300' : 'bg-white text-slate-600 border-slate-200'}`}
        >
          はじめての方
        </button>
        <button
          type="button"
          onClick={() => switchMode('login')}
          className={`py-2 text-[11px] font-bold rounded-xl border cursor-pointer ${mode === 'login' ? 'bg-blue-50 text-blue-700 border-blue-300' : 'bg-white text-slate-600 border-slate-200'}`}
        >
          ログイン
        </button>
      </div>

      {mode === 'signup' && (
        <div className="grid grid-cols-2 gap-2.5">
          <input
            type="text"
            autoComplete="nickname"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="ニックネーム"
            className={inputClass}
          />
          <input
            type="text"
            autoComplete="off"
            value={participantCode}
            onChange={(e) => setParticipantCode(e.target.value)}
            placeholder="参加者番号（あれば）"
            className={inputClass}
          />
        </div>
      )}
      <input
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="メールアドレス"
        className={inputClass}
      />
      <input
        type="password"
        autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder={mode === 'signup' ? 'パスワード（8文字以上）' : 'パスワード'}
        className={inputClass}
      />

      {mode === 'signup' && (
        <label className="flex items-start gap-2.5 bg-slate-50 rounded-xl border border-slate-200/80 p-3.5 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 shrink-0"
          />
          <span className="text-[10px] text-slate-600 leading-relaxed">
            ニックネーム・メールアドレス・参加者番号と、記録（体重・身長・目標・食事・運動・体型分析の結果など）は、研究のためにサーバーに保存され、研究の担当者が見ることがあります。写真そのものはサーバーに保存しません（AIで分析するときは、GoogleのGeminiに送られます）。参加をやめたいときや、記録を消してほしいときは、研究の担当者に伝えてください（消去します）。この説明に同意します。
          </span>
        </label>
      )}

      {status && (
        <div className={`text-[11px] font-bold px-2.5 py-1.5 rounded-xl border leading-relaxed ${status.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80' : 'bg-rose-50 text-rose-700 border-rose-200/80'}`}>
          {status.text}
        </div>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-2xs cursor-pointer disabled:opacity-50"
      >
        {busy ? '送信中...' : mode === 'signup' ? 'アカウントを作ってはじめる' : 'ログインする'}
      </button>
    </form>
  );
}
