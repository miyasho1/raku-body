import React, { useEffect, useState } from 'react';
import { processPrivacyImage, revokeImagePreviewUrl } from '../utils/geminiAnalyzer';
import { inspectBodyPhoto } from '../utils/bodyVision';

export default function PhotoTrimmer({ file, initialRatio, onUse, onCancel }) {
  const [ratio, setRatio] = useState(() => Math.round(Math.min(0.8, Math.max(0.05, initialRatio)) * 100));
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  const handleUse = async () => {
    setBusy(true);
    setError('');
    const processed = await processPrivacyImage(file, true, ratio / 100);
    const check = await inspectBodyPhoto(processed.processedFile);
    setBusy(false);
    if (check.ok && check.faceDetected) {
      revokeImagePreviewUrl(processed.previewUrl);
      const next = Math.min(80, ratio + Math.max(5, Math.round((check.faceBottom || 0) * (100 - ratio)) + 5));
      setRatio(next);
      setError('まだ顔が写っています。切り取る位置を下げました。確かめてから、もう一度「この範囲で使う」を押してください。');
      return;
    }
    onUse(processed);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs px-3.5 py-14">
      <div role="dialog" aria-modal="true" aria-label="写真の切り取り" className="w-full max-h-full overflow-y-auto bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-3.5 space-y-3">
        <div>
          <span className="text-xs font-bold text-rose-600 block">⚠️ 顔が写っています</span>
          <h2 className="text-base font-black text-slate-900 leading-snug">顔が入らないように切り取りましょう</h2>
          <p className="text-[11px] text-slate-600 leading-relaxed mt-1">
            色がついた上の部分が切り取られます。顔がすべて隠れる位置になっているか確かめてから、使ってください。切り取ったあとも、もう一度顔が写っていないか調べます。
          </p>
        </div>
        <div className="relative w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-900">
          {url && <img src={url} alt="切り取る前の写真" className="w-full h-auto block" />}
          <div className="absolute left-0 right-0 top-0 bg-rose-600/80 flex items-end justify-center" style={{ height: `${ratio}%` }}>
            <span className="text-[10px] font-bold text-white pb-1">ここは切り取られます</span>
          </div>
          <div className="absolute left-0 right-0 border-t-2 border-dashed border-white" style={{ top: `${ratio}%` }} />
        </div>
        <label className="block space-y-1">
          <span className="text-[11px] font-bold text-slate-700">切り取る位置：上から {ratio}%</span>
          <input
            type="range"
            min="5"
            max="80"
            step="1"
            value={ratio}
            onChange={(e) => {
              setRatio(Number(e.target.value));
              setError('');
            }}
            className="w-full"
          />
        </label>
        {error && (
          <div className="text-[11px] font-bold px-3.5 py-2 rounded-xl border bg-rose-50 text-rose-700 border-rose-200/80 leading-relaxed">{error}</div>
        )}
        <div className="grid grid-cols-2 gap-2.5">
          <button type="button" onClick={onCancel} className="py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold cursor-pointer">
            やめる
          </button>
          <button type="button" disabled={busy} onClick={handleUse} className="py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold cursor-pointer disabled:opacity-50">
            {busy ? '確かめています...' : 'この範囲で使う'}
          </button>
        </div>
      </div>
    </div>
  );
}
