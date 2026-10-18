import React, { useState, useEffect } from 'react';

export default function HistoryScreen({ logs }) {
  const [activeTab, setActiveTab] = useState('correlation');
  const [advice, setAdvice] = useState(null);
  const [correlation, setCorrelation] = useState(null);

  useEffect(() => {
    fetchAdvice();
    fetchCorrelation();
  }, [logs]);

  const fetchAdvice = async () => {
    try {
      const res = await fetch('/api/advice');
      if (res.ok) {
        const data = await res.json();
        setAdvice(data);
      }
    } catch {
    }
  };

  const fetchCorrelation = async () => {
    try {
      const res = await fetch('/api/correlation-analysis');
      if (res.ok) {
        const data = await res.json();
        setCorrelation(data);
      }
    } catch {
    }
  };

  const getTagBadgeStyle = (tag) => {
    if (tag?.includes('回復') || tag?.includes('ケア')) {
      return 'bg-slate-100 text-slate-800 border-slate-200';
    }
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };

  return (
    <div className="flex flex-col space-y-3 pb-2">
      <header className="px-0.5 flex items-center justify-between">
        <div>
          <h1 className="text-base font-extrabold text-slate-900 leading-tight">履歴・データ分析</h1>
          <p className="text-[10px] text-slate-500">食事・運動・体重推移の相関と助言</p>
        </div>
        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200/70">
          全 {logs.length} 件
        </span>
      </header>

      {correlation && correlation.summary && (
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-2xs text-center">
            <span className="text-[9px] text-slate-500 block font-bold">体重変化</span>
            <span className={`text-xs font-black ${correlation.summary.weight_diff <= 0 ? 'text-blue-600' : 'text-slate-900'}`}>
              {correlation.summary.weight_diff > 0 ? `+${correlation.summary.weight_diff}` : correlation.summary.weight_diff}kg
            </span>
          </div>
          <div className="bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-2xs text-center">
            <span className="text-[9px] text-slate-500 block font-bold">体脂肪率</span>
            <span className={`text-xs font-black ${correlation.summary.fat_diff <= 0 ? 'text-blue-600' : 'text-slate-900'}`}>
              {correlation.summary.fat_diff > 0 ? `+${correlation.summary.fat_diff}` : correlation.summary.fat_diff}%
            </span>
          </div>
          <div className="bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-2xs text-center">
            <span className="text-[9px] text-slate-500 block font-bold">運動頻度</span>
            <span className="text-xs font-black text-slate-900">
              週{correlation.summary.workout_days}日
            </span>
          </div>
          <div className="bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-2xs text-center">
            <span className="text-[9px] text-slate-500 block font-bold">高タンパク</span>
            <span className="text-xs font-black text-blue-600">
              {correlation.summary.high_protein_meals}食
            </span>
          </div>
        </div>
      )}

      <section className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-sm space-y-3">
        <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('correlation')}
            className={`py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'correlation'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            🔗 相関分析
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('advice')}
            className={`py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'advice'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            💡 AI助言
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'logs'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            📋 履歴 ({logs.length})
          </button>
        </div>

        {activeTab === 'correlation' && (
          <div className="space-y-2.5">
            {correlation && correlation.summary ? (
              <>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-blue-600">因果関係インサイト</span>
                    <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-md border border-blue-200/70">
                      {correlation.summary.correlation_score}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-900 leading-snug">
                    {correlation.summary.headline}
                  </p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {correlation.summary.insight}
                  </p>
                </div>

                {correlation.timeline && correlation.timeline.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-800 block px-0.5">直近の相関タイムライン</span>
                    {correlation.timeline.slice(-4).map((t, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/70 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-500 w-9">{t.date.slice(5)}</span>
                          <span className="font-bold text-slate-900">{t.weight ? `${t.weight}kg` : '-'}</span>
                          <span className={`text-[10px] font-bold ${t.workout_count > 0 ? 'text-blue-600' : 'text-slate-400'}`}>
                            {t.workout_count > 0 ? `運動${t.workout_count}件` : '休息日'}
                          </span>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-md border font-bold ${
                          t.high_protein_count > 0
                            ? 'bg-blue-50 text-blue-700 border-blue-200/70'
                            : 'bg-white text-slate-600 border-slate-200'
                        }`}>
                          {t.calories > 0 ? `${t.calories}kcal` : t.high_protein_count > 0 ? '高タンパク' : '通常'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 text-center text-xs text-slate-400">
                データを読み込み中...
              </div>
            )}
          </div>
        )}

        {activeTab === 'advice' && (
          <div className="space-y-2.5">
            {advice ? (
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{advice.title}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${getTagBadgeStyle(advice.tag)}`}>
                    {advice.tag}
                  </span>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70">
                  <span className="text-[10px] text-blue-600 font-bold block mb-0.5">直近の実績評価</span>
                  <p className="text-[11px] font-medium leading-relaxed text-slate-900">{advice.praise}</p>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed px-1">{advice.advice}</p>
                <div className="bg-blue-50/60 rounded-xl p-3 border border-blue-200/70">
                  <span className="text-[10px] text-blue-700 font-bold block mb-0.5">次回のアクション</span>
                  <p className="text-[11px] font-bold text-slate-900 leading-relaxed">{advice.next_action}</p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 text-center text-xs text-slate-400">
                助言データがありません
              </div>
            )}
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-2">
            {logs.length === 0 ? (
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200/70 text-center text-slate-500">
                <p className="text-xs">記録がありません</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {logs.slice(0, 8).map((item) => {
                  const isGym = item.category?.includes('ジム');
                  const isHome = item.category?.includes('宅トレ');

                  return (
                    <div
                      key={item.id}
                      className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-200/70 flex flex-col justify-between gap-1"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/70 font-bold text-[9px]">
                          {isGym ? 'ジム' : isHome ? '宅トレ' : '記録'}
                        </span>
                        <span className="text-[9px] text-slate-400">{item.log_date?.slice(5) || ''}</span>
                      </div>
                      <h3 className="text-[11px] font-bold text-slate-900 truncate">{item.category}</h3>
                      <p className="text-[10px] text-slate-500 truncate">
                        {item.note || 'トレーニング達成'}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
