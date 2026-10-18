import React, { useState, useEffect, useRef } from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import {
  analyzeMealImage,
  analyzeNutritionLabelImage,
  revokeImagePreviewUrl
} from '../utils/geminiAnalyzer';
import {
  getProteinPresets,
  saveProteinPreset,
  getActiveMyProtein
} from '../utils/demoData';
import { getUserStorageData, setUserStorageData } from '../utils/authService';

export default function MealScreen({ onRecordSuccess, dataVersion }) {
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

  const quickMealPresets = [
    { name: 'サラダチキン＆おにぎり', cal: 450, p: '高', c: '普通', f: '低' },
    { name: '高タンパク和定食（焼き魚）', cal: 600, p: '高', c: '普通', f: '普通' },
    { name: '鶏胸肉とブロッコリー玄米', cal: 500, p: '高', c: '普通', f: '低' },
    { name: '豆腐と豚しゃぶサラダ', cal: 400, p: '高', c: '低', f: '低' },
    { name: '牛赤身肉ステーキセット', cal: 650, p: '高', c: '低', f: '普通' },
    { name: 'オートミール＆ヨーグルト', cal: 350, p: '普通', c: '普通', f: '低' },
    { name: 'ヘルシー自炊スープ', cal: 300, p: '普通', c: '低', f: '低' }
  ];

  const proteinBases = {
    water: {
      id: 'water',
      name: '水',
      addCal: 0,
      addP: 0,
      addFat: 0,
      addCarbs: 0,
      desc: '追加カロリーゼロ'
    },
    milk: {
      id: 'milk',
      name: '牛乳',
      addCal: 134,
      addP: 6.8,
      addFat: 7.8,
      addCarbs: 9.9,
      desc: '+134kcal / P+6.8g'
    },
    soymilk: {
      id: 'soymilk',
      name: '豆乳',
      addCal: 92,
      addP: 7.2,
      addFat: 4.0,
      addCarbs: 6.2,
      desc: '+92kcal / P+7.2g'
    }
  };

  const [activeMainTab, setActiveMainTab] = useState('ai');
  const [analysisChartTab, setAnalysisChartTab] = useState('radar');
  const [showSliders, setShowSliders] = useState(false);

  const [recordTime, setRecordTime] = useState(getNowTime());
  const [mealCategory, setMealCategory] = useState('昼食');
  const [openCategories, setOpenCategories] = useState({ '朝食': false, '昼食': false, '夕食': false, '間食': false });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  const [adjMealName, setAdjMealName] = useState('');
  const [adjCalories, setAdjCalories] = useState(500);
  const [adjProtein, setAdjProtein] = useState(30);
  const [adjFat, setAdjFat] = useState(15);
  const [adjCarbs, setAdjCarbs] = useState(60);
  const [adjFiber, setAdjFiber] = useState(5);
  const [adjSalt, setAdjSalt] = useState(2.0);

  const [proteinPresets, setProteinPresets] = useState(() => getProteinPresets());
  const [myProtein, setMyProtein] = useState(() => getActiveMyProtein());
  const [isProteinSheetOpen, setIsProteinSheetOpen] = useState(false);
  const [selectedBase, setSelectedBase] = useState('water');
  const [proteinRecordedAnim, setProteinRecordedAnim] = useState(false);

  const [settingName, setSettingName] = useState('ゴールドスタンダード 100%ホエイ');
  const [settingServingSize, setSettingServingSize] = useState(30.0);
  const [settingProtein, setSettingProtein] = useState(24.0);
  const [settingCalories, setSettingCalories] = useState(120);
  const [settingFat, setSettingFat] = useState(1.0);
  const [settingCarbs, setSettingCarbs] = useState(2.0);
  const [isAnalyzingLabel, setIsAnalyzingLabel] = useState(false);
  const [isSavingProtein, setIsSavingProtein] = useState(false);

  const [menuName, setMenuName] = useState('鶏胸肉と玄米定食');
  const [calories, setCalories] = useState(500);
  const [proteinLevel, setProteinLevel] = useState('高');
  const [carbsLevel, setCarbsLevel] = useState('普通');
  const [fatLevel, setFatLevel] = useState('低');
  const [note, setNote] = useState('');

  const [meals, setMeals] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const fileInputRef = useRef(null);
  const nutritionLabelInputRef = useRef(null);

  useEffect(() => {
    setProteinPresets(getProteinPresets());
    fetchMeals();
    fetchMyProtein();
  }, [dataVersion]);

  useEffect(() => {
    return () => {
      if (imagePreview) revokeImagePreviewUrl(imagePreview);
    };
  }, [imagePreview]);

  const appendLocalMeal = (payload) => {
    const todayStr = getTodayDateString();
    try {
      const rawLocal = getUserStorageData('meals', []);
      const parsedLocal = Array.isArray(rawLocal) ? rawLocal : [];
      parsedLocal.unshift({
        id: `meal_${Date.now()}`,
        ...payload,
        log_date: todayStr,
        timestamp: `${todayStr} ${payload.meal_time || getNowTime()}:00`
      });
      setUserStorageData('meals', parsedLocal);
    } catch {
    }
  };

  const fetchMeals = async () => {
    try {
      const res = await fetch('/api/meals');
      if (res.ok) {
        const data = await res.json();
        if (data.meals && data.meals.length > 0) {
          setMeals(data.meals);
          return;
        }
      }
    } catch {
    }
    try {
      const cached = getUserStorageData('meals', []);
      setMeals(Array.isArray(cached) ? cached : []);
    } catch {
      setMeals([]);
    }
  };

  const fetchMyProtein = async () => {
    const localActive = getActiveMyProtein();
    setMyProtein(localActive);
    syncSettingState(localActive);
    try {
      const res = await fetch('/api/my-protein');
      if (res.ok) {
        const data = await res.json();
        if (data && data.product_name) {
          setMyProtein(data);
          syncSettingState(data);
        }
      }
    } catch {
    }
  };

  const syncSettingState = (data) => {
    setSettingName(data.product_name || 'ゴールドスタンダード 100%ホエイ');
    setSettingServingSize(data.serving_size_g || 30.0);
    setSettingProtein(data.protein_g !== undefined ? data.protein_g : 24.0);
    setSettingCalories(data.calories || 120);
    setSettingFat(data.fat_g !== undefined ? data.fat_g : 1.0);
    setSettingCarbs(data.carbs_g !== undefined ? data.carbs_g : 2.0);
  };

  const handleSelectPresetProtein = async (preset) => {
    setMyProtein(preset);
    syncSettingState(preset);
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

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (imagePreview) revokeImagePreviewUrl(imagePreview);
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setAnalysisResult(null);
      setMessage(null);
      setRecordTime(getNowTime());
    }
  };

  const handleClearImage = () => {
    if (imagePreview) revokeImagePreviewUrl(imagePreview);
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const recalculateRadarAndBars = (cal, p, f, c, fiber, salt) => {
    const pScore = Math.min(100, Math.round((p / 30) * 100));
    const fScore = Math.max(30, Math.min(100, Math.round(100 - Math.abs(f - 15) * 2.5)));
    const cScore = Math.min(100, Math.round((c / 75) * 100));
    const calScore = Math.max(40, Math.min(100, Math.round(100 - Math.abs(cal - 600) * 0.08)));
    const fiberScore = Math.min(100, Math.round((fiber / 7) * 100));

    return {
      radar_data: [
        { subject: 'エネルギー', score: calScore, fullMark: 100 },
        { subject: 'タンパク質', score: pScore, fullMark: 100 },
        { subject: '脂質適正度', score: fScore, fullMark: 100 },
        { subject: '炭水化物', score: cScore, fullMark: 100 },
        { subject: '食物繊維/V', score: fiberScore, fullMark: 100 }
      ],
      nutrient_bars: [
        { name: 'タンパク質', amount: p, unit: 'g', target: 30.0, percentage: Math.round((p / 30) * 100), status: p >= 30 ? '高水準充足' : '標準' },
        { name: '脂質', amount: f, unit: 'g', target: 18.0, percentage: Math.round((f / 18) * 100), status: f <= 18 ? '控えめ良好' : 'やや高め' },
        { name: '炭水化物', amount: c, unit: 'g', target: 75.0, percentage: Math.round((c / 75) * 100), status: '適正量' },
        { name: '食物繊維', amount: fiber, unit: 'g', target: 7.0, percentage: Math.round((fiber / 7) * 100), status: fiber >= 6 ? '良好' : '控えめ' },
        { name: '食塩相当量', amount: salt, unit: 'g', target: 2.5, percentage: Math.round((salt / 2.5) * 100), status: salt <= 2.5 ? '適正範囲' : 'やや多め' }
      ]
    };
  };

  const handleAnalyzeMeal = async () => {
    if (!selectedImage || isAnalyzing) return;
    setIsAnalyzing(true);
    setMessage(null);

    try {
      const analysis = await analyzeMealImage(selectedImage);

      setAnalysisResult({
        ...analysis,
        image_url: ''
      });

      setAdjMealName(analysis.meal_name || '解析料理');
      setAdjCalories(analysis.calories || 500);
      setAdjProtein(analysis.protein_g || 25);
      setAdjFat(analysis.fat_g || 15);
      setAdjCarbs(analysis.carbs_g || 60);
      setAdjFiber(analysis.fiber_g || 5);
      setAdjSalt(analysis.salt_g || 2.0);

      setMessage({
        type: 'success',
        text: 'AI栄養バランスの分析が完了し、元画像データをメモリから自動破棄しました！'
      });
    } catch {
      setMessage({ type: 'error', text: '画像解析処理中にエラーが発生しました。' });
    } finally {
      handleClearImage();
      setIsAnalyzing(false);
    }
  };

  const handleSaveAnalysis = async () => {
    if (!analysisResult || isSubmitting) return;
    setIsSubmitting(true);
    setMessage(null);

    const recomputed = recalculateRadarAndBars(adjCalories, adjProtein, adjFat, adjCarbs, adjFiber, adjSalt);
    const finalResult = {
      ...analysisResult,
      meal_name: adjMealName,
      calories: adjCalories,
      protein_g: adjProtein,
      fat_g: adjFat,
      carbs_g: adjCarbs,
      fiber_g: adjFiber,
      salt_g: adjSalt,
      radar_data: recomputed.radar_data,
      nutrient_bars: recomputed.nutrient_bars,
      image_url: ''
    };

    const mealPayload = {
      meal_type: recordTime,
      meal_time: recordTime,
      menu_name: adjMealName,
      calories: adjCalories,
      protein_level: adjProtein >= 30 ? '高' : adjProtein >= 15 ? '普通' : '低',
      carbs_level: adjCarbs <= 40 ? '低' : adjCarbs <= 85 ? '普通' : '高',
      fat_level: adjFat <= 15 ? '低' : adjFat <= 30 ? '普通' : '高',
      protein_g: adjProtein,
      fat_g: adjFat,
      carbs_g: adjCarbs,
      fiber_g: adjFiber,
      salt_g: adjSalt,
      analysis_json: JSON.stringify(finalResult),
      image_url: '',
      note: finalResult.feedback_comment || ''
    };

    appendLocalMeal(mealPayload);

    try {
      await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mealPayload)
      });
    } catch {
    }

    setMessage({ type: 'success', text: `${recordTime}（${adjMealName}）を記録しました！` });
    fetchMeals();
    if (onRecordSuccess) {
      onRecordSuccess('食事を記録しました！');
    }
    setIsSubmitting(false);
  };

  const handleApplyPreset = (p) => {
    setMenuName(p.name);
    setCalories(p.cal);
    setProteinLevel(p.p);
    setCarbsLevel(p.c);
    setFatLevel(p.f);
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!menuName.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setMessage(null);

    const estP = proteinLevel === '高' ? 32 : proteinLevel === '普通' ? 20 : 10;
    const estF = fatLevel === '低' ? 10 : fatLevel === '普通' ? 18 : 28;
    const estC = carbsLevel === '低' ? 30 : carbsLevel === '普通' ? 65 : 95;

    const payload = {
      meal_type: recordTime,
      meal_time: recordTime,
      menu_name: menuName,
      calories: parseInt(calories, 10),
      protein_level: proteinLevel,
      carbs_level: carbsLevel,
      fat_level: fatLevel,
      protein_g: estP,
      fat_g: estF,
      carbs_g: estC,
      image_url: '',
      note: note
    };

    appendLocalMeal(payload);

    try {
      await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch {
    }

    setMessage({ type: 'success', text: `${recordTime}（${menuName}）を記録しました！` });
    fetchMeals();
    if (onRecordSuccess) {
      onRecordSuccess('食事を記録しました！');
    }
    setIsSubmitting(false);
  };

  const handleNutritionLabelChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzingLabel(true);
    setMessage(null);
    const tempUrl = URL.createObjectURL(file);

    try {
      const extracted = await analyzeNutritionLabelImage(file);
      if (extracted) {
        setSettingName(extracted.product_name || 'ホエイプロテイン');
        setSettingServingSize(extracted.serving_size_g || 30.0);
        setSettingCalories(extracted.calories || 120);
        setSettingProtein(extracted.protein_g !== undefined ? extracted.protein_g : 24.0);
        setSettingFat(extracted.fat_g !== undefined ? extracted.fat_g : 1.0);
        setSettingCarbs(extracted.carbs_g !== undefined ? extracted.carbs_g : 2.0);
        setMessage({
          type: 'success',
          text: '成分表ラベル（OCR）から栄養素を自動抽出し、元画像を破棄しました！'
        });
      }
    } catch {
      setMessage({ type: 'error', text: '成分表の読み取りに失敗しました。' });
    } finally {
      revokeImagePreviewUrl(tempUrl);
      if (nutritionLabelInputRef.current) nutritionLabelInputRef.current.value = '';
      setIsAnalyzingLabel(false);
    }
  };

  const handleSaveProteinSettings = async (e) => {
    e.preventDefault();
    if (isSavingProtein) return;
    setIsSavingProtein(true);

    const { preset, list } = saveProteinPreset({
      product_name: settingName.trim() || 'マイプロテイン',
      serving_size_g: parseFloat(settingServingSize) || 30.0,
      protein_g: parseFloat(settingProtein) || 24.0,
      calories: parseInt(settingCalories, 10) || 120,
      fat_g: parseFloat(settingFat) || 1.0,
      carbs_g: parseFloat(settingCarbs) || 2.0
    });

    setProteinPresets(list);
    setMyProtein(preset);

    try {
      await fetch('/api/my-protein', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preset)
      });
    } catch {
    } finally {
      setIsSavingProtein(false);
      setMessage({
        type: 'success',
        text: `⭐「${preset.product_name}」をマイプロテイン・定番食品に登録しました！`
      });
    }
  };

  const handleRecordOcrFoodDirectly = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const currentTime = getNowTime();
    const payload = {
      meal_type: currentTime,
      meal_time: currentTime,
      menu_name: settingName.trim() || 'OCR読取食品',
      calories: parseInt(settingCalories, 10) || 120,
      protein_level: parseFloat(settingProtein) >= 20 ? '高' : '普通',
      carbs_level: parseFloat(settingCarbs) <= 15 ? '低' : '普通',
      fat_level: parseFloat(settingFat) <= 10 ? '低' : '普通',
      protein_g: parseFloat(settingProtein) || 24.0,
      fat_g: parseFloat(settingFat) || 1.0,
      carbs_g: parseFloat(settingCarbs) || 2.0,
      image_url: '',
      note: `成分表OCRから記録（1食 ${settingServingSize}g）`
    };

    appendLocalMeal(payload);

    try {
      await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch {
    }

    fetchMeals();
    setMessage({
      type: 'success',
      text: `${currentTime} に「${payload.menu_name}」（${payload.calories}kcal / P:${payload.protein_g}g）を記録しました！`
    });
    if (onRecordSuccess) onRecordSuccess('食事を記録しました！');
    setIsSubmitting(false);
  };

  const handleDrinkProtein = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const baseInfo = proteinBases[selectedBase];
    const baseP = myProtein.protein_g !== undefined ? myProtein.protein_g : 24.0;
    const baseFat = myProtein.fat_g !== undefined ? myProtein.fat_g : 1.0;
    const baseCarbs = myProtein.carbs_g !== undefined ? myProtein.carbs_g : 2.0;

    const totalProtein = Number((baseP + baseInfo.addP).toFixed(1));
    const totalCalories = Math.round((myProtein.calories || 120) + baseInfo.addCal);
    const totalFat = Number((baseFat + baseInfo.addFat).toFixed(1));
    const totalCarbs = Number((baseCarbs + baseInfo.addCarbs).toFixed(1));
    const currentTime = getNowTime();

    const analysisObj = {
      meal_name: `${myProtein.product_name}（${baseInfo.name}割り）`,
      calories: totalCalories,
      protein_level: '高',
      carbs_level: totalCarbs > 10 ? '普通' : '低',
      fat_level: totalFat > 8 ? '普通' : '低',
      feedback_comment: `良質なタンパク質${totalProtein}gを補給完了！`
    };

    const payload = {
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
      analysis_json: JSON.stringify(analysisObj),
      image_url: '',
      note: `プロテイン摂取（割り材: ${baseInfo.name}、P:${totalProtein}g）`
    };

    appendLocalMeal(payload);

    try {
      await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch {
    }

    setProteinRecordedAnim(true);
    setTimeout(() => {
      setProteinRecordedAnim(false);
      setIsProteinSheetOpen(false);
    }, 900);

    setMessage({
      type: 'success',
      text: `🥤 ${currentTime} にプロテイン（${baseInfo.name}割り / P:${totalProtein}g / ${totalCalories}kcal）を記録しました！`
    });
    fetchMeals();
    if (onRecordSuccess) {
      onRecordSuccess('プロテインを記録しました！');
    }
    setIsSubmitting(false);
  };

  const formatMealTimeDisplay = (m) => {
    if (m.meal_time && m.meal_time.includes(':')) {
      return m.meal_time;
    }
    if (m.meal_type && m.meal_type.includes(':')) {
      return m.meal_type;
    }
    if (m.timestamp && m.timestamp.length >= 16) {
      return m.timestamp.substring(11, 16);
    }
    return m.meal_type || '記録';
  };

  const baseP = myProtein.protein_g !== undefined ? myProtein.protein_g : 24.0;
  const baseFat = myProtein.fat_g !== undefined ? myProtein.fat_g : 1.0;
  const baseCarbs = myProtein.carbs_g !== undefined ? myProtein.carbs_g : 2.0;
  const currentTotalP = Number((baseP + proteinBases[selectedBase].addP).toFixed(1));
  const currentTotalCal = Math.round((myProtein.calories || 120) + proteinBases[selectedBase].addCal);
  const currentTotalFat = Number((baseFat + proteinBases[selectedBase].addFat).toFixed(1));
  const currentTotalCarbs = Number((baseCarbs + proteinBases[selectedBase].addCarbs).toFixed(1));

  const todayStr = getTodayDateString();
  const todayMealsList = meals.filter(
    (m) => m.log_date === todayStr || (m.timestamp && m.timestamp.startsWith(todayStr))
  );
  const activeSummaryMeals = todayMealsList.length > 0 ? todayMealsList : meals.slice(0, 3);
  const sumCalories = activeSummaryMeals.reduce((acc, m) => acc + (m.calories || 0), 0);
  const sumProtein = Math.round(activeSummaryMeals.reduce((acc, m) => acc + (m.protein_g || 0), 0) * 10) / 10;
  const sumFat = Math.round(activeSummaryMeals.reduce((acc, m) => acc + (m.fat_g || 0), 0) * 10) / 10;
  const sumCarbs = Math.round(activeSummaryMeals.reduce((acc, m) => acc + (m.carbs_g || 0), 0) * 10) / 10;
  const targetCal = parseInt(localStorage.getItem('raku_target_calories') || '2000', 10) || 2000;

  return (
    <div className="flex flex-col space-y-3.5 pb-3">
      <header className="flex items-center justify-between px-0.5">
        <div>
          <h1 className="text-base font-extrabold text-slate-900 leading-tight">食事・プロテイン管理</h1>
          <p className="text-[10px] text-slate-500">AI栄養解析・成分表OCR・履歴</p>
        </div>
        <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500">時刻</span>
          <input
            type="time"
            value={recordTime}
            onChange={(e) => setRecordTime(e.target.value)}
            className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer"
          />
        </div>
      </header>

      {message && (
        <div className={`p-3 rounded-xl text-[11px] font-bold text-center transition-all shadow-xs ${
          message.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {message.text}
        </div>
      )}

      <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-base font-bold border border-emerald-200/80 shrink-0">
              🥤
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200/80">
                  ⭐ マイプロテイン
                </span>
                <span className="text-[10px] text-slate-500 font-bold">
                  1食 {myProtein.serving_size_g || 30}g
                </span>
              </div>
              <h2 className="text-xs font-bold text-slate-900 truncate mt-0.5">
                {myProtein.product_name}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                syncSettingState(myProtein);
                setActiveMainTab('ocr');
              }}
              className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-xl border border-emerald-200 cursor-pointer"
            >
              📷 成分表OCR
            </button>
            <button
              type="button"
              onClick={() => {
                setRecordTime(getNowTime());
                setIsProteinSheetOpen(true);
              }}
              className="text-[10px] font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 px-3 py-1.5 rounded-xl shadow-xs cursor-pointer"
            >
              + 1杯記録
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <div className="bg-emerald-50/50 rounded-xl p-2 border border-emerald-100 text-center">
            <span className="text-[9px] text-slate-500 block font-medium">エネルギー</span>
            <span className="text-[11px] font-bold text-slate-900 block">{myProtein.calories || 120}kcal</span>
          </div>
          <div className="bg-emerald-50/50 rounded-xl p-2 border border-emerald-100 text-center">
            <span className="text-[9px] text-emerald-700 block font-bold">タンパク質</span>
            <span className="text-[11px] font-bold text-emerald-700 block">{myProtein.protein_g}g</span>
          </div>
          <div className="bg-emerald-50/50 rounded-xl p-2 border border-emerald-100 text-center">
            <span className="text-[9px] text-slate-500 block font-medium">脂質</span>
            <span className="text-[11px] font-bold text-slate-900 block">{myProtein.fat_g !== undefined ? myProtein.fat_g : 1.0}g</span>
          </div>
          <div className="bg-emerald-50/50 rounded-xl p-2 border border-emerald-100 text-center">
            <span className="text-[9px] text-slate-500 block font-medium">炭水化物</span>
            <span className="text-[11px] font-bold text-slate-900 block">{myProtein.carbs_g !== undefined ? myProtein.carbs_g : 2.0}g</span>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 space-y-3">
        <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveMainTab('ai')}
            className={`py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
              activeMainTab === 'ai'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            📸 AI解析
          </button>
          <button
            type="button"
            onClick={() => setActiveMainTab('ocr')}
            className={`py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
              activeMainTab === 'ocr'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            📷 成分表OCR
          </button>
          <button
            type="button"
            onClick={() => setActiveMainTab('manual')}
            className={`py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
              activeMainTab === 'manual'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            ✍️ 手動
          </button>
          <button
            type="button"
            onClick={() => setActiveMainTab('history')}
            className={`py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
              activeMainTab === 'history'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            📋 履歴({meals.length})
          </button>
        </div>

        {activeMainTab === 'ai' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/70">
              <span className="text-[10px] font-bold text-slate-600">食事写真のAI栄養推定</span>
              <span className="text-[10px] font-bold text-emerald-700">
                🔒 解析後に元画像は自動破棄されます
              </span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageChange}
              className="hidden"
            />

            {!imagePreview ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-6 border-2 border-dashed border-emerald-200/90 hover:border-emerald-500 rounded-xl bg-emerald-50/30 hover:bg-emerald-50/60 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  </svg>
                </div>
                <span className="text-xs font-bold text-slate-900">食事の写真を撮影または選択</span>
                <span className="text-[10px] text-slate-500">AIがカロリーとPFCを算出し、元画像は即破棄します</span>
              </button>
            ) : (
              <div className="space-y-2.5">
                <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-neutral-900 shadow-xs max-h-40 flex items-center justify-center">
                  <img
                    src={imagePreview}
                    alt="食事プレビュー"
                    className="w-full h-auto object-cover max-h-40"
                  />
                  <button
                    type="button"
                    onClick={handleClearImage}
                    className="absolute top-2 right-2 bg-black/65 hover:bg-black/85 text-white rounded-lg px-2.5 py-1 text-[10px] font-bold transition-colors cursor-pointer"
                  >
                    ✕ 変更
                  </button>
                </div>

                {!analysisResult && (
                  <button
                    type="button"
                    disabled={isAnalyzing}
                    onClick={handleAnalyzeMeal}
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-md shadow-emerald-500/20 transition-all text-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>AIが栄養素を分析中...</span>
                      </>
                    ) : (
                      <span>AIで栄養バランスを分析する（解析後に画像破棄）</span>
                    )}
                  </button>
                )}
              </div>
            )}

            {analysisResult && (() => {
              const currentMetrics = recalculateRadarAndBars(adjCalories, adjProtein, adjFat, adjCarbs, adjFiber, adjSalt);
              return (
                <div className="space-y-2.5 pt-1">
                  <div className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-100/80 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={adjMealName}
                        onChange={(e) => setAdjMealName(e.target.value)}
                        className="text-xs font-bold text-slate-900 bg-white border border-emerald-200 rounded-lg px-2.5 py-1 flex-1 min-w-0 focus:outline-none"
                        placeholder="料理名"
                      />
                      <div className="text-right shrink-0">
                        <span className="text-base font-black text-emerald-700 tabular-nums">
                          {adjCalories} <span className="text-[10px] font-bold text-slate-500">kcal</span>
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 text-center">
                      <div className="bg-white rounded-lg py-1 px-2 border border-blue-200/70 text-[10px] font-bold text-blue-700">
                        P: {adjProtein}g
                      </div>
                      <div className="bg-white rounded-lg py-1 px-2 border border-amber-200/70 text-[10px] font-bold text-amber-700">
                        F: {adjFat}g
                      </div>
                      <div className="bg-white rounded-lg py-1 px-2 border border-emerald-200/70 text-[10px] font-bold text-emerald-700">
                        C: {adjCarbs}g
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl border border-slate-200/80 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowSliders(!showSliders)}
                      className="w-full px-3 py-2 flex items-center justify-between text-left cursor-pointer hover:bg-slate-100/70"
                    >
                      <span className="text-[11px] font-bold text-slate-800">🎚️ 栄養素の手動微調整スライダー</span>
                      <span className="text-[10px] font-bold text-slate-500">{showSliders ? '閉じる ▲' : '開く ▼'}</span>
                    </button>

                    {showSliders && (
                      <div className="px-3 pb-3 pt-1 border-t border-slate-200/60 space-y-2">
                        <div className="flex items-center justify-between gap-2 text-[11px]">
                          <span className="text-slate-700 font-bold w-28 shrink-0">カロリー: {adjCalories}</span>
                          <input
                            type="range"
                            min="100"
                            max="1500"
                            step="10"
                            value={adjCalories}
                            onChange={(e) => setAdjCalories(Number(e.target.value))}
                            className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <span className="text-[10px] text-blue-700 font-bold block mb-0.5">P (タンパク): {adjProtein}g</span>
                            <input
                              type="range"
                              min="0"
                              max="80"
                              step="0.5"
                              value={adjProtein}
                              onChange={(e) => setAdjProtein(Number(e.target.value))}
                              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-amber-700 font-bold block mb-0.5">F (脂質): {adjFat}g</span>
                            <input
                              type="range"
                              min="0"
                              max="60"
                              step="0.5"
                              value={adjFat}
                              onChange={(e) => setAdjFat(Number(e.target.value))}
                              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-emerald-700 font-bold block mb-0.5">C (炭水化物): {adjCarbs}g</span>
                            <input
                              type="range"
                              min="0"
                              max="150"
                              step="1"
                              value={adjCarbs}
                              onChange={(e) => setAdjCarbs(Number(e.target.value))}
                              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-teal-700 font-bold block mb-0.5">食物繊維: {adjFiber}g</span>
                            <input
                              type="range"
                              min="0"
                              max="20"
                              step="0.5"
                              value={adjFiber}
                              onChange={(e) => setAdjFiber(Number(e.target.value))}
                              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/80 space-y-2">
                    <div className="grid grid-cols-2 gap-1 bg-slate-200/70 p-0.5 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setAnalysisChartTab('radar')}
                        className={`py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                          analysisChartTab === 'radar'
                            ? 'bg-white text-emerald-700 shadow-2xs'
                            : 'text-slate-600'
                        }`}
                      >
                        📊 レーダーチャート
                      </button>
                      <button
                        type="button"
                        onClick={() => setAnalysisChartTab('bars')}
                        className={`py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                          analysisChartTab === 'bars'
                            ? 'bg-white text-emerald-700 shadow-2xs'
                            : 'text-slate-600'
                        }`}
                      >
                        📈 栄養達成度リスト
                      </button>
                    </div>

                    {analysisChartTab === 'radar' ? (
                      <div className="w-full h-44 bg-white rounded-lg border border-slate-200/60 p-1">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={currentMetrics.radar_data}>
                            <PolarGrid stroke="#E2E8F0" strokeDasharray="3 3" />
                            <PolarAngleAxis
                              dataKey="subject"
                              tick={{ fill: '#0F172A', fontSize: 9, fontWeight: 700 }}
                            />
                            <PolarRadiusAxis
                              angle={30}
                              domain={[0, 100]}
                              tick={{ fontSize: 7, fill: '#64748B' }}
                            />
                            <Radar
                              name="スコア"
                              dataKey="score"
                              stroke="#059669"
                              fill="#059669"
                              fillOpacity={0.25}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-1.5">
                        {currentMetrics.nutrient_bars?.map((item, idx) => {
                          const percent = Math.min(Math.max(item.percentage, 0), 100);
                          return (
                            <div
                              key={idx}
                              className={`bg-white rounded-lg p-2 border border-slate-200/70 ${
                                idx === 4 ? 'col-span-2' : ''
                              }`}
                            >
                              <div className="flex justify-between items-center text-[10px] mb-1">
                                <span className="font-bold text-slate-800">{item.name}</span>
                                <span className="font-bold text-emerald-700">{item.amount}{item.unit} ({item.percentage}%)</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-emerald-500"
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleSaveAnalysis}
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-md shadow-emerald-500/20 transition-all text-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? '保存中...' : `この内容で食事を保存する（${recordTime}）`}
                  </button>
                </div>
              );
            })()}
          </div>
        )}

        {activeMainTab === 'ocr' && (
          <div className="space-y-2.5">
            <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-emerald-950">📷 栄養成分表示ラベル読取 (OCR)</span>
                <span className="text-[10px] font-bold text-emerald-700">🔒 解析後に元画像は自動破棄されます</span>
              </div>
              <p className="text-[10px] text-slate-600">
                プロテインや市販食品の裏面「栄養成分表示」を撮影すると、カロリー・P・F・Cを自動抽出します。
              </p>
              <input
                ref={nutritionLabelInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleNutritionLabelChange}
                className="hidden"
              />
              <button
                type="button"
                disabled={isAnalyzingLabel}
                onClick={() => nutritionLabelInputRef.current?.click()}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isAnalyzingLabel ? 'AI OCRで成分表を読み取り中...' : '📷 パッケージ裏面の栄養成分表を撮影・選択'}
              </button>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-slate-600">⭐ 登録済みマイプロテイン・定番プリセット</span>
                <span className="text-[9px] text-emerald-700 font-bold">ワンタップ呼出</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {proteinPresets.slice(0, 4).map((p) => {
                  const isCurrent = p.product_name === settingName;
                  return (
                    <button
                      key={p.id || p.product_name}
                      type="button"
                      onClick={() => handleSelectPresetProtein(p)}
                      className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-2xs'
                          : 'bg-white border-slate-200/80 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="text-[10px] font-extrabold truncate">{p.product_name}</div>
                      <div className="text-[9px] text-slate-500 font-bold mt-0.5">
                        {p.calories}kcal / <span className="text-emerald-700">P:{p.protein_g}g</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleSaveProteinSettings} className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-[11px] font-bold text-slate-700 shrink-0">商品名</label>
                <input
                  type="text"
                  value={settingName}
                  onChange={(e) => setSettingName(e.target.value)}
                  className="flex-1 min-w-0 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900 text-right focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center justify-between gap-1 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500">1食量(g)</span>
                  <input
                    type="number"
                    step="0.1"
                    value={settingServingSize}
                    onChange={(e) => setSettingServingSize(e.target.value)}
                    className="w-14 text-right text-xs font-bold text-slate-900 focus:outline-none"
                    required
                  />
                </div>
                <div className="flex items-center justify-between gap-1 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500">kcal</span>
                  <input
                    type="number"
                    value={settingCalories}
                    onChange={(e) => setSettingCalories(e.target.value)}
                    className="w-14 text-right text-xs font-bold text-slate-900 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                <div className="flex items-center justify-between gap-1 bg-white px-2 py-1.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-emerald-700">P(g)</span>
                  <input
                    type="number"
                    step="0.1"
                    value={settingProtein}
                    onChange={(e) => setSettingProtein(e.target.value)}
                    className="w-11 text-right text-xs font-bold text-slate-900 focus:outline-none"
                    required
                  />
                </div>
                <div className="flex items-center justify-between gap-1 bg-white px-2 py-1.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-amber-600">F(g)</span>
                  <input
                    type="number"
                    step="0.1"
                    value={settingFat}
                    onChange={(e) => setSettingFat(e.target.value)}
                    className="w-11 text-right text-xs font-bold text-slate-900 focus:outline-none"
                    required
                  />
                </div>
                <div className="flex items-center justify-between gap-1 bg-white px-2 py-1.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-blue-600">C(g)</span>
                  <input
                    type="number"
                    step="0.1"
                    value={settingCarbs}
                    onChange={(e) => setSettingCarbs(e.target.value)}
                    className="w-11 text-right text-xs font-bold text-slate-900 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isSavingProtein}
                  className="py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-[11px] cursor-pointer disabled:opacity-50"
                >
                  ⭐ マイ定番に保存
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleRecordOcrFoodDirectly}
                  className="py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-xl text-[11px] shadow-xs cursor-pointer disabled:opacity-50"
                >
                  + このまま食事記録
                </button>
              </div>
            </form>
          </div>
        )}

        {activeMainTab === 'manual' && (
          <form onSubmit={handleManualSubmit} className="space-y-2.5">
            <div className="flex items-center justify-between gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/80">
              <span className="text-xs font-bold text-slate-700 shrink-0">食事区分</span>
              <select
                value={mealCategory}
                onChange={(e) => setMealCategory(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900 focus:outline-none cursor-pointer"
              >
                <option value="朝食">☀️ 朝食</option>
                <option value="昼食">🍱 昼食</option>
                <option value="夕食">🌙 夕食</option>
                <option value="間食">☕ 間食・補食</option>
              </select>
            </div>

            <div className="flex items-center justify-between gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/80">
              <span className="text-xs font-bold text-slate-700 shrink-0">定番プリセット</span>
              <select
                onChange={(e) => {
                  const p = quickMealPresets.find((x) => x.name === e.target.value);
                  if (p) handleApplyPreset(p);
                }}
                defaultValue=""
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900 focus:outline-none max-w-[200px] truncate cursor-pointer"
              >
                <option value="" disabled>メニューを選択...</option>
                {quickMealPresets.map((p, idx) => (
                  <option key={idx} value={p.name}>
                    {p.name} ({p.cal}kcal)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/80">
              <label className="text-xs font-bold text-slate-700 shrink-0">メニュー名</label>
              <input
                type="text"
                value={menuName}
                onChange={(e) => setMenuName(e.target.value)}
                placeholder="例: サラダチキン定食"
                className="w-48 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900 text-right focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/80">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold text-slate-700">カロリー</span>
                  <span className="text-[10px] font-bold text-emerald-700">{calories}kcal</span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {[300, 500, 700, 900].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCalories(c)}
                      className={`py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        calories === c
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-white text-slate-600 border border-slate-200'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/80">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold text-slate-700">タンパク質</span>
                  <span className="text-[10px] font-bold text-emerald-700">{proteinLevel}</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {['高', '普通', '低'].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setProteinLevel(lvl)}
                      className={`py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        proteinLevel === lvl
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-white text-slate-600 border border-slate-200'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-600 block mb-1">糖質: {carbsLevel}</span>
                <div className="grid grid-cols-3 gap-1">
                  {['低', '普通', '高'].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setCarbsLevel(lvl)}
                      className={`py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        carbsLevel === lvl
                          ? 'bg-slate-800 text-white'
                          : 'bg-white text-slate-600 border border-slate-200'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-600 block mb-1">脂質: {fatLevel}</span>
                <div className="grid grid-cols-3 gap-1">
                  {['低', '普通', '高'].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setFatLevel(lvl)}
                      className={`py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        fatLevel === lvl
                          ? 'bg-slate-800 text-white'
                          : 'bg-white text-slate-600 border border-slate-200'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/80">
              <label className="text-xs font-bold text-slate-700 shrink-0">メモ</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="任意メモ"
                className="w-48 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 text-right focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-md shadow-emerald-500/20 text-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer transition-all"
            >
              {isSubmitting ? '保存中...' : '手動で食事記録を保存する'}
            </button>
          </form>
        )}

        {activeMainTab === 'history' && (
          <div className="space-y-2">
            {meals.length === 0 ? (
              <div className="bg-slate-50 rounded-xl p-5 text-center border border-slate-200/70">
                <p className="text-xs text-slate-400">食事記録がありません</p>
              </div>
            ) : (
              <div className="space-y-2">
                {[
                  { key: '朝食', icon: '☀️', label: '朝食' },
                  { key: '昼食', icon: '🍱', label: '昼食' },
                  { key: '夕食', icon: '🌙', label: '夕食' },
                  { key: '間食', icon: '☕', label: '間食・プロテイン' }
                ].map((cat) => {
                  const list = meals.filter((m) => {
                    const time = m.meal_time || m.meal_type || m.timestamp?.slice(11, 16) || '12:00';
                    const hour = parseInt(time.split(':')[0], 10) || 12;
                    const isProtein =
                      m.menu_name?.includes('プロテイン') ||
                      m.menu_name?.includes('ホエイ') ||
                      m.menu_name?.includes('ソイ') ||
                      m.meal_type?.includes('間食');

                    if (cat.key === '間食') return isProtein || hour < 4 || hour >= 22;
                    if (isProtein) return false;
                    if (cat.key === '朝食') return hour >= 4 && hour < 11;
                    if (cat.key === '昼食') return hour >= 11 && hour < 16;
                    if (cat.key === '夕食') return hour >= 16 && hour < 22;
                    return false;
                  });

                  const isOpen = !!openCategories[cat.key];
                  const catCalories = list.reduce((sum, item) => sum + (item.calories || 0), 0);

                  return (
                    <div key={cat.key} className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/80 space-y-2">
                      <button
                        type="button"
                        onClick={() => setOpenCategories((prev) => ({ ...prev, [cat.key]: !isOpen }))}
                        className="w-full flex items-center justify-between text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs">{cat.icon}</span>
                          <span className="text-xs font-bold text-slate-800">{cat.label}</span>
                          <span className="text-[10px] text-slate-500 font-bold">({list.length}品 / {catCalories} kcal)</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold">{isOpen ? '▲' : '▼'}</span>
                      </button>

                      {isOpen && (
                        <div className="space-y-1.5 pt-1 border-t border-slate-200/60">
                          {list.length === 0 ? (
                            <div className="bg-white rounded-lg p-2.5 border border-slate-200/70 text-center">
                              <p className="text-[10px] text-slate-400">記録なし</p>
                            </div>
                          ) : (
                            list.map((m) => {
                              const timeLabel = formatMealTimeDisplay(m);
                              const isProtein =
                                m.menu_name?.includes('プロテイン') ||
                                m.menu_name?.includes('ホエイ') ||
                                m.menu_name?.includes('ソイ');
                              return (
                                <div key={m.id} className="bg-white rounded-lg p-2.5 border border-slate-200/80 flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 border ${
                                      isProtein
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : 'bg-slate-50 text-slate-600 border-slate-200'
                                    }`}>
                                      {isProtein ? '🥤' : '🍽️'}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[11px] font-bold text-slate-900 truncate">{m.menu_name}</span>
                                        <span className="text-[9px] text-slate-400 shrink-0">{timeLabel}</span>
                                      </div>
                                      <div className="text-[9px] text-slate-500 flex items-center gap-1.5">
                                        {m.protein_g !== undefined && <span className="text-emerald-700 font-bold">P:{m.protein_g}g</span>}
                                        {m.fat_g !== undefined && <span>F:{m.fat_g}g</span>}
                                        {m.carbs_g !== undefined && <span>C:{m.carbs_g}g</span>}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <span className="text-xs font-black text-slate-900">{m.calories}</span>
                                    <span className="text-[9px] text-slate-400 ml-0.5">kcal</span>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>

      <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-extrabold text-slate-800">本日の栄養摂取サマリー（PFC達成度）</h2>
            <p className="text-[10px] text-slate-500 mt-0.5">目標カロリー {targetCal.toLocaleString()}kcal に対する進捗</p>
          </div>
          <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200/80 tabular-nums">
            {sumCalories.toLocaleString()} kcal
          </span>
        </div>

        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70 space-y-2.5">
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                sumCalories > targetCal + 200 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, Math.round((sumCalories / targetCal) * 100))}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white rounded-lg p-2 border border-slate-200/70 space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold text-blue-700">P タンパク</span>
                <span className="font-extrabold text-slate-800">{sumProtein}g</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full" style={{ width: `${Math.min(100, Math.round((sumProtein / 100) * 100))}%` }} />
              </div>
            </div>

            <div className="bg-white rounded-lg p-2 border border-slate-200/70 space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold text-amber-700">F 脂質</span>
                <span className="font-extrabold text-slate-800">{sumFat}g</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${Math.min(100, Math.round((sumFat / 55) * 100))}%` }} />
              </div>
            </div>

            <div className="bg-white rounded-lg p-2 border border-slate-200/70 space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold text-emerald-700">C 炭水化物</span>
                <span className="font-extrabold text-slate-800">{sumCarbs}g</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, Math.round((sumCarbs / 250) * 100))}%` }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-extrabold text-slate-800">直近の食事・プロテイン記録リスト</h2>
            <p className="text-[10px] text-slate-500 mt-0.5">記録したメニューは即座に反映されます</p>
          </div>
          <button
            type="button"
            onClick={() => setActiveMainTab('history')}
            className="text-[10px] font-bold text-emerald-700 hover:underline cursor-pointer"
          >
            すべて見る ({meals.length}) ›
          </button>
        </div>

        {meals.length === 0 ? (
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/70 text-center">
            <p className="text-xs text-slate-400">まだ食事・プロテインの記録がありません</p>
          </div>
        ) : (
          <div className="space-y-2">
            {meals.slice(0, 4).map((m, idx) => {
              const timeLabel = formatMealTimeDisplay(m);
              const isProtein =
                m.menu_name?.includes('プロテイン') ||
                m.menu_name?.includes('ホエイ') ||
                m.menu_name?.includes('ソイ');
              return (
                <div key={m.id || idx} className="bg-slate-50 rounded-xl p-3 border border-slate-200/70 flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0 border ${
                      isProtein
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}>
                      {isProtein ? '🥤' : '🍽️'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 truncate">{m.menu_name}</span>
                        <span className="text-[9px] text-slate-400 font-bold shrink-0">{timeLabel}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="text-emerald-700 font-bold">P:{m.protein_g !== undefined ? m.protein_g : '-'}g</span>
                        <span>F:{m.fat_g !== undefined ? m.fat_g : '-'}g</span>
                        <span>C:{m.carbs_g !== undefined ? m.carbs_g : '-'}g</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-slate-900 tabular-nums">{m.calories}</span>
                    <span className="text-[9px] text-slate-400 ml-0.5">kcal</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {isProteinSheetOpen && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs pt-14 pb-5 px-4">
          <div className="w-full bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xl max-h-full overflow-y-auto space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900">プロテイン摂取を記録</h3>
              <button
                type="button"
                onClick={() => setIsProteinSheetOpen(false)}
                className="w-7 h-7 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-600 block">⭐ マイプロテイン切替</span>
              <div className="grid grid-cols-2 gap-1.5">
                {proteinPresets.slice(0, 4).map((p) => {
                  const isCurrent = p.product_name === myProtein.product_name;
                  return (
                    <button
                      key={p.id || p.product_name}
                      type="button"
                      onClick={() => handleSelectPresetProtein(p)}
                      className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-2xs'
                          : 'bg-white border-slate-200/80 text-slate-700'
                      }`}
                    >
                      <div className="text-[10px] font-extrabold truncate">{p.product_name}</div>
                      <div className="text-[9px] text-slate-500 font-bold">
                        {p.calories}kcal / <span className="text-emerald-700">P:{p.protein_g}g</span>
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
                        ? 'border-emerald-500 bg-emerald-50/80 text-emerald-800 font-bold shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span className="text-xs font-bold">{b.name}</span>
                    <span className="text-[9px] text-slate-500 leading-tight">{b.desc}</span>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-4 gap-2 text-center bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
              <div className="bg-white rounded-lg p-1.5 border border-slate-200/60">
                <span className="text-[9px] text-slate-500 block">総カロリー</span>
                <span className="text-[11px] font-bold text-slate-900">{currentTotalCal}kcal</span>
              </div>
              <div className="bg-white rounded-lg p-1.5 border border-emerald-200/60">
                <span className="text-[9px] text-emerald-700 font-bold block">タンパク質</span>
                <span className="text-[11px] font-bold text-emerald-700">{currentTotalP}g</span>
              </div>
              <div className="bg-white rounded-lg p-1.5 border border-slate-200/60">
                <span className="text-[9px] text-slate-500 block">脂質</span>
                <span className="text-[11px] font-bold text-slate-900">{currentTotalFat}g</span>
              </div>
              <div className="bg-white rounded-lg p-1.5 border border-slate-200/60">
                <span className="text-[9px] text-slate-500 block">炭水化物</span>
                <span className="text-[11px] font-bold text-slate-900">{currentTotalCarbs}g</span>
              </div>
            </div>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleDrinkProtein}
              className="w-full py-2.5 text-white font-bold rounded-xl shadow-md bg-gradient-to-r from-emerald-600 to-teal-600 text-xs cursor-pointer disabled:opacity-50"
            >
              {proteinRecordedAnim ? '記録完了！' : isSubmitting ? '記録中...' : `プロテインを記録する（${getNowTime()}）`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
