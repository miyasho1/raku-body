import React, { useState } from 'react';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../utils/serverConfig';
import { getHealthCode, regenerateHealthCode, pullHealthImports, getHealthDaily } from '../utils/healthSync';

const formatDateTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
};

function CopyRow({ label, value }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
    }
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 px-3.5 py-2 space-y-1">
      <div className="flex items-center justify-between gap-2.5">
        <span className="text-[10px] font-bold text-slate-500">{label}</span>
        <button type="button" onClick={copy} className="text-[10px] font-bold text-blue-600 cursor-pointer shrink-0">
          {copied ? 'コピーしました' : 'コピー'}
        </button>
      </div>
      <div className="text-[10px] text-slate-800 font-mono break-all">{value}</div>
    </div>
  );
}

export default function HealthLinkSettings({ authUser, onImported }) {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const daily = getHealthDaily();
  const latest = daily.length > 0 ? daily[daily.length - 1] : null;

  const endpoint = `${SUPABASE_URL}/rest/v1/rpc/import_health`;

  const handleShowCode = async () => {
    setBusy(true);
    setStatus(null);
    const r = await getHealthCode();
    setBusy(false);
    if (r.ok) setCode(r.code);
    else setStatus({ type: 'error', text: r.notReady ? 'サーバーの準備がまだです（研究の担当者に伝えてください）。' : '連携コードを用意できませんでした。通信を確認してください。' });
  };

  const handleRegenerate = async () => {
    if (!window.confirm('連携コードを作り直します。前のコードを入れたショートカットは使えなくなります。よろしいですか？')) return;
    setBusy(true);
    setStatus(null);
    const r = await regenerateHealthCode();
    setBusy(false);
    if (r.ok) {
      setCode(r.code);
      setStatus({ type: 'success', text: '新しい連携コードを作りました。ショートカットのコードも入れ替えてください。' });
    } else {
      setStatus({ type: 'error', text: '作り直せませんでした。通信を確認してください。' });
    }
  };

  const handlePull = async () => {
    setBusy(true);
    setStatus(null);
    const r = await pullHealthImports(authUser.uid);
    setBusy(false);
    if (r.ok) {
      setStatus({ type: 'success', text: r.count > 0 ? `ヘルスケアの記録を${r.count}日分読み込みました。` : 'まだヘルスケアの記録は届いていません。' });
      if (onImported) onImported();
    } else {
      setStatus({ type: 'error', text: '読み込めませんでした。通信を確認してください。' });
    }
  };

  return (
    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2.5">
      <div className="text-xs font-extrabold text-slate-800">ヘルスケアとの連携（iPhone）</div>
      <p className="text-[10px] text-slate-500 leading-relaxed">
        iPhoneの「ショートカット」で、ヘルスケアの歩数・消費エネルギー・体重を、らくボディのサーバーに送ります。連携すると、これらは研究のためにサーバーに保存され、研究の担当者が見ることがあります。届いた体重は、その日の体重の記録がないときだけ追加します。やめたいときは、オートメーションを消して、「連携コードを表示」→「連携コードを作り直す」を押してください（それまでの記録を消してほしいときは、研究の担当者に伝えてください）。
      </p>
      {latest && (
        <div className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200/80 rounded-xl px-3.5 py-2 leading-relaxed">
          最新：{latest.day}（歩数 {latest.steps ?? '-'}、活動 {latest.active_kcal ?? '-'}kcal、安静時 {latest.basal_kcal ?? '-'}kcal、体重 {latest.weight ?? '-'}kg）{latest.received_at ? ` ／ 受信 ${formatDateTime(latest.received_at)}` : ''}
        </div>
      )}
      <div className="grid grid-cols-2 gap-2.5">
        <button type="button" disabled={busy} onClick={handleShowCode} className="py-2 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-bold rounded-xl border border-slate-200 cursor-pointer disabled:opacity-50">
          連携コードを表示
        </button>
        <button type="button" disabled={busy} onClick={handlePull} className="py-2 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-bold rounded-xl border border-slate-200 cursor-pointer disabled:opacity-50">
          今すぐ読み込む
        </button>
      </div>
      {code && (
        <div className="space-y-2.5">
          <CopyRow label="連携コード（人に見せない：見た人があなたの記録として送れてしまいます）" value={code} />
          <button type="button" disabled={busy} onClick={handleRegenerate} className="w-full py-2 bg-white hover:bg-rose-50 text-rose-600 text-[11px] font-bold rounded-xl border border-rose-200/80 cursor-pointer disabled:opacity-50">
            連携コードを作り直す
          </button>
        </div>
      )}
      {status && (
        <div className={`text-[10px] font-bold px-3.5 py-2 rounded-xl border leading-relaxed ${status.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80' : 'bg-rose-50 text-rose-700 border-rose-200/80'}`}>
          {status.text}
        </div>
      )}
      <button type="button" onClick={() => setShowGuide((v) => !v)} className="w-full text-left text-[11px] font-bold text-blue-600 cursor-pointer">
        {showGuide ? '▼ ショートカットの作り方を閉じる' : '▶ ショートカットの作り方を見る'}
      </button>
      {showGuide && (
        <div className="space-y-2.5 text-[10px] text-slate-700 leading-relaxed">
          <p>iPhoneの「ショートカット」アプリで、右上の「＋」から新しいショートカットを作り、次の順にアクションを追加します。</p>
          <ol className="list-decimal pl-4 space-y-1.5">
            <li>「ヘルスケアサンプルを検索」を追加し、種類を「歩数」にする。「フィルタを追加」で「開始日」が「今日」、「ソース」を1つだけにする（スマートウォッチを使っている人はその時計のアプリ（Zeppなど）、使っていない人はiPhone。二重に数えないため）。</li>
            <li>「統計を計算」を追加し、「合計」にする。</li>
            <li>1〜2を「アクティブエネルギー」と「安静時消費エネルギー」でもくり返す（ソースは1と同じもの）。</li>
            <li>「ヘルスケアサンプルを検索」を追加し、種類を「体重」にし、「フィルタを追加」で「開始日」が「今日」にする。並べ替えを「開始日」の「新しい順」、「制限」をオンにして「1」にする（今日量っていなければ空で送られ、前の体重は送られません）。</li>
            <li>「URLの内容を取得」を追加し、URLに下の「送り先」を入れる。「詳細」を開き、方法を「POST」にする。</li>
            <li>ヘッダに「apikey」（値は下の「キー」）と「Content-Type」（値は application/json）を追加する。</li>
            <li>本文を「JSON」にして、テキストの項目を5つ追加する：p_code（連携コード）、p_steps（歩数の「統計を計算」の結果）、p_active_kcal（アクティブエネルギーの「統計を計算」の結果）、p_basal_kcal（安静時消費エネルギーの「統計を計算」の結果）、p_weight（手順4の体重）。</li>
            <li>右下の再生ボタンで実行し、「ok」と出れば成功。らくボディで「今すぐ読み込む」を押して確かめる。</li>
            <li>毎日送るには、「オートメーション」→「＋」→「時刻」で寝る前の時刻（例：22:00）にし、「すぐに実行」を選んで、このショートカットを選ぶ。iPhoneがロック中だとヘルスケアを読めず、送れないことがあります。そのときは、寝る前に手で実行してください。</li>
          </ol>
          <CopyRow label="送り先（URL）" value={endpoint} />
          <CopyRow label="キー（apikey）" value={SUPABASE_ANON_KEY} />
          <p className="text-slate-500">項目の名前がiPhoneの表示と少し違うことがあります。分からないときは、画面のスクリーンショットを研究の担当者に送ってください。</p>
        </div>
      )}
    </div>
  );
}
