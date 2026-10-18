import React, { useState, useEffect } from 'react';

export default function HistoryScreen({ logs }) {
  const [advice, setAdvice] = useState(null);
  const [correlation, setCorrelation] = useState(null);
  const [loading, setLoading] = useState(true);

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
    } finally {
      setLoading(false);
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
      return 'bg-[#F2F4F7] text-[#1A1A1C] border-[#D0D5DD]';
    }
    if (tag?.includes('脂肪燃焼') || tag?.includes('絶好調')) {
      return 'bg-[#F2F4F7] text-[#0056B3] border-[#D0D5DD]';
    }
    return 'bg-[#F2F4F7] text-[#0056B3] border-[#D0D5DD]';
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-5rem)] px-5 py-6 pb-40 bg-slate-100 no-scrollbar [&::-webkit-scrollbar]:hidden">
      <header className="mb-4">
        <h1 className="text-lg font-bold text-[#1A1A1C]">履歴・データ分析</h1>
        <p className="text-xs text-[#475467] mt-0.5">食事・運動・体重推移の相関と助言</p>
      </header>

      {correlation && correlation.summary && (
        <section className="bg-white text-[#1A1A1C] rounded-lg p-4 shadow-sm mb-4 border border-[#D0D5DD]">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold tracking-wider text-[#1A1A1C] uppercase">
              食事・運動・体重の相関分析
            </h2>
            <span className="text-[10px] bg-[#F2F4F7] text-[#0056B3] font-bold px-2 py-0.5 rounded border border-[#D0D5DD]">
              {correlation.summary.correlation_score}
            </span>
          </div>

          <h3 className="text-xs font-bold text-[#1A1A1C] leading-relaxed mb-3">
            {correlation.summary.headline}
          </h3>

          <div className="grid grid-cols-4 gap-1.5 mb-3 bg-[#F8F9FA] p-2 rounded-lg border border-[#D0D5DD] text-center">
            <div>
              <span className="text-[9px] text-[#475467] block">体重変化</span>
              <span className={`text-xs font-bold ${correlation.summary.weight_diff <= 0 ? 'text-[#0056B3]' : 'text-[#1A1A1C]'}`}>
                {correlation.summary.weight_diff > 0 ? `+${correlation.summary.weight_diff}` : correlation.summary.weight_diff}kg
              </span>
            </div>
            <div>
              <span className="text-[9px] text-[#475467] block">体脂肪率</span>
              <span className={`text-xs font-bold ${correlation.summary.fat_diff <= 0 ? 'text-[#0056B3]' : 'text-[#1A1A1C]'}`}>
                {correlation.summary.fat_diff > 0 ? `+${correlation.summary.fat_diff}` : correlation.summary.fat_diff}%
              </span>
            </div>
            <div>
              <span className="text-[9px] text-[#475467] block">運動頻度</span>
              <span className="text-xs font-bold text-[#1A1A1C]">
                週{correlation.summary.workout_days}日
              </span>
            </div>
            <div>
              <span className="text-[9px] text-[#475467] block">高タンパク食</span>
              <span className="text-xs font-bold text-[#0056B3]">
                {correlation.summary.high_protein_meals}食
              </span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="bg-[#F8F9FA] rounded-md p-2.5 border border-[#D0D5DD]">
              <span className="text-[10px] text-[#0056B3] font-bold block mb-0.5">因果関係インサイト:</span>
              <p className="text-[11px] text-[#1A1A1C] leading-relaxed font-medium">
                {correlation.summary.insight}
              </p>
            </div>
            <div className="bg-[#F2F4F7] rounded-md p-2.5 border border-[#D0D5DD]">
              <span className="text-[10px] text-[#0056B3] font-bold block mb-0.5">今後のアクション提案:</span>
              <p className="text-[11px] text-[#1A1A1C] leading-relaxed font-bold">
                {correlation.summary.recommendation}
              </p>
            </div>
          </div>
        </section>
      )}

      {correlation && correlation.timeline && correlation.timeline.length > 0 && (
        <section className="bg-white rounded-lg p-4 shadow-sm border border-[#D0D5DD] mb-4">
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-xs font-bold text-[#1A1A1C]">統合タイムライン相関</h3>
            <span className="text-[10px] text-[#475467]">直近の推移と活動</span>
          </div>

          <div className="space-y-2">
            {correlation.timeline.slice(-5).map((t, idx) => (
              <div key={idx} className="p-2.5 rounded-lg bg-white border border-[#D0D5DD] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-medium text-[#475467] w-10">{t.date.slice(5)}</span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[#1A1A1C]">{t.weight ? `${t.weight}kg` : '-'}</span>
                      {t.body_fat && <span className="text-[10px] text-[#475467]">({t.body_fat}%)</span>}
                    </div>
                    <div className="text-[10px] text-[#475467] mt-0.5">
                      {t.workout_count > 0 ? (
                        <span className="text-[#0056B3] font-medium mr-1.5">運動あり ({t.workout_count}種目)</span>
                      ) : (
                        <span className="text-[#475467] mr-1.5">運動休息日</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${
                    t.high_protein_count > 0
                      ? 'bg-[#F2F4F7] text-[#0056B3] border-[#D0D5DD]'
                      : 'bg-[#F8F9FA] text-[#475467] border-[#D0D5DD]'
                  }`}>
                    {t.high_protein_count > 0 ? '高タンパク' : '通常食'}
                  </span>
                  {t.calories > 0 && (
                    <span className="text-[9px] text-[#475467] block mt-0.5">{t.calories} kcal</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {advice && (
        <section className="bg-white text-[#1A1A1C] rounded-lg p-4 shadow-sm mb-4 border border-[#D0D5DD]">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold tracking-wider text-[#1A1A1C] uppercase">
              {advice.title}
            </h2>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getTagBadgeStyle(advice.tag)}`}>
              {advice.tag}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="bg-[#F8F9FA] rounded-md p-2.5 border border-[#D0D5DD]">
              <div className="text-[10px] text-[#0056B3] font-bold mb-0.5">
                直近の実績評価
              </div>
              <p className="text-[11px] font-medium leading-relaxed text-[#1A1A1C]">
                {advice.praise}
              </p>
            </div>

            <div className="text-[11px] text-[#475467] leading-relaxed px-1">
              {advice.advice}
            </div>

            <div className="bg-[#F2F4F7] rounded-md p-2.5 border border-[#D0D5DD]">
              <div className="text-[10px] text-[#0056B3] font-bold mb-0.5">
                次回のアクション
              </div>
              <p className="text-[11px] font-bold text-[#1A1A1C] leading-relaxed">
                {advice.next_action}
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="flex-1">
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-xs font-bold text-[#1A1A1C]">活動ログタイムライン</h2>
          <span className="text-[11px] text-[#475467]">合計 {logs.length} 件</span>
        </div>

        {logs.length === 0 ? (
          <div className="bg-white rounded-lg p-6 border border-[#D0D5DD] text-center text-[#475467]">
            <p className="text-xs">記録がありません</p>
            <p className="text-[11px] text-[#475467] mt-1">運動や食事を記録すると蓄積されます</p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.slice(0, 10).map((item) => {
              const isGym = item.category?.includes('ジム');
              const isHome = item.category?.includes('宅トレ');

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-lg p-3 border border-[#D0D5DD] shadow-sm flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 text-[#0056B3] bg-[#F2F4F7] border border-[#D0D5DD] font-bold text-xs">
                      {isGym ? 'ジム' : isHome ? '宅トレ' : '記録'}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-xs font-bold text-[#1A1A1C]">{item.category}</h3>
                        <span className="text-[10px] text-[#475467]">{item.log_date || ''}</span>
                      </div>
                      <p className="text-[11px] text-[#475467] mt-0.5 line-clamp-1">
                        {item.note || 'トレーニング達成'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-[#475467]">{item.timestamp?.slice(11, 16) || ''}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
