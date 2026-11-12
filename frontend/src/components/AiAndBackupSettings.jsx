import React, { useRef, useState } from 'react';
import { getStoredGeminiKey, setStoredGeminiKey, testGeminiConnection } from '../utils/geminiAnalyzer';

const BACKUP_PREFIX = 'raku_';
const EXCLUDED_KEYS = ['raku_gemini_api_key'];

function collectBackupData() {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(BACKUP_PREFIX) && !EXCLUDED_KEYS.includes(key)) {
      data[key] = localStorage.getItem(key);
    }
  }
  return data;
}

function formatStamp(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`;
}

export default function AiAndBackupSettings({ onRestored }) {
  const [keyInput, setKeyInput] = useState('');
  const [hasKey, setHasKey] = useState(() => Boolean(getStoredGeminiKey()));
  const [aiStatus, setAiStatus] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [backupStatus, setBackupStatus] = useState(null);
  const importInputRef = useRef(null);

  const handleSaveKey = async () => {
    const key = keyInput.trim();
    if (!key) return;
    setIsTesting(true);
    setAiStatus(null);
    const ok = await testGeminiConnection(key);
    setIsTesting(false);
    if (ok) {
      setStoredGeminiKey(key);
      setHasKey(true);
      setKeyInput('');
      setAiStatus({ type: 'success', text: '接続を確認し、この端末に保存しました。' });
    } else {
      setAiStatus({ type: 'error', text: '接続できませんでした。キーが正しいか、通信できるかを確認してください（保存していません）。' });
    }
  };

  const handleTestSaved = async () => {
    setIsTesting(true);
    setAiStatus(null);
    const ok = await testGeminiConnection(getStoredGeminiKey());
    setIsTesting(false);
    setAiStatus(ok
      ? { type: 'success', text: '保存済みのキーでAIに接続できました。' }
      : { type: 'error', text: '保存済みのキーで接続できませんでした。' });
  };

  const handleRemoveKey = () => {
    setStoredGeminiKey('');
    setHasKey(false);
    setAiStatus({ type: 'success', text: 'この端末からキーを削除しました。' });
  };

  const handleExport = () => {
    const payload = {
      app: 'raku-body',
      exported_at: new Date().toISOString(),
      data: collectBackupData()
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `raku-body_backup_${formatStamp(new Date())}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setBackupStatus({ type: 'success', text: `記録を書き出しました（${Object.keys(payload.data).length}項目）。` });
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!parsed || parsed.app !== 'raku-body' || typeof parsed.data !== 'object') {
        throw new Error('invalid');
      }
      const entries = Object.entries(parsed.data).filter(([k, v]) => k.startsWith(BACKUP_PREFIX) && !EXCLUDED_KEYS.includes(k) && typeof v === 'string');
      if (!window.confirm(`バックアップ（${entries.length}項目）を読み込みます。今の端末の同じ記録は上書きされます。よろしいですか？`)) return;
      entries.forEach(([k, v]) => localStorage.setItem(k, v));
      setBackupStatus({ type: 'success', text: `${entries.length}項目を読み込みました。` });
      if (onRestored) onRestored();
    } catch {
      setBackupStatus({ type: 'error', text: 'このファイルは読み込めませんでした（らくボディのバックアップではありません）。' });
    } finally {
      if (importInputRef.current) importInputRef.current.value = '';
    }
  };

  const statusClass = (s) => (s.type === 'success'
    ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80'
    : 'bg-rose-50 text-rose-700 border-rose-200/80');

  return (
    <>
      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2">
        <div className="flex items-center justify-between gap-2.5">
          <div className="text-xs font-extrabold text-slate-800">AI（Gemini）の設定</div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-xl border ${hasKey ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80' : 'bg-white text-slate-500 border-slate-200'}`}>
            {hasKey ? 'キー保存済み' : '未設定'}
          </span>
        </div>
        <p className="text-[10px] text-slate-500 leading-relaxed">
          自分のGemini APIキーを入れると、写真の分析にAIを使えます。AIで分析するとき、写真（体型写真は上の部分を切り取ったもの）はGoogleのGeminiに送られます。キーはこの端末に保存され、書き出しのファイルには入りません。
        </p>
        <div className="flex items-center gap-2.5">
          <input
            type="password"
            autoComplete="off"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder="APIキーを貼り付け"
            className="flex-1 min-w-0 text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
          />
          <button
            type="button"
            disabled={!keyInput.trim() || isTesting}
            onClick={handleSaveKey}
            className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-xl shrink-0 cursor-pointer disabled:opacity-50"
          >
            {isTesting ? '確認中...' : '確認して保存'}
          </button>
        </div>
        {hasKey && (
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={isTesting}
              onClick={handleTestSaved}
              className="py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-bold rounded-xl border border-slate-200 cursor-pointer disabled:opacity-50"
            >
              接続テスト
            </button>
            <button
              type="button"
              onClick={handleRemoveKey}
              className="py-1.5 bg-white hover:bg-rose-50 text-rose-600 text-[11px] font-bold rounded-xl border border-rose-200/80 cursor-pointer"
            >
              キーを削除
            </button>
          </div>
        )}
        {aiStatus && (
          <div className={`text-[10px] font-bold px-2.5 py-1.5 rounded-xl border leading-relaxed ${statusClass(aiStatus)}`}>
            {aiStatus.text}
          </div>
        )}
      </div>

      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2">
        <div className="text-xs font-extrabold text-slate-800">記録のバックアップ</div>
        <p className="text-[10px] text-slate-500 leading-relaxed">
          記録はこの端末に保存されています。こまめにファイルへ書き出しておくと、消えたときに戻せます。書き出したファイルには体重などの記録と、ログイン中のアカウント名が含まれるので、人に渡さないでください。
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleExport}
            className="py-2 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-bold rounded-xl border border-slate-200 cursor-pointer"
          >
            ファイルに書き出す
          </button>
          <button
            type="button"
            onClick={() => importInputRef.current?.click()}
            className="py-2 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-bold rounded-xl border border-slate-200 cursor-pointer"
          >
            ファイルから戻す
          </button>
        </div>
        <input
          ref={importInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleImport}
          className="hidden"
        />
        {backupStatus && (
          <div className={`text-[10px] font-bold px-2.5 py-1.5 rounded-xl border leading-relaxed ${statusClass(backupStatus)}`}>
            {backupStatus.text}
          </div>
        )}
      </div>
    </>
  );
}
