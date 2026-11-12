import React, { useState, useEffect, useRef } from 'react';
import {
  analyzeNutritionLabelImage,
  processPrivacyImage,
  revokeImagePreviewUrl
} from '../utils/geminiAnalyzer';
import {
  getProteinPresets,
  saveProteinPreset,
  getActiveMyProtein
} from '../utils/demoData';
import { getUserStorageData, setUserStorageData } from '../utils/authService';
import { analyzeBodyPhoto, compareToIdeal, BODY_PHOTO_MESSAGES } from '../utils/bodyCompare';
import { inspectBodyPhoto } from '../utils/bodyVision';
import PhotoTrimmer from './PhotoTrimmer';
import WeightTrendCard from './WeightTrendCard';
import FirstStepsCard from './FirstStepsCard';

const NO_PROTEIN = { product_name: '未登録', serving_size_g: 0, calories: 0, protein_g: 0, fat_g: 0, carbs_g: 0 };

export default function HomeScreen({
  streakDays,
  isLoggedToday,
  dataVersion,
  onRecordLog,
  onSelectWorkoutType,
  onOpenBodyAnalysis,
  onOpenMetrics,
  onOpenMeal
}) {
  const [loading, setLoading] = useState(false);
  const [isProteinSheetOpen, setIsProteinSheetOpen] = useState(false);
  const [proteinModalTab, setProteinModalTab] = useState('quick');
  const [selectedBase, setSelectedBase] = useState('water');
  const [proteinSubmitting, setProteinSubmitting] = useState(false);
  const [proteinAnim, setProteinAnim] = useState(false);
  const [proteinToast, setProteinToast] = useState(null);

  const [proteinPresets, setProteinPresets] = useState(() => getProteinPresets());
  const [myProtein, setMyProtein] = useState(() => getActiveMyProtein());
  const mp = myProtein || NO_PROTEIN;

  const [ocrName, setOcrName] = useState('');
  const [ocrServingG, setOcrServingG] = useState('');
  const [ocrCalories, setOcrCalories] = useState('');
  const [ocrProteinG, setOcrProteinG] = useState('');
  const [ocrFatG, setOcrFatG] = useState('');
  const [ocrCarbsG, setOcrCarbsG] = useState('');
  const [isOcrRunning, setIsOcrRunning] = useState(false);
  const [ocrMessage, setOcrMessage] = useState(null);

  const [isQuickBodyModalOpen, setIsQuickBodyModalOpen] = useState(false);
  const [rawBodyFile, setRawBodyFile] = useState(null);
  const [croppedBodyFile, setCroppedBodyFile] = useState(null);
  const [bodyPreviewUrl, setBodyPreviewUrl] = useState('');
  const [isBodyAnalyzing, setIsBodyAnalyzing] = useState(false);
  const [quickBodyResult, setQuickBodyResult] = useState(null);
  const [quickBodyError, setQuickBodyError] = useState('');
  const [ocrAiResult, setOcrAiResult] = useState(null);
  const [quickTrim, setQuickTrim] = useState(null);

  const [todayMealLogged, setTodayMealLogged] = useState(false);
  const [todayProteinLogged, setTodayProteinLogged] = useState(false);
  const [todayCalories, setTodayCalories] = useState(0);
  const [todayProtein, setTodayProtein] = useState(0);
  const [todayFat, setTodayFat] = useState(0);
  const [todayCarbs, setTodayCarbs] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [recentTimeline, setRecentTimeline] = useState([]);
  const [weightMetrics, setWeightMetrics] = useState(() => {
    const cached = getUserStorageData('metrics', []);
    return Array.isArray(cached) ? cached : [];
  });
  const [hasAnyMeal, setHasAnyMeal] = useState(() => {
    const cached = getUserStorageData('meals', []);
    return Array.isArray(cached) && cached.length > 0;
  });
  const [hasAnyWorkout, setHasAnyWorkout] = useState(() => {
    const cached = getUserStorageData('workouts', []);
    return Array.isArray(cached) && cached.length > 0;
  });

  const ocrFileInputRef = useRef(null);
  const quickBodyInputRef = useRef(null);

  const proteinBases = {
    water: { id: 'water', name: '水', addP: 0, addCal: 0, addFat: 0, addCarbs: 0, desc: '追加カロリーゼロ' },
    milk: { id: 'milk', name: '牛乳', addP: 6.8, addCal: 134, addFat: 7.8, addCarbs: 9.9, desc: '+134kcal / +P6.8g' },
    soymilk: { id: 'soymilk', name: '豆乳', addP: 7.2, addCal: 92, addFat: 4.0, addCarbs: 6.2, desc: '+92kcal / +P7.2g' }
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
    setProteinPresets(getProteinPresets());
    fetchMyProtein();
    fetchTodayMealStatus();
    fetchWeightMetrics();
  }, [isLoggedToday, dataVersion]);

  const fetchWeightMetrics = () => {
    const cachedMetrics = getUserStorageData('metrics', []);
    const cachedMeals = getUserStorageData('meals', []);
    const cachedWorkouts = getUserStorageData('workouts', []);
    setWeightMetrics(Array.isArray(cachedMetrics) ? cachedMetrics : []);
    setHasAnyMeal(Array.isArray(cachedMeals) && cachedMeals.length > 0);
    setHasAnyWorkout(Array.isArray(cachedWorkouts) && cachedWorkouts.length > 0);
  };

  useEffect(() => {
    return () => {
      if (bodyPreviewUrl) revokeImagePreviewUrl(bodyPreviewUrl);
    };
  }, [bodyPreviewUrl]);

  const applyTodayMealsSummary = (mealList, workoutList = []) => {
    const todayStr = getTodayDateString();
    const todayMeals = mealList.filter(
      (m) => m.log_date === todayStr || (m.timestamp && m.timestamp.startsWith(todayStr))
    );
    const hasProtein = todayMeals.some(
      (m) => m.menu_name?.includes('プロテイン') || m.menu_name?.includes('ホエイ') || m.menu_name?.includes('ソイ')
    );
    const hasMeal = todayMeals.some(
      (m) => !m.menu_name?.includes('プロテイン') && !m.menu_name?.includes('ホエイ') && !m.menu_name?.includes('ソイ')
    );
    setTodayProteinLogged(hasProtein);
    setTodayMealLogged(hasMeal);

    let sumCal = 0;
    let sumP = 0;
    let sumF = 0;
    let sumC = 0;
    todayMeals.forEach((m) => {
      sumCal += m.calories || 0;
      sumP += m.protein_g || 0;
      sumF += m.fat_g || 0;
      sumC += m.carbs_g || 0;
    });
    setTodayCalories(sumCal);
    setTodayProtein(Math.round(sumP * 10) / 10);
    setTodayFat(Math.round(sumF * 10) / 10);
    setTodayCarbs(Math.round(sumC * 10) / 10);

    const formattedMeals = mealList.slice(0, 6).map((m, idx) => {
      const isProt = m.menu_name?.includes('プロテイン') || m.menu_name?.includes('ホエイ') || m.menu_name?.includes('ソイ');
      const timePart = m.meal_time && m.meal_time.includes(':')
        ? m.meal_time
        : m.timestamp && m.timestamp.length >= 16
        ? m.timestamp.slice(11, 16)
        : '12:30';
      return {
        id: m.id || `m_${idx}`,
        type: isProt ? 'protein' : 'meal',
        title: m.menu_name || '食事記録',
        sub: `${m.calories || 0}kcal / P:${m.protein_g || 0}g`,
        date: (m.log_date || m.timestamp?.slice(0, 10) || todayStr).slice(5),
        time: timePart,
        sortKey: m.timestamp || `${m.log_date || todayStr} ${timePart}`
      };
    });

    const formattedWorkouts = workoutList.slice(0, 5).map((w, idx) => {
      const timePart = w.timestamp && w.timestamp.length >= 16 ? w.timestamp.slice(11, 16) : '19:00';
      return {
        id: w.id || `w_${idx}`,
        type: 'workout',
        title: w.menu_name || 'トレーニング',
        sub: w.weight > 0 ? `${w.weight}kg × ${w.reps || 10}回 × ${w.sets || 3}set` : `${w.sets || 3}セット完了`,
        date: (w.log_date || w.timestamp?.slice(0, 10) || todayStr).slice(5),
        time: timePart,
        sortKey: w.timestamp || `${w.log_date || todayStr} ${timePart}`
      };
    });

    const combined = [...formattedMeals, ...formattedWorkouts]
      .sort((a, b) => b.sortKey.localeCompare(a.sortKey))
      .slice(0, 4);
    setRecentTimeline(combined);
  };

  const fetchTodayMealStatus = async () => {
    let loadedMeals = [];
    let loadedWorkouts = [];
    try {
      const [mRes, wRes] = await Promise.all([fetch('/api/meals'), fetch('/api/workouts')]);
      if (mRes.ok) {
        const data = await mRes.json();
        if (data.meals && Array.isArray(data.meals)) {
          loadedMeals = data.meals;
        }
      }
      if (wRes.ok) {
        const wData = await wRes.json();
        if (wData.workouts && Array.isArray(wData.workouts)) {
          loadedWorkouts = wData.workouts;
        }
      }
    } catch {
    }
    if (loadedMeals.length === 0) {
      try {
        const localMeals = getUserStorageData('meals', []);
        if (localMeals && localMeals.length > 0) loadedMeals = localMeals;
      } catch {
      }
    }
    if (loadedWorkouts.length === 0) {
      try {
        const localWorkouts = getUserStorageData('workouts', []);
        if (localWorkouts && localWorkouts.length > 0) loadedWorkouts = localWorkouts;
      } catch {
      }
    }
    applyTodayMealsSummary(loadedMeals, loadedWorkouts);
  };

  const fetchMyProtein = async () => {
    const localActive = getActiveMyProtein();
    setMyProtein(localActive);
    syncOcrFields(localActive);
    try {
      const res = await fetch('/api/my-protein');
      if (res.ok) {
        const data = await res.json();
        if (data && data.product_name) {
          setMyProtein(data);
          syncOcrFields(data);
        }
      }
    } catch {
    }
  };

  const syncOcrFields = (raw) => {
    const item = raw || {};
    setOcrName(item.product_name || '');
    setOcrServingG(item.serving_size_g ?? '');
    setOcrCalories(item.calories ?? '');
    setOcrProteinG(item.protein_g ?? '');
    setOcrFatG(item.fat_g ?? '');
    setOcrCarbsG(item.carbs_g ?? '');
  };

  const handleSelectProteinPreset = async (preset) => {
    setMyProtein(preset);
    syncOcrFields(preset);
    localStorage.setItem('raku_my_protein', JSON.stringify(preset));
    try {
      await fetch('/api/my-protein', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preset)
      });
    } catch {
    }
  };

  const handleOcrFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsOcrRunning(true);
    setOcrMessage(null);
    setOcrAiResult(null);
    const tempPreview = URL.createObjectURL(file);

    try {
      const extracted = await analyzeNutritionLabelImage(file);
      if (!extracted) {
        setOcrMessage('AIで成分表を読み取れませんでした（AIの設定がない、通信に失敗した、または写真から読み取れなかった）。数値を手で入力してください。');
        return;
      }
      setOcrAiResult({ source: extracted.source, ai_original: extracted.ai_original });
      setOcrName(extracted.product_name || '');
      setOcrServingG(extracted.serving_size_g ?? '');
      setOcrCalories(extracted.calories ?? '');
      setOcrProteinG(extracted.protein_g ?? '');
      setOcrFatG(extracted.fat_g ?? '');
      setOcrCarbsG(extracted.carbs_g ?? '');
      setOcrMessage('AI（Gemini）で成分表を読み取りました。値を確認・修正してから保存してください。端末内の元画像は破棄しました（分析のため写真はGoogleのGeminiに送信済み）。');
    } catch {
      setOcrMessage('成分表の読み取りに失敗しました。手動で調整してください。');
    } finally {
      revokeImagePreviewUrl(tempPreview);
      if (ocrFileInputRef.current) ocrFileInputRef.current.value = '';
      setIsOcrRunning(false);
    }
  };

  const handleSaveOcrPreset = async (e) => {
    e.preventDefault();
    if (!String(ocrName || "").trim() || !(parseFloat(ocrProteinG) > 0)) {
      setOcrMessage("商品名と、1食あたりのタンパク質（0より大きい数）を入れてください。");
      return;
    }
    const { preset, list } = saveProteinPreset({
      product_name: ocrName,
      serving_size_g: ocrServingG,
      calories: ocrCalories,
      protein_g: ocrProteinG,
      fat_g: ocrFatG,
      carbs_g: ocrCarbsG,
      ...(ocrAiResult || {})
    });
    setProteinPresets(list);
    setMyProtein(preset);
    setOcrAiResult(null);
    try {
      await fetch('/api/my-protein', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preset)
      });
    } catch {
    }
    setOcrMessage(`「${preset.product_name}」をマイプロテインに登録しました！`);
    setTimeout(() => {
      setProteinModalTab('quick');
      setOcrMessage(null);
    }, 900);
  };

  const handleQuickBodyFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (bodyPreviewUrl) revokeImagePreviewUrl(bodyPreviewUrl);
    setRawBodyFile(file);
    const processed = await processPrivacyImage(file, false);
    setQuickBodyResult(null);
    const check = await inspectBodyPhoto(processed.processedFile);
    if (check.ok && check.faceDetected) {
      revokeImagePreviewUrl(processed.previewUrl);
      setRawBodyFile(null);
      setCroppedBodyFile(null);
      setBodyPreviewUrl('');
      if (quickBodyInputRef.current) quickBodyInputRef.current.value = '';
      setQuickBodyError(BODY_PHOTO_MESSAGES.faceOnSelect);
      setQuickTrim({ file: processed.processedFile, ratio: Math.min(0.8, (check.faceBottom || 0.2) + 0.08) });
      return;
    }
    setCroppedBodyFile(processed.processedFile);
    setBodyPreviewUrl(processed.previewUrl);
    setQuickBodyError('');
  };

  const handleRunQuickBodyAnalysis = async () => {
    if (!croppedBodyFile || isBodyAnalyzing) return;
    setIsBodyAnalyzing(true);
    try {
      const outcome = await analyzeBodyPhoto(croppedBodyFile);
      if (outcome.status !== 'ok') {
        setQuickBodyError(BODY_PHOTO_MESSAGES[outcome.status]);
        setQuickBodyResult(null);
        return;
      }
      const ideal = getUserStorageData('body_ideal', null);
      const cmp = ideal ? compareToIdeal(outcome.metrics, ideal.metrics) : null;
      const result = {
        ...outcome.analysis,
        ideal_id: ideal ? ideal.id : null,
        closeness: cmp ? cmp.closeness : null,
        mean_gap: cmp ? cmp.meanGap : null
      };
      setQuickBodyError('');
      setQuickBodyResult(result);
      setUserStorageData('body_analysis', result);
      const history = getUserStorageData('body_analysis_history', []);
      setUserStorageData('body_analysis_history', [result, ...(Array.isArray(history) ? history : [])]);
    } finally {
      if (bodyPreviewUrl) revokeImagePreviewUrl(bodyPreviewUrl);
      setBodyPreviewUrl('');
      setRawBodyFile(null);
      setCroppedBodyFile(null);
      if (quickBodyInputRef.current) quickBodyInputRef.current.value = '';
      setIsBodyAnalyzing(false);
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
    if (proteinSubmitting || !myProtein) return;
    setProteinSubmitting(true);

    const baseInfo = proteinBases[selectedBase];
    const baseP = mp.protein_g || 0;
    const baseFat = mp.fat_g || 0;
    const baseCarbs = mp.carbs_g || 0;

    const totalProtein = Number((baseP + baseInfo.addP).toFixed(1));
    const totalCalories = Math.round((mp.calories || 0) + baseInfo.addCal);
    const totalFat = Number((baseFat + baseInfo.addFat).toFixed(1));
    const totalCarbs = Number((baseCarbs + baseInfo.addCarbs).toFixed(1));
    const currentTime = getNowTime();
    const todayStr = getTodayDateString();

    const mealPayload = {
      meal_type: currentTime,
      meal_time: currentTime,
      menu_name: `${mp.product_name}（${baseInfo.name}割り）`,
      calories: totalCalories,
      protein_level: '高',
      carbs_level: totalCarbs > 10 ? '普通' : '低',
      fat_level: totalFat > 8 ? '普通' : '低',
      protein_g: totalProtein,
      fat_g: totalFat,
      carbs_g: totalCarbs,
      image_url: '',
      note: `プロテインクイック記録（割り材: ${baseInfo.name}、P:${totalProtein}g）`,
      ...(mp.ai_original ? { analysis_json: JSON.stringify({ source: mp.source, ai_original: mp.ai_original }) } : {})
    };

    try {
      const rawLocal = getUserStorageData('meals', []);
      const parsedLocal = Array.isArray(rawLocal) ? rawLocal : [];
      parsedLocal.unshift({
        id: `meal_${Date.now()}`,
        ...mealPayload,
        log_date: todayStr,
        timestamp: `${todayStr} ${currentTime}:00`
      });
      setUserStorageData('meals', parsedLocal);
    } catch {
    }

    try {
      await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mealPayload)
      });
    } catch {
    }

    setProteinAnim(true);
    setTodayProteinLogged(true);
    fetchTodayMealStatus();
    setTimeout(() => {
      setProteinAnim(false);
      setIsProteinSheetOpen(false);
    }, 900);

    setProteinToast(`${currentTime} にプロテイン（${baseInfo.name}割り / P:${totalProtein}g / ${totalCalories}kcal）を記録しました`);
    setTimeout(() => setProteinToast(null), 3200);
    setProteinSubmitting(false);
  };

  const currentTotalP = Number(((mp.protein_g || 0) + proteinBases[selectedBase].addP).toFixed(1));
  const currentTotalCal = Math.round((mp.calories || 0) + proteinBases[selectedBase].addCal);
  const targetCal = parseInt(localStorage.getItem('raku_target_calories') || '2000', 10) || 2000;
  const remainingProtein = Math.max(0, Math.round((100 - todayProtein) * 10) / 10);
  const targetWeight = parseFloat(localStorage.getItem('raku_target_weight') || '') || null;
  const firstSteps = [
    {
      key: 'weight',
      label: '体重を記録する',
      desc: 'ホームの推移グラフの出発点になります',
      done: weightMetrics.length > 0,
      onClick: onOpenMetrics
    },
    {
      key: 'meal',
      label: '食事を記録する',
      desc: '「手動」タブでメニュー名とカロリーを選びます',
      done: hasAnyMeal,
      onClick: onOpenMeal
    },
    {
      key: 'workout',
      label: '運動を記録する',
      desc: '宅トレかジムを選んで記録します',
      done: hasAnyWorkout,
      onClick: () => onSelectWorkoutType('home')
    }
  ];

  return (
    <div className="flex flex-col space-y-3.5 pb-3">
      {proteinToast && (
        <div className="absolute top-16 inset-x-4 z-50 flex justify-center pointer-events-none">
          <div className="bg-slate-900/95 backdrop-blur-md text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg text-center">
            {proteinToast}
          </div>
        </div>
      )}

      <FirstStepsCard steps={firstSteps} />

      <WeightTrendCard
        metrics={weightMetrics}
        targetWeight={targetWeight}
        todayStr={getTodayDateString()}
        onRecord={onOpenMetrics}
      />

      <div className="grid grid-cols-2 gap-3">
        <section
          onClick={() => setIsQuickBodyModalOpen(true)}
          className="bg-white text-slate-900 rounded-2xl p-4 shadow-sm hover:shadow-md border border-slate-200/80 cursor-pointer transition-all flex flex-col justify-between gap-2.5"
        >
          <div className="flex items-center justify-between gap-1.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100/80 shadow-xs shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              </svg>
            </div>
            <span className="text-[9px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-md border border-indigo-200/70">
              🔒 顔チェック
            </span>
          </div>
          <div>
            <span className="text-xs font-extrabold text-slate-900 block leading-snug">理想体型・AI画像分析</span>
            <p className="text-[10px] text-slate-500 mt-0.5 truncate">送る前に顔をチェック・理想との近さを数値で</p>
          </div>
          <div className="w-full py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-indigo-600 text-[11px] font-bold text-center">
            AI体型診断を開く ›
          </div>
        </section>

        <section
          onClick={() => {
            setProteinPresets(getProteinPresets());
            fetchMyProtein();
            setProteinModalTab('quick');
            setIsProteinSheetOpen(true);
          }}
          className="bg-white text-slate-900 rounded-2xl p-4 shadow-sm hover:shadow-md border border-slate-200/80 cursor-pointer transition-all flex flex-col justify-between gap-2.5"
        >
          <div className="flex items-center justify-between gap-1.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/80 shadow-xs shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-md border border-emerald-200/70">
              {myProtein ? `P:${mp.protein_g}g / OCR` : '未登録'}
            </span>
          </div>
          <div>
            <span className="text-xs font-extrabold text-slate-900 block leading-snug">プロテイン摂取の記録</span>
            <p className="text-[10px] text-slate-500 mt-0.5 truncate">{myProtein ? mp.product_name : '成分表を読み取って登録'}</p>
          </div>
          <div className="w-full py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[11px] font-bold text-center shadow-2xs">
            記録・成分表OCR ›
          </div>
        </section>
      </div>

      <section className="w-full bg-white text-slate-900 rounded-2xl p-4 shadow-sm border border-slate-200/80 space-y-3">
        <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/70">
          {[
            { id: 0, label: '🔥 継続状況' },
            { id: 1, label: '🥗 栄養・PFC' },
            { id: 2, label: '💡 おすすめ' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCurrentSlide(tab.id)}
              className={`py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                currentSlide === tab.id
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {currentSlide === 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 bg-slate-50 rounded-xl p-3.5 border border-slate-200/70">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-500 border border-orange-200/60 flex items-center justify-center text-lg shrink-0 shadow-2xs">
                  🔥
                </div>
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-slate-900 tracking-tight">{streakDays}</span>
                    <span className="text-xs font-bold text-slate-600">日連続記録中</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {isLoggedToday ? '本日の運動記録は完了済みです' : '本日の運動や食事を記録しましょう'}
                  </p>
                </div>
              </div>
              <div className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border shrink-0 ${
                (isLoggedToday && todayMealLogged && todayProteinLogged)
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-white text-slate-600 border-slate-200'
              }`}>
                {(isLoggedToday ? 1 : 0) + (todayMealLogged ? 1 : 0) + (todayProteinLogged ? 1 : 0)}/3 達成
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border text-xs font-bold transition-all ${
                isLoggedToday
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                  : 'bg-slate-50 text-slate-400 border-slate-200/60'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isLoggedToday ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <span>運動</span>
                <span className="text-[10px]">{isLoggedToday ? '✓' : ''}</span>
              </div>

              <div className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border text-xs font-bold transition-all ${
                todayMealLogged
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                  : 'bg-slate-50 text-slate-400 border-slate-200/60'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${todayMealLogged ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <span>食事</span>
                <span className="text-[10px]">{todayMealLogged ? '✓' : ''}</span>
              </div>

              <div className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border text-xs font-bold transition-all ${
                todayProteinLogged
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                  : 'bg-slate-50 text-slate-400 border-slate-200/60'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${todayProteinLogged ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <span>プロテイン</span>
                <span className="text-[10px]">{todayProteinLogged ? '✓' : ''}</span>
              </div>
            </div>
          </div>
        )}

        {currentSlide === 1 && (
          <div className="space-y-3">
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/70 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">本日の摂取カロリー</span>
                <div className="flex items-center gap-2">
                  <span className="text-base font-black text-slate-900">
                    {todayCalories.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">/ {targetCal.toLocaleString()} kcal</span>
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                    todayCalories > targetCal + 200
                      ? 'text-rose-700 bg-rose-50 border-rose-200/80'
                      : 'text-emerald-700 bg-emerald-50 border-emerald-200/80'
                  }`}>
                    {Math.round((todayCalories / targetCal) * 100)}%
                  </span>
                </div>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    todayCalories > targetCal + 200 ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(Math.round((todayCalories / targetCal) * 100), 100)}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                <span className="text-[10px] text-blue-600 font-bold block">タンパク質(P)</span>
                <span className="font-extrabold text-slate-800 text-xs">{todayProtein}g</span>
                <span className="text-[9px] text-slate-400 ml-1">/100g</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                <span className="text-[10px] text-amber-600 font-bold block">脂質(F)</span>
                <span className="font-extrabold text-slate-800 text-xs">{todayFat}g</span>
                <span className="text-[9px] text-slate-400 ml-1">/55g</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                <span className="text-[10px] text-emerald-600 font-bold block">炭水化物(C)</span>
                <span className="font-extrabold text-slate-800 text-xs">{todayCarbs}g</span>
                <span className="text-[9px] text-slate-400 ml-1">/250g</span>
              </div>
            </div>
          </div>
        )}

        {currentSlide === 2 && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2.5 bg-slate-50 rounded-xl p-3.5 border border-slate-200/70">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/70 flex items-center justify-center text-base shrink-0">
                  🏋️
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 truncate">チェストプレスマシン</span>
                    <span className="text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-md font-bold border border-blue-200/60 shrink-0">
                      胸
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">目安: 20kg × 10回 × 3セット</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onSelectWorkoutType('gym')}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg shadow-2xs transition-all cursor-pointer shrink-0"
              >
                開始 ›
              </button>
            </div>
            <div className="bg-blue-50/60 px-3 py-2.5 rounded-xl border border-blue-200/60 text-[11px] text-blue-900 leading-snug font-medium">
              💡 大胸筋など大きな筋群を刺激すると基礎代謝が向上し、脂肪燃焼効果が持続します。
            </div>
          </div>
        )}
      </section>

      <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-extrabold text-slate-800">本日のトレーニング記録</h2>
          <span className="text-[10px] font-bold text-slate-400">モードを選択して開始</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div
            onClick={() => onSelectWorkoutType('home')}
            className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 hover:border-blue-400 hover:bg-blue-50/40 cursor-pointer transition-all flex items-center gap-2.5 group"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-2xs shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-800 block leading-tight">宅トレ・自重</span>
              <span className="text-[10px] text-slate-500 mt-0.5 block truncate">自重・有酸素</span>
            </div>
          </div>

          <div
            onClick={() => onSelectWorkoutType('gym')}
            className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 hover:border-indigo-400 hover:bg-indigo-50/40 cursor-pointer transition-all flex items-center gap-2.5 group"
          >
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-2xs shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-800 block leading-tight">ジム・マシン</span>
              <span className="text-[10px] text-slate-500 mt-0.5 block truncate">部位別・重量</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleTap}
          disabled={loading || isLoggedToday}
          className={`w-full h-10 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
            isLoggedToday
              ? 'bg-slate-100 text-blue-700 border border-blue-200 cursor-default'
              : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm active:scale-[0.99]'
          }`}
        >
          {isLoggedToday ? (
            <>
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
              <span>本日の運動を記録済み</span>
            </>
          ) : loading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>記録中...</span>
            </>
          ) : (
            <span>本日の運動をワンタップ記録</span>
          )}
        </button>
      </section>

      <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-extrabold text-slate-800">本日の食事・プロテイン・運動タイムライン</h2>
            <p className="text-[10px] text-slate-500 mt-0.5">直近の記録と達成ログ</p>
          </div>
          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200/60">
            最新 {recentTimeline.length} 件
          </span>
        </div>

        {recentTimeline.length === 0 ? (
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/70 text-center space-y-1">
            <p className="text-xs font-bold text-slate-600">まだ本日のタイムライン記録がありません</p>
            <p className="text-[10px] text-slate-400">上のボタンからプロテインや運動を記録してみましょう</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentTimeline.map((item) => (
              <div
                key={item.id}
                className="bg-slate-50 rounded-xl p-3 border border-slate-200/70 flex items-center justify-between gap-2.5"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0 border ${
                    item.type === 'workout'
                      ? 'bg-blue-50 text-blue-700 border-blue-200/80'
                      : item.type === 'protein'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                      : 'bg-amber-50 text-amber-700 border-amber-200/80'
                  }`}>
                    {item.type === 'workout' ? '🏋️' : item.type === 'protein' ? '🥤' : '🍽️'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 truncate">{item.title}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                        item.type === 'workout'
                          ? 'bg-blue-100/80 text-blue-700'
                          : item.type === 'protein'
                          ? 'bg-emerald-100/80 text-emerald-700'
                          : 'bg-slate-200/80 text-slate-700'
                      }`}>
                        {item.type === 'workout' ? '運動' : item.type === 'protein' ? 'プロテイン' : '食事'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5 truncate">{item.sub}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[11px] font-extrabold text-slate-700 block tabular-nums">{item.time}</span>
                  <span className="text-[9px] text-slate-400 font-bold block">{item.date}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">🤖</span>
            <h2 className="text-xs font-extrabold text-slate-800">今日のAIワンポイントアドバイス</h2>
          </div>
          <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/70">
            スマートコーチ
          </span>
        </div>
        <div className="bg-gradient-to-r from-indigo-50/70 via-blue-50/70 to-emerald-50/60 rounded-xl p-3.5 border border-indigo-100/90 space-y-2">
          <p className="text-xs font-bold text-slate-800 leading-relaxed">
            {remainingProtein > 0
              ? myProtein
                ? `タンパク質は、アプリの目安（100g）まであと約 ${remainingProtein}g です。「${mp.product_name}」を1杯飲むと、約${mp.protein_g}g補えます。`
                : `タンパク質は、アプリの目安（100g）まであと約 ${remainingProtein}g です。よく飲むプロテインを登録すると、ワンタップで記録できます。`
              : '今日のタンパク質は、アプリの目安（100g）に届いています。'}
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="bg-white/90 rounded-lg p-2 border border-slate-200/70 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500">残りP目安</span>
              <span className="text-xs font-black text-emerald-700">{remainingProtein}g</span>
            </div>
            <div className="bg-white/90 rounded-lg p-2 border border-slate-200/70 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500">推奨水分量</span>
              <span className="text-xs font-black text-blue-700">2.0L / 日</span>
            </div>
          </div>
        </div>
      </section>

      {isQuickBodyModalOpen && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs pt-14 pb-5 px-4">
          <div className="w-full bg-white rounded-2xl p-4 shadow-2xl border border-slate-200/90 max-h-full overflow-y-auto space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-900">📸 体型AIクイック診断</h3>
                <span className="text-[10px] font-bold text-emerald-700">
                  🔒 解析後、端末内の元画像は破棄（写真はGoogleのGeminiに送信）
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (bodyPreviewUrl) revokeImagePreviewUrl(bodyPreviewUrl);
                  setBodyPreviewUrl('');
                  setRawBodyFile(null);
                  setCroppedBodyFile(null);
                  setIsQuickBodyModalOpen(false);
                }}
                className="w-7 h-7 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-200/80">
              <div className="min-w-0">
                <span className="text-xs font-extrabold text-slate-900 block leading-tight">
                  🛡️ 顔が写らないように撮ってください
                </span>
                <span className="text-[10px] text-slate-500 block">
                  顔が写らないように、首から下を正面から撮ってください。送る前に、この端末の中で顔が写っていないかを自動で調べ、顔が見つかった写真は送りません（見落とすこともあるので、撮り方に気をつけてください）。
                </span>
              </div>
            </div>

            {quickTrim && (
              <PhotoTrimmer
                file={quickTrim.file}
                initialRatio={quickTrim.ratio}
                onUse={(processed) => {
                  setRawBodyFile(processed.processedFile);
                  setCroppedBodyFile(processed.processedFile);
                  setBodyPreviewUrl(processed.previewUrl);
                  setQuickBodyError('');
                  setQuickTrim(null);
                }}
                onCancel={() => setQuickTrim(null)}
              />
            )}

            <input
              ref={quickBodyInputRef}
              type="file"
              accept="image/*"
              onChange={handleQuickBodyFileChange}
              className="hidden"
            />

            {!bodyPreviewUrl ? (
              <button
                type="button"
                onClick={() => quickBodyInputRef.current?.click()}
                className="w-full py-5 border-2 border-dashed border-indigo-200 hover:border-indigo-500 rounded-xl bg-indigo-50/30 flex flex-col items-center justify-center gap-1 cursor-pointer"
              >
                <span className="text-xs font-bold text-indigo-700">📷 体型写真を選択してクイックAI診断</span>
                <span className="text-[10px] text-slate-500">首から下を正面から撮った写真を選ぶ</span>
              </button>
            ) : (
              <div className="space-y-2">
                <div className="relative h-32 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 flex items-center justify-center">
                  <img src={bodyPreviewUrl} alt="プレビュー" className="h-full w-auto object-cover" />
                  <span className="absolute top-1.5 left-1.5 bg-indigo-600/90 text-white text-[9px] font-bold px-2 py-0.5 rounded-md">
                    送る前に顔をチェックします
                  </span>
                </div>
                <button
                  type="button"
                  disabled={isBodyAnalyzing}
                  onClick={handleRunQuickBodyAnalysis}
                  className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isBodyAnalyzing ? 'AI解析中...' : 'AI解析を実行（写真はGoogleのGeminiに送信）'}
                </button>
              </div>
            )}

            {quickBodyError && (
              <div className="bg-rose-50 rounded-xl p-3.5 border border-rose-200/80 text-[11px] font-bold text-rose-700 leading-relaxed">
                {quickBodyError}
              </div>
            )}

            {quickBodyResult && (
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-indigo-700">{quickBodyResult.body_type}</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    推定体脂肪 {quickBodyResult.estimated_body_fat ?? '-'}%
                  </span>
                </div>
                <p className="text-[11px] text-slate-700 leading-relaxed">
                  {quickBodyResult.analysis_summary || quickBodyResult.summary}
                </p>
                {Number.isFinite(quickBodyResult.closeness) && (
                  <p className="text-[11px] font-bold text-indigo-700">理想への近さ {quickBodyResult.closeness}%（くわしくは体型分析の画面で）</p>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                if (bodyPreviewUrl) revokeImagePreviewUrl(bodyPreviewUrl);
                setIsQuickBodyModalOpen(false);
                onOpenBodyAnalysis();
              }}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
            >
              体型分析の詳細画面を開く ›
            </button>
          </div>
        </div>
      )}

      {isProteinSheetOpen && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs pt-14 pb-5 px-4">
          <div className="w-full bg-white rounded-2xl p-4 shadow-2xl border border-slate-200/90 max-h-full overflow-y-auto space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">プロテイン記録 ＆ 成分表OCR</h3>
                <p className="text-[10px] text-slate-500">マイプロテイン選択または裏面ラベル自動読取</p>
              </div>
              <button
                type="button"
                onClick={() => setIsProteinSheetOpen(false)}
                className="w-7 h-7 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setProteinModalTab('quick')}
                className={`py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  proteinModalTab === 'quick'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                ⚡ ワンタップ記録
              </button>
              <button
                type="button"
                onClick={() => setProteinModalTab('ocr')}
                className={`py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  proteinModalTab === 'ocr'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                📷 成分表ラベル読取(OCR)
              </button>
            </div>

            {proteinModalTab === 'quick' && !myProtein ? (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 text-center text-[11px] text-slate-600 leading-relaxed">
                まだプロテインが登録されていません。「成分表ラベル読取」タブで、パッケージの栄養成分表示を読み取るか、数値を入れて登録してください。
              </div>
            ) : proteinModalTab === 'quick' ? (
              <div className="space-y-2.5">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-slate-600">⭐ マイプロテイン / プリセット切替</span>
                    <span className="text-[9px] text-emerald-700 font-bold">{proteinPresets.length}種登録済</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {proteinPresets.slice(0, 4).map((item) => {
                      const isCurrent = item.product_name === mp.product_name;
                      return (
                        <button
                          key={item.id || item.product_name}
                          type="button"
                          onClick={() => handleSelectProteinPreset(item)}
                          className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                            isCurrent
                              ? 'bg-emerald-50/90 border-emerald-500 text-emerald-900 shadow-2xs'
                              : 'bg-white border-slate-200/80 text-slate-700 hover:bg-slate-100/70'
                          }`}
                        >
                          <div className="text-[10px] font-extrabold truncate">{item.product_name}</div>
                          <div className="text-[9px] text-slate-500 font-bold mt-0.5">
                            {item.calories}kcal / <span className="text-emerald-700">P:{item.protein_g}g</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {Object.values(proteinBases).map((b) => {
                    const isSelected = selectedBase === b.id;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setSelectedBase(b.id)}
                        className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/80 text-emerald-800 shadow-xs'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="text-xs font-bold">{b.name}</span>
                        <span className="text-[9px] text-slate-500 leading-tight">{b.desc}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500">合計P: </span>
                    <span className="font-extrabold text-emerald-700 text-sm">{currentTotalP}g</span>
                  </div>
                  <div>
                    <span className="text-slate-500">合計カロリー: </span>
                    <span className="font-bold text-slate-900 text-sm">{currentTotalCal}kcal</span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={proteinSubmitting}
                  onClick={handleDrinkProtein}
                  className={`w-full h-10 py-2 text-white font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    proteinAnim
                      ? 'bg-emerald-600'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-500/20'
                  } disabled:opacity-50`}
                >
                  {proteinAnim ? '記録完了！' : proteinSubmitting ? '記録中...' : `プロテインを記録する（${getNowTime()}）`}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSaveOcrPreset} className="space-y-2.5">
                <input
                  ref={ocrFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleOcrFileChange}
                  className="hidden"
                />

                <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-2.5 space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2.5">
                    <span className="text-[11px] font-extrabold text-emerald-950">📷 裏面の栄養成分表示から自動入力</span>
                    <span className="text-[9px] font-bold text-emerald-700">🔒 解析後、端末内の元画像は破棄（写真はGoogleのGeminiに送信）</span>
                  </div>
                  <button
                    type="button"
                    disabled={isOcrRunning}
                    onClick={() => ocrFileInputRef.current?.click()}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-2xs cursor-pointer disabled:opacity-50"
                  >
                    {isOcrRunning ? 'AI OCRで成分表を読み取り中...' : 'パッケージ裏面の成分表を撮影・選択'}
                  </button>
                </div>

                {ocrMessage && (
                  <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold text-center">
                    {ocrMessage}
                  </div>
                )}

                <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-[11px] font-bold text-slate-700 shrink-0">商品名</label>
                    <input
                      type="text"
                      value={ocrName}
                      onChange={(e) => setOcrName(e.target.value)}
                      className="flex-1 min-w-0 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900 text-right focus:outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500">1食量(g)</span>
                      <input
                        type="number"
                        step="0.1"
                        value={ocrServingG}
                        onChange={(e) => setOcrServingG(e.target.value)}
                        className="w-14 text-right text-xs font-bold text-slate-900 focus:outline-none"
                        required
                      />
                    </div>
                    <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500">カロリー</span>
                      <input
                        type="number"
                        value={ocrCalories}
                        onChange={(e) => setOcrCalories(e.target.value)}
                        className="w-14 text-right text-xs font-bold text-slate-900 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    <div className="flex items-center justify-between bg-white px-2 py-1.5 rounded-lg border border-slate-200">
                      <span className="text-[10px] font-bold text-emerald-700">P(g)</span>
                      <input
                        type="number"
                        step="0.1"
                        value={ocrProteinG}
                        onChange={(e) => setOcrProteinG(e.target.value)}
                        className="w-11 text-right text-xs font-bold text-slate-900 focus:outline-none"
                        required
                      />
                    </div>
                    <div className="flex items-center justify-between bg-white px-2 py-1.5 rounded-lg border border-slate-200">
                      <span className="text-[10px] font-bold text-amber-600">F(g)</span>
                      <input
                        type="number"
                        step="0.1"
                        value={ocrFatG}
                        onChange={(e) => setOcrFatG(e.target.value)}
                        className="w-11 text-right text-xs font-bold text-slate-900 focus:outline-none"
                        required
                      />
                    </div>
                    <div className="flex items-center justify-between bg-white px-2 py-1.5 rounded-lg border border-slate-200">
                      <span className="text-[10px] font-bold text-blue-600">C(g)</span>
                      <input
                        type="number"
                        step="0.1"
                        value={ocrCarbsG}
                        onChange={(e) => setOcrCarbsG(e.target.value)}
                        className="w-11 text-right text-xs font-bold text-slate-900 focus:outline-none"
                        required
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-xl shadow-md text-xs cursor-pointer"
                >
                  ⭐ マイプロテインとしてプリセット保存
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
