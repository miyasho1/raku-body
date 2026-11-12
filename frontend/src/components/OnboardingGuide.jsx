import React, { useState } from 'react';

const GUIDE_STEPS = [
  {
    icon: '👋',
    title: 'らくボディへようこそ',
    body: '食事・運動・体重を、少ない手間で記録して、続けるためのアプリです。最初に使い方を5ステップで紹介します。',
    points: ['記録は1日1回からでOK', '記録はアプリに保存され、あとから見返せます']
  },
  {
    icon: '🍱',
    title: '食事は「手動」タブで記録',
    body: '下のメニューの「食事記録」を開き、「手動」タブでメニュー名を入れ、カロリーなどを選んで保存します。',
    points: ['写真や成分表からの自動読み取りは、メニューの「AI（Gemini）の設定」をすると使えます（写真はGoogleのGeminiに送られます）', 'プロテインは、ホームの「プロテイン摂取の記録」から記録できます']
  },
  {
    icon: '🏋️',
    title: '運動と体重を記録',
    body: '運動は「運動記録」で、宅トレかジムを選んで記録します。体重は「体重推移」で、ダイヤルを回して保存します。',
    points: ['体重は朝など、同じ時間に測るのがおすすめ', 'ダイヤルの数字はタップでも選べます']
  },
  {
    icon: '🤖',
    title: '写真の自動読み取り（AI）を使うには',
    body: '食事の写真・成分表・体型の写真をAIで読み取るには、自分の「Gemini APIキー」を1回だけ入れます。キーは無料で作れます。',
    points: [
      'Google AI Studio（aistudio.google.com/apikey）を開き、Googleアカウントでログインして「APIキーを作成」を押す',
      'できたキーをコピーし、メニュー（≡）の「AI（Gemini）の設定」に貼って「確認して保存」を押す',
      '「キー保存済み」と出れば完了。AIで分析すると、写真はGoogleのGeminiに送られます',
      '無料のキーで送った写真や内容は、Googleの人がサービスの改善のために見ることがあります（Googleの規約による。送られる前に、アカウントとのつながりは外されます）。顔や、人に知られたくないものが写った写真は送らないでください。'
    ]
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
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-900/55 backdrop-blur-xs px-3.5 py-14">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="使い方ガイド"
        className="w-full max-h-full overflow-y-auto bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-3.5 space-y-3.5"
      >
        <div className="flex items-center justify-between gap-2.5">
          <span className="text-xs font-bold text-blue-600">使い方ガイド {stepIdx + 1}/{GUIDE_STEPS.length}</span>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 px-2.5 py-1.5 rounded-xl cursor-pointer"
          >
            スキップ
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200/70 flex items-center justify-center text-4xl shrink-0">
            {step.icon}
          </div>
          <h2 className="text-xl font-black text-slate-900 leading-snug">{step.title}</h2>
        </div>

        <p className="text-sm text-slate-700 leading-relaxed">{step.body}</p>

        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/70 space-y-2.5">
          {step.points.map((pt) => (
            <div key={pt} className="flex items-start gap-2.5 text-[13px] text-slate-700 leading-relaxed">
              <span className="text-emerald-600 font-black shrink-0">✓</span>
              <span>{pt}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-1.5">
          {GUIDE_STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-2 rounded-full transition-all ${i === stepIdx ? 'w-6 bg-blue-600' : 'w-2 bg-slate-300'}`}
            />
          ))}
        </div>

        {isLast ? (
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold cursor-pointer"
            >
              ホームを見る
            </button>
            <button
              type="button"
              onClick={onStartRecording}
              className="py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-bold shadow-2xs cursor-pointer"
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
              className="py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold cursor-pointer disabled:opacity-40 disabled:cursor-default"
            >
              ‹ 戻る
            </button>
            <button
              type="button"
              onClick={() => setStepIdx((i) => Math.min(GUIDE_STEPS.length - 1, i + 1))}
              className="py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-2xs cursor-pointer"
            >
              次へ ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
