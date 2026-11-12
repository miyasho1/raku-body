import React, { useState, useEffect, useRef } from 'react';
import { processPrivacyImage, revokeImagePreviewUrl } from '../utils/geminiAnalyzer';
import { getUserStorageData, setUserStorageData } from '../utils/authService';
import {
  METRIC_DEFS,
  analyzeBodyPhoto,
  compareToIdeal,
  progressSummary,
  BODY_PHOTO_MESSAGES
} from '../utils/bodyCompare';

const formatDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : `${d.getMonth() + 1}/${d.getDate()}`;
};

const formatValue = (v, d) => (v === null || v === undefined ? '-' : `${Number(v).toFixed(d.digits)}${d.unit}`);

function ClosenessChart({ points }) {
  if (points.length === 0) return null;
  const w = 290;
  const h = 110;
  const padX = 22;
  const padY = 16;
  const xs = points.map((_, i) => (points.length === 1 ? w / 2 : padX + (i / (points.length - 1)) * (w - padX * 2)));
  const ys = points.map((p) => padY + (1 - p.closeness / 100) * (h - padY * 2));
  const line = xs.map((x, i) => `${x},${ys[i]}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" role="img" aria-label="理想への近さの推移">
      {[0, 50, 100].map((v) => {
        const y = padY + (1 - v / 100) * (h - padY * 2);
        return (
          <g key={v}>
            <line x1={padX} x2={w - padX} y1={y} y2={y} stroke="#e2e8f0" strokeWidth="1" />
            <text x={2} y={y + 3} fontSize="8" fill="#94a3b8">{v}</text>
          </g>
        );
      })}
      {points.length > 1 && <polyline points={line} fill="none" stroke="#4f46e5" strokeWidth="2" />}
      {points.map((p, i) => (
        <g key={`${p.at}_${i}`}>
          <circle cx={xs[i]} cy={ys[i]} r="3.5" fill="#4f46e5" />
          <text x={xs[i]} y={ys[i] - 7} fontSize="8" textAnchor="middle" fill="#3730a3" fontWeight="700">{p.closeness}%</text>
          <text x={xs[i]} y={h - 2} fontSize="8" textAnchor="middle" fill="#64748b">{formatDate(p.at)}</text>
        </g>
      ))}
    </svg>
  );
}

export default function BodyAnalysisScreen({ onBack, onApplyWorkoutMenu }) {
  const [isCropEnabled, setIsCropEnabled] = useState(true);
  const [idealRaw, setIdealRaw] = useState(null);
  const [idealFile, setIdealFile] = useState(null);
  const [idealPreview, setIdealPreview] = useState(null);
  const [currentRaw, setCurrentRaw] = useState(null);
  const [currentFile, setCurrentFile] = useState(null);
  const [currentPreview, setCurrentPreview] = useState(null);
  const [busy, setBusy] = useState(null);
  const [message, setMessage] = useState(null);
  const [ideal, setIdeal] = useState(() => getUserStorageData('body_ideal', null));
  const [latest, setLatest] = useState(() => {
    const cached = getUserStorageData('body_analysis', null);
    return cached && cached.source === 'ai_gemini' ? cached : null;
  });
  const [history, setHistory] = useState(() => {
    const h = getUserStorageData('body_analysis_history', []);
    return Array.isArray(h) ? h : [];
  });
  const [resultTab, setResultTab] = useState('compare');

  const idealInputRef = useRef(null);
  const currentInputRef = useRef(null);

  useEffect(() => () => {
    if (idealPreview) revokeImagePreviewUrl(idealPreview);
    if (currentPreview) revokeImagePreviewUrl(currentPreview);
  }, []);

  const preparePhoto = async (file, crop) => processPrivacyImage(file, crop);

  const handleToggleCrop = async () => {
    const next = !isCropEnabled;
    setIsCropEnabled(next);
    if (idealRaw) {
      if (idealPreview) revokeImagePreviewUrl(idealPreview);
      const p = await preparePhoto(idealRaw, next);
      setIdealFile(p.processedFile);
      setIdealPreview(p.previewUrl);
    }
    if (currentRaw) {
      if (currentPreview) revokeImagePreviewUrl(currentPreview);
      const p = await preparePhoto(currentRaw, next);
      setCurrentFile(p.processedFile);
      setCurrentPreview(p.previewUrl);
    }
  };

  const handleIdealChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (idealPreview) revokeImagePreviewUrl(idealPreview);
    setMessage(null);
    setIdealRaw(file);
    const p = await preparePhoto(file, isCropEnabled);
    setIdealFile(p.processedFile);
    setIdealPreview(p.previewUrl);
  };

  const handleCurrentChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (currentPreview) revokeImagePreviewUrl(currentPreview);
    setMessage(null);
    setCurrentRaw(file);
    const p = await preparePhoto(file, isCropEnabled);
    setCurrentFile(p.processedFile);
    setCurrentPreview(p.previewUrl);
  };

  const clearIdealPhoto = () => {
    if (idealPreview) revokeImagePreviewUrl(idealPreview);
    setIdealRaw(null);
    setIdealFile(null);
    setIdealPreview(null);
    if (idealInputRef.current) idealInputRef.current.value = '';
  };

  const clearCurrentPhoto = () => {
    if (currentPreview) revokeImagePreviewUrl(currentPreview);
    setCurrentRaw(null);
    setCurrentFile(null);
    setCurrentPreview(null);
    if (currentInputRef.current) currentInputRef.current.value = '';
  };

  const handleAnalyzeIdeal = async () => {
    if (!idealFile || busy) return;
    setBusy('ideal');
    setMessage(null);
    try {
      const result = await analyzeBodyPhoto(idealFile);
      if (result.status !== 'ok') {
        setMessage({ type: 'error', text: BODY_PHOTO_MESSAGES[result.status] });
        return;
      }
      const next = {
        id: `ideal_${Date.now()}`,
        analyzed_at: new Date().toISOString(),
        metrics: result.metrics,
        summary: result.analysis.summary || result.analysis.analysis_summary || ''
      };
      setIdeal(next);
      setUserStorageData('body_ideal', next);
      setMessage({ type: 'success', text: '理想の体型を数値にしました。次に、今の体型の写真で比べてください。端末内の元画像は破棄しました（分析のため写真はGoogleのGeminiに送信済み）。' });
    } catch {
      setMessage({ type: 'error', text: '分析中にエラーが発生しました。' });
    } finally {
      clearIdealPhoto();
      setBusy(null);
    }
  };

  const handleAnalyzeCurrent = async () => {
    if (!currentFile || busy) return;
    setBusy('current');
    setMessage(null);
    try {
      const result = await analyzeBodyPhoto(currentFile);
      if (result.status !== 'ok') {
        setMessage({ type: 'error', text: BODY_PHOTO_MESSAGES[result.status] });
        return;
      }
      const cmp = ideal ? compareToIdeal(result.metrics, ideal.metrics) : null;
      const entry = {
        ...result.analysis,
        ideal_id: ideal ? ideal.id : null,
        closeness: cmp ? cmp.closeness : null,
        mean_gap: cmp ? cmp.meanGap : null
      };
      const nextHistory = [entry, ...history];
      setLatest(entry);
      setHistory(nextHistory);
      setUserStorageData('body_analysis', entry);
      setUserStorageData('body_analysis_history', nextHistory);
      setResultTab('compare');
      setMessage({
        type: 'success',
        text: ideal
          ? '今の体型を分析して、理想と比べました。端末内の元画像は破棄しました（分析のため写真はGoogleのGeminiに送信済み）。'
          : '今の体型を分析しました。①で理想の体型を数値にすると、理想との近さが出ます。端末内の元画像は破棄しました（分析のため写真はGoogleのGeminiに送信済み）。'
      });
    } catch {
      setMessage({ type: 'error', text: '分析中にエラーが発生しました。' });
    } finally {
      clearCurrentPhoto();
      setBusy(null);
    }
  };

  const comparison = latest && ideal ? compareToIdeal(latest.metrics, ideal.metrics) : null;
  const progress = ideal ? progressSummary(history, ideal) : null;

  const photoBox = (step, title, preview, inputId, onClear, emptyLabel) => (
    <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/70 flex flex-col space-y-2.5">
      <span className="text-[11px] font-bold text-slate-900 flex items-center gap-2.5">
        <span className="w-4 h-4 rounded bg-blue-600 text-white flex items-center justify-center text-[9px]">{step}</span>
        <span>{title}</span>
      </span>
      {preview ? (
        <div className="relative h-28 rounded-xl overflow-hidden border border-slate-200 bg-white">
          <img src={preview} alt={title} className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={onClear}
            className="absolute top-1 right-1 px-2 py-0.5 rounded bg-black/70 text-white text-[9px] font-bold cursor-pointer"
          >
            変更
          </button>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className="h-28 rounded-xl border border-dashed border-slate-300 hover:border-blue-500 bg-white flex flex-col items-center justify-center cursor-pointer p-3.5 text-center"
        >
          <span className="text-xs font-bold text-blue-600">＋ 写真を選ぶ</span>
          <span className="text-[9px] text-slate-400 mt-0.5">{emptyLabel}</span>
        </label>
      )}
    </div>
  );

  return (
    <div className="flex flex-col space-y-3.5 pb-3">
      <div className="flex items-center justify-between gap-2.5 px-0.5">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-xl cursor-pointer shadow-2xs shrink-0"
        >
          ‹ ホームへ戻る
        </button>
        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-xl">
          🔒 送る前に顔が写っていないか調べます
        </span>
      </div>

      {message && (
        <div className={`p-3.5 rounded-xl text-[11px] font-bold text-center border ${
          message.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-rose-50 text-rose-700 border-rose-200'
        }`}>
          {message.text}
        </div>
      )}

      <section className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-sm space-y-3">
        <div className="bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200/80 space-y-1">
          <span className="text-xs font-extrabold text-slate-900 block leading-tight">🛡️ 送る前に、顔が写っていないか調べます</span>
          <span className="text-[10px] text-slate-500 block leading-relaxed">
            写真を送る前に、この端末の中で顔が写っていないかを自動で調べます。顔が見つかったときは送りません。ただし見落とすこともあるので、首から下を撮ってください。分析するときは、写真がGoogleのGeminiに送られます。理想の写真は、自分で撮った写真か、使ってよい写真を選んでください。
          </span>
          <div className="flex items-center justify-between gap-2.5 pt-1">
            <span className="text-[10px] text-slate-600 font-bold">写真の上18%を切り取る</span>
            <button
              type="button"
              onClick={handleToggleCrop}
              className={`px-3 py-1 rounded-xl text-[11px] font-extrabold cursor-pointer shrink-0 border ${
                isCropEnabled ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-300'
              }`}
            >
              {isCropEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        <input ref={idealInputRef} type="file" accept="image/*" onChange={handleIdealChange} className="hidden" id="ideal-file-input" />
        <input ref={currentInputRef} type="file" accept="image/*" onChange={handleCurrentChange} className="hidden" id="current-file-input" />

        <div className="grid grid-cols-2 gap-2.5">
          {photoBox('1', ideal ? '理想（変える）' : '理想の体型', idealPreview, 'ideal-file-input', clearIdealPhoto, '目標にしたい体型')}
          {photoBox('2', '今の体型', currentPreview, 'current-file-input', clearCurrentPhoto, '首から下を正面から')}
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleAnalyzeIdeal}
            disabled={!idealFile || Boolean(busy)}
            className="py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-[11px] cursor-pointer disabled:opacity-40"
          >
            {busy === 'ideal' ? '数値にしています...' : '① 理想を数値にする'}
          </button>
          <button
            type="button"
            onClick={handleAnalyzeCurrent}
            disabled={!currentFile || Boolean(busy)}
            className="py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-[11px] cursor-pointer disabled:opacity-40"
          >
            {busy === 'current' ? '分析しています...' : '② 今の体型と比べる'}
          </button>
        </div>
        {ideal && (
          <p className="text-[10px] text-slate-500 leading-relaxed">
            理想は{formatDate(ideal.analyzed_at)}に数値にしたものを使っています。理想を変えると、「最初」の基準も新しくなります。
          </p>
        )}
      </section>

      <section className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-200/80 space-y-3">
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { key: 'compare', label: '📈 理想との比較' },
            { key: 'summary', label: '📋 総評' },
            { key: 'menu', label: '💪 メニュー' }
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setResultTab(t.key)}
              className={`py-2 text-[11px] font-bold rounded-xl border cursor-pointer ${
                resultTab === t.key ? 'bg-blue-50 text-blue-700 border-blue-300' : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {resultTab === 'compare' && (
          <div className="space-y-3">
            {!ideal && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 text-center text-[11px] text-slate-500 leading-relaxed">
                まず①で、目標にしたい体型の写真を数値にしてください。そのあと②で今の体型を分析すると、理想にどれだけ近いかが出ます。
              </div>
            )}
            {ideal && !comparison && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 text-center text-[11px] text-slate-500 leading-relaxed">
                理想の数値は保存されています。②で今の体型を分析すると、理想との差と近さが出ます。
              </div>
            )}
            {comparison && (
              <>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-indigo-50 rounded-xl p-3.5 border border-indigo-200/80">
                    <span className="text-[10px] font-bold text-indigo-700 block">理想への近さ</span>
                    <span className="text-2xl font-black text-indigo-800 tabular-nums">{comparison.closeness}%</span>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-3.5 border border-emerald-200/80">
                    <span className="text-[10px] font-bold text-emerald-700 block">最初からの変化</span>
                    {progress && progress.points.length > 1 ? (
                      <>
                        <span className="text-2xl font-black text-emerald-800 tabular-nums">
                          {progress.gainPoints > 0 ? '+' : ''}{progress.gainPoints}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700"> ポイント</span>
                        {progress.achievement !== null && progress.achievement > 0 && (
                          <span className="text-[10px] text-emerald-700 block">差の{progress.achievement}%を縮めた</span>
                        )}
                        {progress.achievement !== null && progress.achievement < 0 && (
                          <span className="text-[10px] text-emerald-700 block">最初より差が{Math.abs(progress.achievement)}%広がった</span>
                        )}
                      </>
                    ) : (
                      <span className="text-[10px] text-emerald-800 block leading-relaxed mt-1">次に分析すると、最初からどれだけ近づいたかが出ます</span>
                    )}
                  </div>
                </div>

                {progress && progress.points.length > 0 && !progress.latestIncluded && latest && latest.ideal_id === ideal.id && (
                  <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200/80 rounded-xl px-3.5 py-2 leading-relaxed">
                    今回の写真では、最初と同じ項目がそろわなかったため（例：肩と腰が写っていない）、最初からの変化と推移には入れていません。
                  </p>
                )}

                {progress && progress.points.length > 0 && (
                  <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/70 space-y-2.5">
                    <span className="text-[11px] font-bold text-slate-800 block">理想への近さの推移</span>
                    <ClosenessChart points={progress.points.slice(-8)} />
                  </div>
                )}

                <div className="rounded-xl border border-slate-200/70 overflow-hidden">
                  <div className="grid grid-cols-[1.6fr_1fr_1fr_1fr] gap-2.5 bg-slate-100 px-3.5 py-2 text-[10px] font-bold text-slate-600">
                    <span>項目</span>
                    <span className="text-right">今</span>
                    <span className="text-right">理想</span>
                    <span className="text-right">あと</span>
                  </div>
                  {comparison.items.map((it) => (
                    <div key={it.key} className="grid grid-cols-[1.6fr_1fr_1fr_1fr] gap-2.5 px-3.5 py-2 text-[11px] border-t border-slate-200/70 bg-white">
                      <span className="font-bold text-slate-800 leading-tight">{it.label}</span>
                      <span className="text-right tabular-nums text-slate-700">{formatValue(it.current, it)}</span>
                      <span className="text-right tabular-nums text-indigo-700 font-bold">{formatValue(it.ideal, it)}</span>
                      <span className={`text-right tabular-nums font-bold ${Math.abs(it.diff) < 1e-9 ? 'text-emerald-600' : 'text-slate-700'}`}>
                        {Math.abs(it.diff) < 1e-9 ? '一致' : `${it.diff > 0 ? '+' : ''}${it.diff.toFixed(it.digits)}${it.unit}`}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  「肩幅÷腰幅」は、この端末で骨格（肩と腰の位置）を検出して計算した値です。そのほかは、AI（Gemini）が写真から推定した値です（点数は1〜5）。理想への近さは、項目ごとの差を平均して出した、アプリ独自の目安です。最初からの変化と推移は、最初の回と同じ項目だけで計算しています。撮る距離・姿勢・服装をそろえると、比べやすくなります。
                </p>
              </>
            )}
          </div>
        )}

        {resultTab === 'summary' && (
          latest ? (
            <div className="space-y-2.5">
              <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/70 space-y-2">
                <span className="text-[11px] font-bold text-slate-900 block">今の体型の総評（{formatDate(latest.analyzed_at)}）</span>
                <p className="text-xs leading-relaxed text-slate-700">{latest.summary || latest.analysis_summary}</p>
                <p className="text-[10px] text-slate-500">AIは今の写真だけを見て書いています（①の理想の写真は見ていません）。</p>
                {Array.isArray(latest.focus_areas) && latest.focus_areas.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-200/60">
                    <span className="text-[10px] text-slate-500 font-bold">重点部位:</span>
                    {latest.focus_areas.map((area, idx) => (
                      <span key={idx} className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200/70 px-2 py-0.5 rounded-xl font-bold">{area}</span>
                    ))}
                  </div>
                )}
              </div>
              {latest.advice && (
                <div className="bg-blue-50/60 rounded-xl p-3.5 border border-blue-200/60 space-y-1">
                  <span className="text-blue-900 font-bold text-[11px] block">💡 アドバイス</span>
                  <p className="text-xs text-slate-700 leading-relaxed">{latest.advice}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 text-center text-[11px] text-slate-500">②で今の体型を分析すると、総評が出ます。</div>
          )
        )}

        {resultTab === 'menu' && (
          latest && Array.isArray(latest.compound_menu) && latest.compound_menu.length > 0 ? (
            <div className="space-y-2.5">
              {latest.compound_menu.map((menu, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/70 space-y-2">
                  <div className="flex items-center justify-between gap-2.5">
                    <h3 className="text-xs font-bold text-slate-900">{menu.name}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-xl border border-blue-200/70 bg-blue-50 text-blue-700 shrink-0">
                      {menu.category === 'gym' ? 'ジム' : '宅トレ'} / {menu.reps}×{menu.sets}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">{menu.point}</p>
                  <button
                    onClick={() => onApplyWorkoutMenu(menu)}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    このメニューを今日の記録に反映
                  </button>
                </div>
              ))}
              <p className="text-[10px] text-slate-500">メニューは、AI（Gemini）が今の体型の写真から提案したものです。</p>
            </div>
          ) : (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 text-center text-[11px] text-slate-500">②で今の体型を分析すると、AIのおすすめメニューが出ます。</div>
          )
        )}
      </section>
    </div>
  );
}
