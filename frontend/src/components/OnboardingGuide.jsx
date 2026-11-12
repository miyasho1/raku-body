import React, { useState } from 'react';

const GUIDE_STEPS = [
  {
    icon: '👋',
    title: 'らくボディへようこそ',
    body: '食事・運動・体重を、少ない手間で記録して、続けるためのアプリです。最初に使い方を4ステップで紹介します。',
    points: ['記録は1日1回からでOK', '記録はアプリに保存され、あとから見返せます']
  },
  {
    icon: '🍱',
    title: '食事は「手動」タブで記録',
    body: '下のメニューの「食事記録」を開き、「手動」タブでメニュー名を入れ、カロリーなどを選んで保存します。',
    points: ['写真や成分表からの自動読み取りは、今回のテスト版では使えません', 'プロテインは、ホームの「プロテイン摂取の記録」から記録できます']
  },
  {
    icon: '🏋️',
    title: '運動と体重を記録',
    body: '運動は「運動記録」で、宅トレかジムを選んで記録します。体重は「体重推移」で、ダイヤルを回して保存します。',
    points: ['体重は朝など、同じ時間に測るのがおすすめ', 'ダイヤルの数字はタップでも選べます']
  },
  {
    icon: '📈',
    title: 'ホームで記録を確認',
    body: 'ホームには、体重の推移と、今日の記録状況（運動・食事・プロテイン）が表示されます。',
    points: ['迷ったら、ホームの「はじめの3ステップ」から', 'この説明は、メニューからいつでも見直せます']
  }
];

export default function OnboardingGuide({ onClose, onStartRecording }) {
  const [stepIdx, setStepIdx] = useState(0);
  const step = GUIDE_STEPS[stepIdx];
  const isLast = stepIdx === GUIDE_STEPS.length - 1;

  return (
    <div className="absolute inset-0 z-40 flex items-end sm:items-center justify-center bg-slate-900/55 backdrop-blur-xs px-3.5 pb-3.5 pt-14">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="使い方ガイド"
        className="w-full bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-3.5 space-y-3"
      >
        <div className="flex items-center justify-between gap-2.5">
          <span className="text-[10px] font-bold text-blue-600">使い方ガイド {stepIdx + 1}/{GUIDE_STEPS.length}</span>
          <button
            type="button"
            onClick={onClose}
            className="text-[11px] font-bold text-slate-400 hover:text-slate-600 px-2 py-1 rounded-lg cursor-pointer"
          >
            スキップ
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200/70 flex items-center justify-center text-2xl shrink-0">
            {step.icon}
          </div>
          <h2 className="text-base font-black text-slate-900 leading-snug">{step.title}</h2>
        </div>

        <p className="text-xs text-slate-700 leading-relaxed">{step.body}</p>

        <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/70 space-y-1.5">
          {step.points.map((pt) => (
            <div key={pt} className="flex items-start gap-2 text-[11px] text-slate-600 leading-snug">
              <span className="text-emerald-600 font-black shrink-0">✓</span>
              <span>{pt}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-1.5">
          {GUIDE_STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${i === stepIdx ? 'w-5 bg-blue-600' : 'w-1.5 bg-slate-300'}`}
            />
          ))}
        </div>

        {isLast ? (
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
            >
              ホームを見る
            </button>
            <button
              type="button"
              onClick={onStartRecording}
              className="py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold shadow-2xs cursor-pointer"
            >
              体重を記録する ›
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={stepIdx === 0}
              onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
              className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer disabled:opacity-40 disabled:cursor-default"
            >
              ‹ 戻る
            </button>
            <button
              type="button"
              onClick={() => setStepIdx((i) => Math.min(GUIDE_STEPS.length - 1, i + 1))}
              className="py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-2xs cursor-pointer"
            >
              次へ ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
