import React, { useEffect, useState } from 'react';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../utils/serverConfig';

export function readHealthImportParams() {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash || '';
  if (!hash.startsWith('#health-import')) return null;
  const q = hash.split('?')[1] || '';
  const params = {};
  q.split('&').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx <= 0) return;
    const key = pair.slice(0, idx);
    let value = pair.slice(idx + 1);
    try {
      value = decodeURIComponent(value.replace(/\+/g, ' '));
    } catch {
    }
    params[key] = value;
  });
  return params;
}

const shownNumber = (v) => {
  if (v === null || v === undefined || v === '') return '';
  const m = String(v).replace(/,/g, '').match(/d+(?:.d+)?/);
  return m ? m[0] : '';
};

export default function HealthImportPage({ params, onClose }) {
  const [state, setState] = useState({ status: 'sending', text: '' });

  useEffect(() => {
    const run = async () => {
      if (!params.code) {
        setState({ status: 'error', text: '連携コードが入っていません。ショートカットの設定を確かめてください。' });
        return;
      }
      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        setState({ status: 'error', text: 'サーバーの設定がまだです。研究の担当者に伝えてください。' });
        return;
      }
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/import_health`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY },
          body: JSON.stringify({
            p_code: params.code,
            p_steps: params.steps || null,
            p_active_kcal: params.active || null,
            p_basal_kcal: params.basal || null,
            p_weight: params.weight || null
          })
        });
        if (res.ok) {
          setState({ status: 'ok', text: '' });
        } else {
          let message = '';
          try {
            const j = await res.json();
            message = j && j.message ? j.message : '';
          } catch {
          }
          setState({
            status: 'error',
            text: /invalid code/i.test(message)
              ? '連携コードが正しくありません。らくボディの「ヘルスケアとの連携」で、今のコードを確かめてください。'
              : `送れませんでした（コード ${res.status}）。少し待ってから、もう一度試してください。`
          });
        }
      } catch {
        setState({ status: 'error', text: '通信できませんでした。電波やWi-Fiを確認してください。' });
      } finally {
        try {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        } catch {
        }
      }
    };
    run();
  }, []);

  const row = (label, value, unit) => (
    <div className="flex items-center justify-between bg-slate-50 rounded-xl border border-slate-200/80 px-3.5 py-2.5">
      <span className="text-xs font-bold text-slate-600">{label}</span>
      <span className="text-sm font-black text-slate-900 tabular-nums">{shownNumber(value) ? `${shownNumber(value)}${unit}` : '-'}</span>
    </div>
  );

  return (
    <div className="min-h-[100dvh] bg-slate-100 sm:bg-slate-200/70 flex justify-center items-center sm:py-4 sm:px-4">
      <div className="w-full sm:max-w-[430px] h-[100dvh] sm:h-[880px] relative overflow-hidden flex flex-col items-center justify-center rounded-none sm:rounded-[44px] shadow-none sm:shadow-2xl border-0 sm:border sm:border-slate-300 bg-slate-100 p-3.5">
      <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-200/80 p-3.5 space-y-3">
        <h1 className="text-base font-black text-slate-900">ヘルスケアの記録を送る</h1>
        {state.status === 'sending' && <p className="text-sm text-slate-600">送っています…</p>}
        {state.status === 'ok' && (
          <p className="text-sm font-bold text-emerald-700">✅ 送信しました。このページは閉じて大丈夫です。らくボディを開くと、記録が反映されます（体重は、その日の記録がないときだけ追加されます）。</p>
        )}
        {state.status === 'error' && <p className="text-sm font-bold text-rose-700 leading-relaxed">⚠️ {state.text}</p>}
        <div className="space-y-2.5">
          {row('歩数', params.steps, '歩')}
          {row('アクティブエネルギー', params.active, 'kcal')}
          {params.basal ? row('安静時エネルギー', params.basal, 'kcal') : null}
          {row('体重', params.weight, 'kg')}
        </div>
        <button type="button" onClick={onClose} className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold cursor-pointer">
          らくボディを開く
        </button>
        <p className="text-[11px] text-slate-500 leading-relaxed">{state.status === 'ok' ? '記録はサーバーに届いています。' : ''}ふだんは、ホーム画面に追加したらくボディから開いてください（このブラウザでは、ログインの画面が出ることがあります）。</p>
      </div>
      </div>
    </div>
  );
}
