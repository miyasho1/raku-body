import React from 'react';

export default function FirstStepsCard({ steps }) {
  const doneCount = steps.filter((s) => s.done).length;
  if (doneCount === steps.length) return null;
  const nextIdx = steps.findIndex((s) => !s.done);

  return (
    <section className="bg-white rounded-2xl p-3.5 shadow-sm border border-blue-200/80 space-y-3">
      <div className="flex items-center justify-between gap-2.5">
        <div className="min-w-0">
          <h2 className="text-xs font-extrabold text-slate-800">はじめの3ステップ</h2>
          <p className="text-[10px] text-slate-500 mt-0.5">上から順に、1回ずつ記録してみましょう</p>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border bg-blue-50 text-blue-700 border-blue-200/80 shrink-0">
          {doneCount}/{steps.length} 完了
        </span>
      </div>

      <div className="space-y-2.5">
        {steps.map((step, idx) => {
          const isNext = idx === nextIdx;
          return (
            <div
              key={step.key}
              className={`flex items-center gap-2.5 rounded-xl p-2.5 border ${
                step.done
                  ? 'bg-emerald-50/60 border-emerald-200/80'
                  : isNext
                  ? 'bg-blue-50/60 border-blue-300'
                  : 'bg-slate-50 border-slate-200/70'
              }`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${
                step.done
                  ? 'bg-emerald-500 text-white'
                  : isNext
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-400 border border-slate-200'
              }`}>
                {step.done ? '✓' : idx + 1}
              </div>
              <div className="min-w-0 flex-1">
                <span className={`text-xs font-bold block ${step.done ? 'text-emerald-800' : 'text-slate-800'}`}>{step.label}</span>
                <span className="text-[10px] text-slate-500 block leading-snug">{step.desc}</span>
              </div>
              {step.done ? (
                <span className="text-[10px] font-bold text-emerald-700 shrink-0">完了</span>
              ) : (
                <button
                  type="button"
                  onClick={step.onClick}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold shrink-0 cursor-pointer ${
                    isNext
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-2xs'
                      : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  記録 ›
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
