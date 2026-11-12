import React, { useRef, useState } from 'react';
import { getStoredGeminiKey, setStoredGeminiKey, testGeminiConnection } from '../utils/geminiAnalyzer';
import { getCurrentAuthUser } from '../utils/authService';
import { pushAllLocalRecords } from '../utils/serverSync';

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
  const [showKeyGuide, setShowKeyGuide] = useState(false);
  const importInputRef = useRef(null);

  const handleSaveKey = async () => {
    const key = keyInput.trim();
    if (!key) return;
    setIsTesting(true);
    setAiStatus(null);
    const { ok, reason } = await testGeminiConnection(key);
    setIsTesting(false);
    if (ok) {
      setStoredGeminiKey(key);
      setHasKey(true);
      setKeyInput('');
      setAiStatus({ type: 'success', text: '接続を確認し、この端末に保存しました。' });
    } else {
      setAiStatus({ type: 'error', text: `接続できませんでした（保存していません）。${reason}` });
    }
  };

  const handleTestSaved = async () => {
    setIsTesting(true);
    setAiStatus(null);
    const { ok, reason } = await testGeminiConnection(getStoredGeminiKey());
    setIsTesting(false);
    setAiStatus(ok
      ? { type: 'success', text: '保存済みのキーでAIに接続できました。' }
      : { type: 'error', text: `保存済みのキーで接続できませんでした。${reason}` });
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
      const current = getCurrentAuthUser();
      if (current && current.authProvider === 'server') {
        await pushAllLocalRecords(current.uid, current.id);
      }
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
          自分のGemini APIキーを入れると、写真の分析にAIを使えます。AIで分析するとき、写真はGoogleのGeminiに送られます（体型写真は、送る前に顔が写っていないか調べます）。無料のキーで送った写真や内容は、Googleの人がサービスの改善のために見ることがあります（Googleの規約による。送られる前に、アカウントとのつながりは外されます）。顔や、人に知られたくないものが写った写真は送らないでください。キーはこの端末に保存され、書き出しのファイルには入りません。
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
        {!hasKey && (
          <button
            type="button"
            onClick={() => setShowKeyGuide((v) => !v)}
            className="w-full text-left text-[11px] font-bold text-blue-600 cursor-pointer"
          >
            {showKeyGuide ? '▼ APIキーの作り方を閉じる' : '▶ APIキーの作り方を見る（無料・数分）'}
          </button>
        )}
        {!hasKey && showKeyGuide && (
          <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 space-y-2.5">
            <ol className="list-decimal pl-4 space-y-1.5 text-[11px] text-slate-700 leading-relaxed">
              <li>下のボタンで Google AI Studio を開き、Googleアカウントでログインする（画面が英語のときは「Create API key」がキーを作るボタンです）</li>
              <li>「APIキーを作成」（Create API key）を押す。プロジェクトを選ぶ画面が出たら、一番上のものでOK</li>
              <li>できたキー（AIza で始まる長い文字）の横のコピーを押す</li>
              <li>このアプリに戻り、上の欄に貼り付けて「確認して保存」を押す</li>
              <li>「接続を確認し、この端末に保存しました」と出れば完了</li>
            </ol>
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center py-2 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-xl"
            >
              Google AI Studio を開く
            </a>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              キーは人に見せたり、SNSやチャットに貼ったりしないでください。無料で使える回数には上限があります。無料のキーで送った写真や内容は、Googleの人がサービスの改善のために見ることがあります（Googleの規約による。送られる前に、アカウントとのつながりは外されます）。顔や、人に知られたくないものが写った写真は送らないでください。AI Studio が使えないときは、研究の担当者に伝えてください。
            </p>
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
