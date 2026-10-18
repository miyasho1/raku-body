import React, { useState, useEffect } from 'react';

export default function HomeScreen({ streakDays, isLoggedToday, onRecordLog, onSelectWorkoutType, onOpenBodyAnalysis }) {
  const [loading, setLoading] = useState(false);
  const [isProteinSheetOpen, setIsProteinSheetOpen] = useState(false);
  const [selectedBase, setSelectedBase] = useState('water');
  const [proteinSubmitting, setProteinSubmitting] = useState(false);
  const [proteinAnim, setProteinAnim] = useState(false);
  const [proteinToast, setProteinToast] = useState(null);
  const [todayMealLogged, setTodayMealLogged] = useState(false);
  const [todayProteinLogged, setTodayProteinLogged] = useState(false);
  const [todayCalories, setTodayCalories] = useState(0);
  const [todayProtein, setTodayProtein] = useState(0);
  const [todayFat, setTodayFat] = useState(0);
  const [todayCarbs, setTodayCarbs] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);

  const [myProtein, setMyProtein] = useState({
    product_name: 'ゴールドスタンダード ホエイ',
    protein_g: 24.0,
    calories: 120,
    image_url: ''
  });

  const proteinBases = {
    water: { id: 'water', name: '水', addP: 0, addCal: 0, addFat: 0, addCarbs: 0, desc: 'プロテイン本体そのまま・追加カロリーゼロ' },
    milk: { id: 'milk', name: '牛乳', addP: 6.8, addCal: 134, addFat: 7.8, addCarbs: 9.9, desc: '+134 kcal / +P 6.8g / +F 7.8g / +C 9.9g' },
    soymilk: { id: 'soymilk', name: '豆乳', addP: 7.2, addCal: 92, addFat: 4.0, addCarbs: 6.2, desc: '+92 kcal / +P 7.2g / +F 4.0g / +C 6.2g' }
  };

  const getNowTime = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const getTodayDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    fetchMyProtein();
    fetchTodayMealStatus();
  }, [isLoggedToday]);

  const fetchTodayMealStatus = async () => {
    try {
      const res = await fetch('/api/meals');
      if (res.ok) {
        const data = await res.json();
        if (data.meals && Array.isArray(data.meals)) {
          const todayStr = getTodayDateString();
          const todayMeals = data.meals.filter(m => (m.log_date === todayStr || (m.timestamp && m.timestamp.startsWith(todayStr))));
          const hasProtein = todayMeals.some(m => m.menu_name?.includes('プロテイン'));
          const hasMeal = todayMeals.some(m => !m.menu_name?.includes('プロテイン'));
          setTodayProteinLogged(hasProtein);
          setTodayMealLogged(hasMeal);

          let sumCal = 0;
          let sumP = 0;
          let sumF = 0;
          let sumC = 0;
          todayMeals.forEach(m => {
            sumCal += m.calories || 0;
            sumP += m.protein_g || 0;
            sumF += m.fat_g || 0;
            sumC += m.carbs_g || 0;
          });
          setTodayCalories(sumCal);
          setTodayProtein(Math.round(sumP * 10) / 10);
          setTodayFat(Math.round(sumF * 10) / 10);
          setTodayCarbs(Math.round(sumC * 10) / 10);
        }
      }
    } catch {
    }
  };

  const fetchMyProtein = async () => {
    try {
      const res = await fetch('/api/my-protein');
      if (res.ok) {
        const data = await res.json();
        if (data && data.product_name) {
          setMyProtein(data);
        }
      }
    } catch {
      const cached = localStorage.getItem('raku_my_protein');
      if (cached) {
        setMyProtein(JSON.parse(cached));
      }
    }
  };

  const handleTap = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await onRecordLog();
    } finally {
      setLoading(false);
    }
  };

  const handleDrinkProtein = async () => {
    if (proteinSubmitting) return;
    setProteinSubmitting(true);

    const baseInfo = proteinBases[selectedBase];
    const baseP = myProtein.protein_g !== undefined ? myProtein.protein_g : 24.0;
    const baseFat = myProtein.fat_g !== undefined ? myProtein.fat_g : 1.0;
    const baseCarbs = myProtein.carbs_g !== undefined ? myProtein.carbs_g : 2.0;

    const totalProtein = Number((baseP + baseInfo.addP).toFixed(1));
    const totalCalories = Math.round((myProtein.calories || 120) + baseInfo.addCal);
    const totalFat = Number((baseFat + baseInfo.addFat).toFixed(1));
    const totalCarbs = Number((baseCarbs + baseInfo.addCarbs).toFixed(1));
    const currentTime = getNowTime();

    try {
      const res = await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meal_type: currentTime,
          meal_time: currentTime,
          menu_name: `${myProtein.product_name}（${baseInfo.name}割り）`,
          calories: totalCalories,
          protein_level: '高',
          carbs_level: totalCarbs > 10 ? '普通' : '低',
          fat_level: totalFat > 8 ? '普通' : '低',
          protein_g: totalProtein,
          fat_g: totalFat,
          carbs_g: totalCarbs,
          image_url: myProtein.image_url || '',
          note: `ホーム画面から記録（割り材: ${baseInfo.name}、たんぱく質計 ${totalProtein}g）`,
        }),
      });

      if (res.ok) {
        setProteinAnim(true);
        setTodayProteinLogged(true);
        fetchTodayMealStatus();
        setTimeout(() => {
          setProteinAnim(false);
          setIsProteinSheetOpen(false);
        }, 1100);

        setProteinToast(`${currentTime} にプロテイン（${baseInfo.name}割り / P:${totalProtein}g / ${totalCalories}kcal）を記録しました`);
        setTimeout(() => setProteinToast(null), 3500);
      }
    } catch {
      setProteinToast('通信エラーが発生しました');
      setTimeout(() => setProteinToast(null), 3000);
    } finally {
      setProteinSubmitting(false);
    }
  };

  const currentTotalP = Number((myProtein.protein_g + proteinBases[selectedBase].addP).toFixed(1));
  const currentTotalCal = myProtein.calories + proteinBases[selectedBase].addCal;

  return (
    <div className="flex flex-col min-h-[calc(100vh-5rem)] px-4 pt-3.5 pb-40 bg-slate-100 no-scrollbar [&::-webkit-scrollbar]:hidden">
      <div className="w-full text-center mb-3">
        <p className="text-xs font-semibold text-slate-500 tracking-wide">日々の積み重ねが理想の体をつくる</p>
      </div>

      {proteinToast && (
        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 bg-slate-900/90 backdrop-blur-md text-white text-xs font-semibold px-5 py-2.5 rounded-full shadow-lg z-50">
          {proteinToast}
        </div>
      )}

      <section
        onClick={onOpenBodyAnalysis}
        className="w-full bg-white text-slate-900 rounded-2xl p-4 shadow-sm hover:shadow-md border border-slate-200/80 cursor-pointer transition-all mb-3.5 flex items-center justify-between"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100/80 shadow-xs flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">理想体型・AI画像分析</span>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full border border-indigo-200/70">
                新機能
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">写真比較で部位別ギャップとメニューを生成</p>
          </div>
        </div>
        <span className="text-indigo-600 text-xs font-bold bg-slate-50 hover:bg-slate-100 px-3 py-1 rounded-full border border-slate-200 shadow-xs">診断 ›</span>
      </section>

      <section
        onClick={() => {
          fetchMyProtein();
          setIsProteinSheetOpen(true);
        }}
        className="w-full bg-white text-slate-900 rounded-2xl p-4 shadow-sm hover:shadow-md border border-slate-200/80 cursor-pointer transition-all mb-3.5 flex items-center justify-between"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/80 shadow-xs flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">プロテイン摂取の記録</span>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200/70">
                クイック入力
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              {myProtein.product_name}（タンパク質: {myProtein.protein_g}g）
            </p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-full shadow-md shadow-emerald-500/20 flex-shrink-0 transition-all">
          記録 ›
        </div>
      </section>

      <section className="w-full bg-white text-slate-900 rounded-2xl p-4.5 shadow-sm border border-slate-200/80 mb-4 overflow-hidden relative">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-900">
              {currentSlide === 0 ? '継続ダッシュボード' : currentSlide === 1 ? '本日の栄養・カロリー' : 'おすすめピックアップ'}
            </span>
            <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200/60">
              スライド {currentSlide + 1}/3
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentSlide((prev) => (prev === 0 ? 2 : prev - 1))}
              aria-label="前へ"
              className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => setCurrentSlide((prev) => (prev === 2 ? 0 : prev + 1))}
              aria-label="次へ"
              className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
            >
              ›
            </button>
          </div>
        </div>

        {currentSlide === 0 && (
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 border border-orange-200/60 flex items-center justify-center text-2xl flex-shrink-0 shadow-xs">
                  🔥
                </div>
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-black text-slate-900 tracking-tight">{streakDays}</span>
                    <span className="text-xs font-bold text-slate-600">日 連続記録中！</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isLoggedToday ? '本日の運動記録は完了しています' : '本日の運動を選択して記録しましょう'}
                  </p>
                </div>
              </div>
              <div className={`px-2.5 py-1 rounded-full text-xs font-bold border transition-all ${
                (isLoggedToday && todayMealLogged && todayProteinLogged)
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}>
                {(isLoggedToday ? 1 : 0) + (todayMealLogged ? 1 : 0) + (todayProteinLogged ? 1 : 0)} / 3 達成
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <div className="text-[11px] font-bold text-slate-500 mb-2">本日の達成状況</div>
              <div className="grid grid-cols-3 gap-2">
                <div className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl border text-xs font-bold transition-all ${
                  isLoggedToday
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 shadow-xs'
                    : 'bg-slate-50 text-slate-400 border-slate-200/60'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isLoggedToday ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span>運動</span>
                  <span className="text-[11px]">{isLoggedToday ? '✓' : ''}</span>
                </div>

                <div className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl border text-xs font-bold transition-all ${
                  todayMealLogged
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 shadow-xs'
                    : 'bg-slate-50 text-slate-400 border-slate-200/60'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${todayMealLogged ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span>食事</span>
                  <span className="text-[11px]">{todayMealLogged ? '✓' : ''}</span>
                </div>

                <div className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl border text-xs font-bold transition-all ${
                  todayProteinLogged
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 shadow-xs'
                    : 'bg-slate-50 text-slate-400 border-slate-200/60'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${todayProteinLogged ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span>プロテイン</span>
                  <span className="text-[11px]">{todayProteinLogged ? '✓' : ''}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentSlide === 1 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-xs font-bold text-slate-500">本日の推定摂取カロリー</span>
                <div className="text-xl font-black text-slate-900 mt-0.5">
                  {todayCalories.toLocaleString()} <span className="text-xs font-normal text-slate-500">/ 2,000 kcal</span>
                </div>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                todayCalories > 2200
                  ? 'text-rose-700 bg-rose-50 border-rose-200/80'
                  : 'text-emerald-700 bg-emerald-50 border-emerald-200/80'
              }`}>
                {todayCalories > 2200 ? '超過' : '目標内'} {Math.round((todayCalories / 2000) * 100)}%
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 mb-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  todayCalories > 2200 ? 'bg-rose-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(Math.round((todayCalories / 2000) * 100), 100)}%` }}
              />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2 border-t border-slate-100">
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/70">
                <span className="text-[10px] text-blue-600 font-bold block mb-0.5">タンパク質 (P)</span>
                <span className="font-extrabold text-slate-800 text-xs">{todayProtein}g</span>
                <span className="text-[10px] text-slate-500 block">目安: 100g</span>
              </div>
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/70">
                <span className="text-[10px] text-amber-600 font-bold block mb-0.5">脂質 (F)</span>
                <span className="font-extrabold text-slate-800 text-xs">{todayFat}g</span>
                <span className="text-[10px] text-slate-500 block">目安: 55g</span>
              </div>
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/70">
                <span className="text-[10px] text-emerald-600 font-bold block mb-0.5">炭水化物 (C)</span>
                <span className="font-extrabold text-slate-800 text-xs">{todayCarbs}g</span>
                <span className="text-[10px] text-slate-500 block">目安: 250g</span>
              </div>
            </div>
          </div>
        )}

        {currentSlide === 2 && (
          <div>
            <div className="flex items-center gap-3 mb-2.5">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200/70 flex items-center justify-center text-xl flex-shrink-0 shadow-xs">
                🏋️
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-slate-900">チェストプレスマシン</span>
                  <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold border border-blue-200/60">
                    胸・上半身
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">推奨目安: 20kg × 10回 × 3セット</p>
              </div>
            </div>
            <div className="bg-blue-50/60 p-2.5 rounded-xl border border-blue-200/60 text-xs text-blue-900 leading-relaxed font-medium mb-2.5">
              💡 大胸筋など大きな筋群を刺激すると、消費カロリーが向上し脂肪燃焼効果が長続きします。
            </div>
            <button
              type="button"
              onClick={() => onSelectWorkoutType('gym')}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer text-center"
            >
              この種目をジム記録で開始する ›
            </button>
          </div>
        )}

        <div className="flex justify-center items-center gap-1.5 mt-3 pt-2.5 border-t border-slate-100">
          {[0, 1, 2].map((idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentSlide(idx)}
              aria-label={`スライド ${idx + 1}`}
              className={`rounded-full transition-all cursor-pointer ${
                currentSlide === idx ? 'w-4 h-1.5 bg-blue-600' : 'w-1.5 h-1.5 bg-slate-300 hover:bg-slate-400'
              }`}
            />
          ))}
        </div>
      </section>

      <section className="mb-4">
        <h2 className="text-xs font-bold text-slate-700 mb-2 px-1">本日のトレーニング</h2>
        <div className="grid grid-cols-2 gap-3">
          <div
            onClick={() => onSelectWorkoutType('home')}
            className="bg-white rounded-2xl p-4 border border-slate-200/80 hover:border-blue-400 hover:shadow-md shadow-sm cursor-pointer transition-all flex flex-col items-center justify-center text-center group"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2.5 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-xs flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <span className="text-xs sm:text-sm font-bold text-slate-800 block">宅トレ・自重運動</span>
            <span className="text-[11px] text-slate-500 mt-0.5 block leading-tight">ストレッチ・自重・有酸素</span>
          </div>

          <div
            onClick={() => onSelectWorkoutType('gym')}
            className="bg-white rounded-2xl p-4 border border-slate-200/80 hover:border-indigo-400 hover:shadow-md shadow-sm cursor-pointer transition-all flex flex-col items-center justify-center text-center group"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2.5 group-hover:scale-105 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-xs flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <span className="text-xs sm:text-sm font-bold text-slate-800 block">ジム・マシン記録</span>
            <span className="text-[11px] text-slate-500 mt-0.5 block leading-tight">部位別マシン・重量記録</span>
          </div>
        </div>
      </section>

      <div className="mb-4">
        <button
          onClick={handleTap}
          disabled={loading || isLoggedToday}
          className={`w-full h-12 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
            isLoggedToday
              ? 'bg-white text-blue-700 border border-blue-200 shadow-sm cursor-default'
              : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/25 active:scale-[0.99]'
          }`}
        >
          {isLoggedToday ? (
            <>
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
              <span>本日の運動を記録済み</span>
            </>
          ) : loading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>記録中...</span>
            </>
          ) : (
            <span>本日の運動をワンタップ記録</span>
          )}
        </button>
      </div>

      <section className="w-full bg-white border border-slate-200/80 rounded-2xl p-4 mt-auto shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800">運動と栄養の継続</h3>
            <p className="text-xs text-slate-500">定期的な運動と適切なタンパク質補給で、基礎代謝と筋肉量を維持します。</p>
          </div>
        </div>
      </section>

      {isProteinSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-t-[2.5rem] sm:rounded-3xl p-6 shadow-xl border border-slate-200/80 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">プロテイン摂取の記録</h3>
                <p className="text-xs text-slate-500">割り材を選択して記録します</p>
              </div>
              <button
                type="button"
                onClick={() => setIsProteinSheetOpen(false)}
                className="w-8 h-8 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100 flex items-center justify-center text-xs font-medium cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-gradient-to-r from-emerald-50/70 to-teal-50/40 rounded-2xl p-3.5 border border-emerald-100 mb-4 flex items-center gap-3">
              {myProtein.image_url ? (
                <img
                  src={myProtein.image_url}
                  alt={myProtein.product_name}
                  className="w-12 h-12 rounded-xl object-cover border border-emerald-200/60"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center text-sm font-bold shadow-xs">
                  P
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-[10px] text-emerald-800 font-bold">登録商品</div>
                <div className="text-xs font-bold text-slate-900 truncate">{myProtein.product_name}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  タンパク質: {myProtein.protein_g}g / カロリー: {myProtein.calories}kcal
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="text-xs font-bold text-slate-800 block mb-2 px-1">割り材の選択（ラジオボタン）:</label>
              <div className="grid grid-cols-3 gap-2">
                {Object.values(proteinBases).map((b) => {
                  const isSelected = selectedBase === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBase(b.id)}
                      className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer relative ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/80 text-emerald-800 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all ${
                          isSelected ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300 bg-white'
                        }`}>
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </span>
                        <span className="text-xs font-bold">{b.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 leading-tight">{b.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 mb-5">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-medium text-slate-600">合計タンパク質</span>
                <span className="text-lg font-extrabold text-emerald-700">
                  {currentTotalP} g
                </span>
              </div>
              <div className="flex justify-between items-center pt-1.5 border-t border-slate-200">
                <span className="text-xs font-medium text-slate-600">合計カロリー</span>
                <span className="text-sm font-bold text-slate-900">
                  {currentTotalCal} kcal
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={proteinSubmitting}
              onClick={handleDrinkProtein}
              className={`w-full h-12 py-3 text-white font-bold rounded-full text-sm transition-all cursor-pointer flex items-center justify-center gap-2 ${
                proteinAnim
                  ? 'bg-emerald-600'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-500/25 active:scale-[0.99]'
              } disabled:opacity-50`}
            >
              {proteinAnim ? (
                <span>記録完了</span>
              ) : proteinSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>記録中...</span>
                </>
              ) : (
                <span>プロテインを記録する（{getNowTime()}）</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
