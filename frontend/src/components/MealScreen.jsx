import React, { useState, useEffect, useRef } from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { analyzeMealImage, getActiveGeminiAuth } from '../utils/geminiAnalyzer';
import { nutritionDatabase, findMatchingFood, calculateScaledNutrition } from '../data/nutritionDb';

export default function MealScreen({ onRecordSuccess, onOpenGeminiSetup }) {
  const geminiStatus = getActiveGeminiAuth();
  const getNowTime = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
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
      desc: '+134 kcal / +P 6.8g / +F 7.8g / +C 9.9g'
    },
    soymilk: {
      id: 'soymilk',
      name: '豆乳',
      addCal: 92,
      addP: 7.2,
      addFat: 4.0,
      addCarbs: 6.2,
      desc: '+92 kcal / +P 7.2g / +F 4.0g / +C 6.2g'
    }
  };

  const [recordTime, setRecordTime] = useState(getNowTime());
  const [mealCategory, setMealCategory] = useState('昼食');
  const [openCategories, setOpenCategories] = useState({ '朝食': true, '昼食': true, '夕食': true, '間食': true });
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

  const [myProtein, setMyProtein] = useState({
    product_name: 'ゴールドスタンダード ホエイ',
    serving_size_g: 30.0,
    protein_g: 24.0,
    calories: 120,
    fat_g: 1.0,
    carbs_g: 2.0,
    image_url: '',
    nutrition_image_url: ''
  });
  const [isProteinModalOpen, setIsProteinModalOpen] = useState(false);
  const [isProteinSheetOpen, setIsProteinSheetOpen] = useState(false);
  const [selectedBase, setSelectedBase] = useState('water');
  const [proteinRecordedAnim, setProteinRecordedAnim] = useState(false);

  const [settingName, setSettingName] = useState('ゴールドスタンダード ホエイ');
  const [settingServingSize, setSettingServingSize] = useState(30.0);
  const [settingProtein, setSettingProtein] = useState(24.0);
  const [settingCalories, setSettingCalories] = useState(120);
  const [settingFat, setSettingFat] = useState(1.0);
  const [settingCarbs, setSettingCarbs] = useState(2.0);
  const [settingPackagePreview, setSettingPackagePreview] = useState('');
  const [settingNutritionPreview, setSettingNutritionPreview] = useState('');
  const [isAnalyzingLabel, setIsAnalyzingLabel] = useState(false);
  const [isSavingProtein, setIsSavingProtein] = useState(false);

  const [showManualForm, setShowManualForm] = useState(false);
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
  const proteinPackageInputRef = useRef(null);
  const nutritionLabelInputRef = useRef(null);

  useEffect(() => {
    fetchMeals();
    fetchMyProtein();
  }, []);

  const fetchMeals = async () => {
    try {
      const res = await fetch('/api/meals');
      if (res.ok) {
        const data = await res.json();
        if (data.meals) {
          setMeals(data.meals);
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
          syncSettingState(data);
        }
      }
    } catch {
      const cached = localStorage.getItem('raku_my_protein');
      if (cached) {
        const parsed = JSON.parse(cached);
        setMyProtein(parsed);
        syncSettingState(parsed);
      }
    }
  };

  const syncSettingState = (data) => {
    setSettingName(data.product_name || 'ゴールドスタンダード ホエイ');
    setSettingServingSize(data.serving_size_g || 30.0);
    setSettingProtein(data.protein_g !== undefined ? data.protein_g : 24.0);
    setSettingCalories(data.calories || 120);
    setSettingFat(data.fat_g !== undefined ? data.fat_g : 1.0);
    setSettingCarbs(data.carbs_g !== undefined ? data.carbs_g : 2.0);
    setSettingPackagePreview(data.image_url || '');
    setSettingNutritionPreview(data.nutrition_image_url || '');
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setAnalysisResult(null);
      setMessage(null);
      setRecordTime(getNowTime());
    }
  };

  const handleClearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setAnalysisResult(null);
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
      let uploadImageUrl = '';
      try {
        const formData = new FormData();
        formData.append('image', selectedImage);
        formData.append('meal_type', recordTime);
        const uploadRes = await fetch('/api/analyze-meal', {
          method: 'POST',
          body: formData,
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          if (uploadData.image_url) {
            uploadImageUrl = uploadData.image_url;
          }
        }
      } catch {}

      const analysis = await analyzeMealImage(selectedImage, recordTime);

      setAnalysisResult({
        ...analysis,
        image_url: uploadImageUrl || imagePreview,
      });

      setAdjMealName(analysis.meal_name || '解析料理');
      setAdjCalories(analysis.calories || 500);
      setAdjProtein(analysis.protein_g || 25);
      setAdjFat(analysis.fat_g || 15);
      setAdjCarbs(analysis.carbs_g || 60);
      setAdjFiber(analysis.fiber_g || 5);
      setAdjSalt(analysis.salt_g || 2.0);

      const sourceLabel = analysis.source === 'gemini' ? 'Gemini AI高精度解析' : '栄養マスターデータベース照合';
      setMessage({ type: 'success', text: `【${sourceLabel}】栄養バランスの分析が完了しました！` });
    } catch {
      setMessage({ type: 'error', text: '画像解析処理中にエラーが発生しました。' });
    } finally {
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
      nutrient_bars: recomputed.nutrient_bars
    };

    try {
      const res = await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
          image_url: finalResult.image_url || '',
          note: finalResult.feedback_comment || '',
        }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: `${recordTime}（${adjMealName}）を記録しました！` });
        fetchMeals();
        if (onRecordSuccess) {
          onRecordSuccess('食事を記録しました！');
        }
      } else {
        setMessage({ type: 'error', text: '保存に失敗しました。' });
      }
    } catch {
      setMessage({ type: 'error', text: '通信エラーが発生しました。' });
    } finally {
      setIsSubmitting(false);
    }
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

    try {
      const res = await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meal_type: recordTime,
          meal_time: recordTime,
          menu_name: menuName,
          calories: parseInt(calories, 10),
          protein_level: proteinLevel,
          carbs_level: carbsLevel,
          fat_level: fatLevel,
          note: note,
        }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: `${recordTime}（${menuName}）を記録しました！` });
        fetchMeals();
        if (onRecordSuccess) {
          onRecordSuccess('食事を記録しました！');
        }
      } else {
        setMessage({ type: 'error', text: '保存に失敗しました。' });
      }
    } catch {
      setMessage({ type: 'error', text: '通信エラーが発生しました。' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProteinPackageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/upload-protein-image', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        if (data.image_url) {
          setSettingPackagePreview(data.image_url);
        }
      }
    } catch {
      setSettingPackagePreview(URL.createObjectURL(file));
    }
  };

  const handleNutritionLabelChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzingLabel(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/analyze-nutrition-label', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          const d = result.data;
          if (d.product_name) setSettingName(d.product_name);
          if (d.serving_size_g) setSettingServingSize(d.serving_size_g);
          if (d.calories) setSettingCalories(d.calories);
          if (d.protein_g) setSettingProtein(d.protein_g);
          if (d.fat_g !== undefined) setSettingFat(d.fat_g);
          if (d.carbs_g !== undefined) setSettingCarbs(d.carbs_g);
          setSettingNutritionPreview(result.image_url);
          setMessage({ type: 'success', text: '成分表から栄養素を自動読み取りしました！' });
        }
      }
    } catch {
      setSettingNutritionPreview(URL.createObjectURL(file));
    } finally {
      setIsAnalyzingLabel(false);
    }
  };

  const handleSaveProteinSettings = async (e) => {
    e.preventDefault();
    if (isSavingProtein) return;
    setIsSavingProtein(true);

    const payload = {
      product_name: settingName.trim() || 'マイプロテイン',
      serving_size_g: parseFloat(settingServingSize) || 30.0,
      protein_g: parseFloat(settingProtein) || 24.0,
      calories: parseInt(settingCalories, 10) || 120,
      fat_g: parseFloat(settingFat) || 1.0,
      carbs_g: parseFloat(settingCarbs) || 2.0,
      image_url: settingPackagePreview || '',
      nutrition_image_url: settingNutritionPreview || '',
    };

    try {
      const res = await fetch('/api/my-protein', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        setMyProtein(data);
        localStorage.setItem('raku_my_protein', JSON.stringify(data));
        setIsProteinModalOpen(false);
        setMessage({ type: 'success', text: 'マイプロテイン情報を更新・保存しました！' });
      }
    } catch {
      setMyProtein(payload);
      localStorage.setItem('raku_my_protein', JSON.stringify(payload));
      setIsProteinModalOpen(false);
      setMessage({ type: 'success', text: 'マイプロテイン情報を保存しました（ローカル）' });
    } finally {
      setIsSavingProtein(false);
    }
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
      radar_data: [
        { subject: 'エネルギー', score: Math.min(Math.round((totalCalories / 600) * 100), 100), fullMark: 100 },
        { subject: 'タンパク質', score: Math.min(Math.round((totalProtein / 30) * 100), 100), fullMark: 100 },
        { subject: '脂質', score: Math.min(Math.round((totalFat / 18) * 100), 100), fullMark: 100 },
        { subject: '炭水化物', score: Math.min(Math.round((totalCarbs / 75) * 100), 100), fullMark: 100 },
        { subject: '食物繊維', score: 20, fullMark: 100 },
        { subject: 'ビタミン/ミネラル', score: 65, fullMark: 100 }
      ],
      nutrient_bars: [
        { name: 'タンパク質', amount: totalProtein, unit: 'g', target: 30.0, percentage: Math.round((totalProtein / 30.0) * 100), status: '高タンパク充足' },
        { name: '脂質', amount: totalFat, unit: 'g', target: 18.0, percentage: Math.round((totalFat / 18.0) * 100), status: '適正範囲' },
        { name: '炭水化物', amount: totalCarbs, unit: 'g', target: 75.0, percentage: Math.round((totalCarbs / 75.0) * 100), status: '低糖質' }
      ],
      feedback_comment: `良質なタンパク質${totalProtein}gを補給完了！割り材（${baseInfo.name}）との相乗効果で筋肉の回復と成長を加速させます。`
    };

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
          analysis_json: JSON.stringify(analysisObj),
          image_url: myProtein.image_url || '',
          note: `プロテイン摂取（割り材: ${baseInfo.name}、たんぱく質 ${totalProtein}g / 脂質 ${totalFat}g / 炭水化物 ${totalCarbs}g）`,
        }),
      });

      if (res.ok) {
        setProteinRecordedAnim(true);
        setTimeout(() => {
          setProteinRecordedAnim(false);
          setIsProteinSheetOpen(false);
        }, 1100);

        setMessage({
          type: 'success',
          text: `🥤 ${currentTime} にプロテイン（${baseInfo.name}割り / P:${totalProtein}g / ${totalCalories}kcal）を記録しました！`
        });
        fetchMeals();
        if (onRecordSuccess) {
          onRecordSuccess('プロテインを記録しました！');
        }
      } else {
        setMessage({ type: 'error', text: '保存に失敗しました。' });
      }
    } catch {
      setMessage({ type: 'error', text: '通信エラーが発生しました。' });
    } finally {
      setIsSubmitting(false);
    }
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

  return (
    <div className="flex flex-col min-h-[calc(100vh-5rem)] px-4 py-4 pb-40 max-w-lg mx-auto bg-slate-100 no-scrollbar [&::-webkit-scrollbar]:hidden">
      <header className="text-center mb-4">
        <h1 className="text-xl font-bold text-slate-900">食事管理</h1>
        <p className="text-xs text-slate-500 mt-0.5">時間別タイムライン記録 & AI栄養素・プロテイン管理</p>
      </header>

      {message && (
        <div className={`p-3 rounded-2xl text-xs font-bold text-center mb-4 transition-all shadow-xs ${
          message.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {message.text}
        </div>
      )}

      <section className="bg-white rounded-2xl p-5 shadow-sm mb-4 border border-slate-200/80">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {myProtein.image_url ? (
              <img
                src={myProtein.image_url}
                alt="マイプロテイン"
                className="w-13 h-13 rounded-2xl object-cover border border-emerald-100 shadow-xs"
              />
            ) : (
              <div className="w-13 h-13 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-base font-bold border border-emerald-200/80 shadow-xs">
                🥤
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/80">
                  登録プロテイン
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  1食 {myProtein.serving_size_g || 30}g
                </span>
              </div>
              <h2 className="text-sm font-bold text-slate-900 truncate max-w-[200px] mt-0.5">
                {myProtein.product_name}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              syncSettingState(myProtein);
              setIsProteinModalOpen(true);
            }}
            className="text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-full transition-colors border border-slate-200 shadow-xs cursor-pointer"
          >
            設定・成分表
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2 bg-emerald-50/60 rounded-2xl p-3 mb-3 border border-emerald-100/70">
          <div className="text-center border-r border-emerald-100/80">
            <span className="text-[10px] text-slate-500 block font-medium">カロリー</span>
            <span className="text-xs font-bold text-slate-900">{myProtein.calories || 120} kcal</span>
          </div>
          <div className="text-center border-r border-emerald-100/80">
            <span className="text-[10px] text-emerald-700 block font-bold">タンパク質</span>
            <span className="text-xs font-bold text-emerald-700">{myProtein.protein_g} g</span>
          </div>
          <div className="text-center border-r border-emerald-100/80">
            <span className="text-[10px] text-slate-500 block font-medium">脂質</span>
            <span className="text-xs font-bold text-slate-900">{myProtein.fat_g !== undefined ? myProtein.fat_g : 1.0} g</span>
          </div>
          <div className="text-center">
            <span className="text-[10px] text-slate-500 block font-medium">炭水化物</span>
            <span className="text-xs font-bold text-slate-900">{myProtein.carbs_g !== undefined ? myProtein.carbs_g : 2.0} g</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setRecordTime(getNowTime());
            setIsProteinSheetOpen(true);
          }}
          className="w-full h-13 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/25 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>プロテインを記録する（割り材選択）</span>
        </button>
      </section>

      <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 mb-4">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900">食事の写真からAI解析</h2>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-full border border-slate-200/70">
            <span className="text-xs font-bold text-slate-600">時刻:</span>
            <input
              type="time"
              value={recordTime}
              onChange={(e) => setRecordTime(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => onOpenGeminiSetup && onOpenGeminiSetup()}
          className={`w-full mb-3 px-3 py-2 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
            geminiStatus.isLinked
              ? 'bg-emerald-50/80 hover:bg-emerald-100/70 border-emerald-200 text-emerald-800'
              : 'bg-amber-50/90 hover:bg-amber-100/70 border-amber-200 text-amber-800'
          }`}
        >
          <span className="text-[11px] font-bold truncate">
            {geminiStatus.badgeText}
          </span>
          <span className="text-[10px] font-extrabold underline ml-2 flex-shrink-0">
            {geminiStatus.isLinked ? '設定確認' : '連携する'}
          </span>
        </button>

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
            className="w-full py-8 border-2 border-dashed border-emerald-200/90 hover:border-emerald-500 rounded-3xl bg-emerald-50/30 hover:bg-emerald-50/60 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center text-xl shadow-md shadow-emerald-500/25">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              </svg>
            </div>
            <span className="text-xs font-bold text-slate-900">写真を撮影または選択</span>
            <span className="text-[11px] text-slate-500">食事の写真をもとにAIが栄養バランスを推定します</span>
          </button>
        ) : (
          <div className="space-y-3">
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-neutral-900 shadow-sm max-h-56 flex items-center justify-center">
              <img
                src={imagePreview}
                alt="食事プレビュー"
                className="w-full h-auto object-cover max-h-56"
              />
              <button
                type="button"
                onClick={handleClearImage}
                className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full px-3 py-1 text-xs font-bold transition-colors cursor-pointer"
              >
                ✕ 変更
              </button>
            </div>

            <button
              type="button"
              disabled={isAnalyzing}
              onClick={handleAnalyzeMeal}
              className="w-full h-13 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/25 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>AIが栄養素とバランスを分析中...</span>
                </>
              ) : (
                <span>AIで栄養バランスを分析する</span>
              )}
            </button>
          </div>
        )}

        {analysisResult && (() => {
          const currentMetrics = recalculateRadarAndBars(adjCalories, adjProtein, adjFat, adjCarbs, adjFiber, adjSalt);
          return (
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
              <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100/80">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {analysisResult.source === 'gemini' ? 'Gemini AI高精度特定' : '栄養マスターDB照合'}
                      </span>
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                        時刻: {recordTime}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={adjMealName}
                      onChange={(e) => setAdjMealName(e.target.value)}
                      className="text-sm font-bold text-slate-900 bg-white border border-emerald-200 rounded-xl px-2.5 py-1 w-full focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      placeholder="料理名"
                    />
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-[10px] text-slate-500 block">合計カロリー</span>
                    <span className="text-xl font-black text-emerald-700 tabular-nums">
                      {adjCalories} <span className="text-xs font-normal text-slate-500">kcal</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-emerald-100/80 text-xs flex-wrap">
                  <span className="text-slate-500 font-medium text-[11px]">PFC比率:</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px] border border-blue-200">
                    P: {adjProtein}g
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-[10px] border border-amber-200">
                    F: {adjFat}g
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                    C: {adjCarbs}g
                  </span>
                </div>
              </div>

              <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">手動微調整スライダー</span>
                  <span className="text-[10px] text-slate-500">動かすとチャートがリアルタイム変化</span>
                </div>

                <div className="space-y-2.5">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600 font-medium">カロリー: <strong className="text-slate-900">{adjCalories} kcal</strong></span>
                      <span className="text-[10px] text-slate-400">100〜1,500 kcal</span>
                    </div>
                    <input
                      type="range"
                      min="100"
                      max="1500"
                      step="10"
                      value={adjCalories}
                      onChange={(e) => setAdjCalories(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-blue-700 font-bold">タンパク質: {adjProtein}g</span>
                      </div>
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
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-amber-700 font-bold">脂質: {adjFat}g</span>
                      </div>
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
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-emerald-700 font-bold">炭水化物: {adjCarbs}g</span>
                      </div>
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
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-teal-700 font-bold">食物繊維: {adjFiber}g</span>
                      </div>
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
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-900">栄養バランス（五角形レーダーチャート）</span>
                  <span className="text-[10px] text-slate-500">リアルタイム達成スコア（0〜100）</span>
                </div>
                <p className="text-xs text-slate-500 mb-2">
                  均等な正五角形に近づくほど、PFCと微量栄養素が調和した理想バランスです。
                </p>

                <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-xs flex items-center justify-center">
                  <div className="w-full h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="72%" data={currentMetrics.radar_data}>
                        <PolarGrid stroke="#E2E8F0" strokeDasharray="3 3" />
                        <PolarAngleAxis
                          dataKey="subject"
                          tick={{ fill: '#0F172A', fontSize: 10, fontWeight: 700 }}
                        />
                        <PolarRadiusAxis
                          angle={30}
                          domain={[0, 100]}
                          tick={{ fontSize: 8, fill: '#64748B' }}
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
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-900">詳細栄養素と達成度</span>
                  <span className="text-[10px] text-slate-500">1食の目安量との比較</span>
                </div>

                <div className="space-y-2">
                  {currentMetrics.nutrient_bars?.map((item, idx) => {
                    const percent = Math.min(Math.max(item.percentage, 0), 100);
                    const isOptimal = item.percentage >= 80 && item.percentage <= 125;
                    const isHigh = item.percentage > 125;
                    const barColor = isOptimal
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                      : isHigh
                      ? 'bg-rose-500'
                      : 'bg-slate-400';

                    return (
                      <div key={idx} className="bg-slate-50/70 rounded-2xl p-3 border border-slate-200/80">
                        <div className="flex justify-between items-center mb-1.5 text-xs">
                          <span className="font-bold text-slate-900">{item.name}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">
                              {item.amount} {item.unit}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              / 目安 {item.target} {item.unit}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              isOptimal
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : isHigh
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}>
                              {item.status} ({item.percentage}%)
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-emerald-50/40 border border-emerald-100 rounded-2xl p-4">
                <span className="text-xs font-bold text-slate-900 block mb-1">AIワンポイントアドバイス</span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {analysisResult.feedback_comment}
                </p>
              </div>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSaveAnalysis}
                className="w-full h-13 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/25 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>記録を保存中...</span>
                  </>
                ) : (
                  <span>調整内容で食事を保存する（{recordTime}）</span>
                )}
              </button>
            </div>
          );
        })()}
      </section>

      <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 mb-4">
        <button
          type="button"
          onClick={() => setShowManualForm(!showManualForm)}
          className="w-full flex items-center justify-between text-left py-1 cursor-pointer"
        >
          <div>
            <h2 className="text-xs font-bold text-slate-900">手動でクイック入力</h2>
            <p className="text-xs text-slate-500">写真がない時はプリセットから直接記録できます</p>
          </div>
          <span className="text-xs font-bold text-slate-600 px-3 py-1 rounded-full bg-slate-100 border border-slate-200/70 shadow-xs">
            {showManualForm ? '閉じる ▲' : '開く ▼'}
          </span>
        </button>

        {showManualForm && (
          <form onSubmit={handleManualSubmit} className="space-y-3.5 mt-4 pt-4 border-t border-slate-100">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  食事区分 (プルダウン)
                </label>
                <div className="relative">
                  <select
                    value={mealCategory}
                    onChange={(e) => setMealCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200/90 rounded-2xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500 appearance-none cursor-pointer"
                  >
                    <option value="朝食">☀️ 朝食</option>
                    <option value="昼食">🍱 昼食</option>
                    <option value="夕食">🌙 夕食</option>
                    <option value="間食">☕ 間食・補食</option>
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">▼</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  定番テンプレート選択
                </label>
                <div className="relative">
                  <select
                    onChange={(e) => {
                      const p = quickMealPresets.find((x) => x.name === e.target.value);
                      if (p) handleApplyPreset(p);
                    }}
                    defaultValue=""
                    className="w-full bg-slate-50 border border-slate-200/90 rounded-2xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500 appearance-none cursor-pointer"
                  >
                    <option value="" disabled>メニューを選ぶ...</option>
                    {quickMealPresets.map((p, idx) => (
                      <option key={idx} value={p.name}>
                        {p.name} ({p.cal}kcal)
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">▼</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between bg-slate-50/80 p-3 rounded-2xl border border-slate-200/80">
              <span className="text-xs font-bold text-slate-700">記録時刻</span>
              <input
                type="time"
                value={recordTime}
                onChange={(e) => setRecordTime(e.target.value)}
                className="bg-white border border-slate-200 rounded-full px-3 py-1 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                メニュー名
              </label>
              <input
                type="text"
                value={menuName}
                onChange={(e) => setMenuName(e.target.value)}
                placeholder="例: サラダチキン、焼き魚定食"
                className="w-full bg-white border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1.5">
                定番クイック選択（タップで自動入力）:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {quickMealPresets.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className={`text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                      menuName === p.name
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700">推定カロリー</label>
                  <span className="text-xs font-bold text-emerald-700">{calories} kcal</span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {[300, 500, 700, 900].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCalories(c)}
                      className={`py-2 rounded-2xl text-[10px] font-bold transition-all cursor-pointer ${
                        calories === c
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700">タンパク質</label>
                  <span className="text-xs font-bold text-emerald-700">{proteinLevel}</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {['高', '普通', '低'].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setProteinLevel(lvl)}
                      className={`py-2 rounded-2xl text-[10px] font-bold transition-all cursor-pointer ${
                        proteinLevel === lvl
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">糖質</label>
                <div className="grid grid-cols-3 gap-1">
                  {['低', '普通', '高'].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setCarbsLevel(lvl)}
                      className={`py-1.5 rounded-2xl text-[10px] font-bold transition-all cursor-pointer ${
                        carbsLevel === lvl
                          ? 'bg-slate-800 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">脂質</label>
                <div className="grid grid-cols-3 gap-1">
                  {['低', '普通', '高'].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setFatLevel(lvl)}
                      className={`py-1.5 rounded-2xl text-[10px] font-bold transition-all cursor-pointer ${
                        fatLevel === lvl
                          ? 'bg-slate-800 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">メモ (任意)</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="例: 外食、水分を多めに摂取"
                className="w-full bg-white border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-13 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/25 text-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer transition-all"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>記録を保存中...</span>
                </>
              ) : (
                <span>手動で食事記録を保存する</span>
              )}
            </button>
          </form>
        )}
      </section>

      <section className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-sm flex-1">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
          <div>
            <h2 className="text-xs font-bold text-slate-900">本日の食事履歴（アコーディオン）</h2>
            <p className="text-[10px] text-slate-500 mt-0.5">カテゴリごとに折りたたんで確認できます</p>
          </div>
          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200/70">
            合計 {meals.length}品
          </span>
        </div>

        {meals.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">食事記録がありません</p>
        ) : (
          <div className="space-y-2.5">
            {[
              { key: '朝食', icon: '☀️', label: '朝食' },
              { key: '昼食', icon: '🍱', label: '昼食' },
              { key: '夕食', icon: '🌙', label: '夕食' },
              { key: '間食', icon: '☕', label: '間食・プロテイン' }
            ].map((cat) => {
              const list = meals.filter((m) => {
                const time = m.meal_time || m.meal_type || m.timestamp?.slice(11, 16) || '12:00';
                const hour = parseInt(time.split(':')[0], 10) || 12;
                const isProtein = m.menu_name?.includes('プロテイン') || m.meal_type?.includes('間食');

                if (cat.key === '間食') return isProtein || hour < 4 || hour >= 22;
                if (isProtein) return false;
                if (cat.key === '朝食') return hour >= 4 && hour < 11;
                if (cat.key === '昼食') return hour >= 11 && hour < 16;
                if (cat.key === '夕食') return hour >= 16 && hour < 22;
                return false;
              });

              const isOpen = openCategories[cat.key] !== false;
              const catCalories = list.reduce((sum, item) => sum + (item.calories || 0), 0);

              return (
                <div key={cat.key} className="bg-slate-50/70 rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenCategories((prev) => ({ ...prev, [cat.key]: !isOpen }))}
                    className="w-full p-3 flex items-center justify-between text-left hover:bg-slate-100/70 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{cat.icon}</span>
                      <span className="text-xs font-bold text-slate-800">{cat.label}</span>
                      <span className="text-[10px] text-slate-500 font-medium">({list.length}品 / {catCalories} kcal)</span>
                    </div>
                    <span className="text-xs text-slate-400 font-bold">{isOpen ? '▲' : '▼'}</span>
                  </button>

                  {isOpen && (
                    <div className="px-3 pb-3 pt-1 border-t border-slate-200/60 divide-y divide-slate-100 bg-white">
                      {list.length === 0 ? (
                        <p className="text-[11px] text-slate-400 py-2.5 text-center">この時間帯の記録はありません</p>
                      ) : (
                        list.map((m) => {
                          const timeLabel = formatMealTimeDisplay(m);
                          const isProtein = m.menu_name?.includes('プロテイン');
                          return (
                            <div key={m.id} className="py-2.5 flex items-center justify-between gap-2.5">
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                {m.image_url ? (
                                  <img
                                    src={m.image_url}
                                    alt={m.menu_name}
                                    className="w-10 h-10 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                                  />
                                ) : (
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-[10px] flex-shrink-0 border ${
                                    isProtein
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : 'bg-slate-50 text-slate-600 border-slate-200'
                                  }`}>
                                    {isProtein ? '🥤' : '🍽️'}
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-slate-900 truncate">{m.menu_name}</span>
                                    <span className="text-[9px] text-slate-400">{timeLabel}</span>
                                  </div>
                                  <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-2">
                                    {m.protein_g && <span className="text-emerald-700 font-bold">P: {m.protein_g}g</span>}
                                    {m.fat_g && <span>F: {m.fat_g}g</span>}
                                    {m.carbs_g && <span>C: {m.carbs_g}g</span>}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <span className="text-xs font-black text-slate-900">{m.calories}</span>
                                <span className="text-[9px] text-slate-400 block font-medium">kcal</span>
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
      </section>

      {isProteinSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-t-[2.5rem] sm:rounded-3xl p-6 border border-slate-100 shadow-2xl transition-all max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsProteinSheetOpen(false)}
                  className="flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1 rounded-full cursor-pointer shadow-xs"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                  </svg>
                  戻る
                </button>
                <h3 className="text-sm font-bold text-slate-900">プロテイン摂取を記録</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsProteinSheetOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold hover:bg-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-emerald-50/50 rounded-2xl p-3.5 border border-emerald-100 mb-4 flex items-center gap-3">
              {myProtein.image_url ? (
                <img
                  src={myProtein.image_url}
                  alt={myProtein.product_name}
                  className="w-13 h-13 rounded-xl object-cover border border-emerald-100 shadow-xs"
                />
              ) : (
                <div className="w-13 h-13 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-sm font-bold border border-emerald-200">
                  🥤
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-[10px] text-emerald-700 font-bold">使用プロテイン</div>
                <div className="text-xs font-bold text-slate-900 truncate">{myProtein.product_name}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  1食 ({myProtein.serving_size_g || 30}g): P {baseP}g / {myProtein.calories || 120} kcal / F {baseFat}g / C {baseCarbs}g
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="text-xs font-bold text-slate-900 block mb-2">割り材を選択（ラジオボタン）:</label>
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
                          ? 'border-emerald-500 bg-emerald-50/80 text-emerald-800 font-bold shadow-xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
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
                      <span className="text-[9px] text-slate-500 font-normal leading-tight">{b.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-emerald-50/40 rounded-2xl p-3.5 border border-emerald-100/80 mb-4">
              <div className="text-[11px] font-bold text-slate-900 mb-2">合算栄養バランス（{proteinBases[selectedBase].name}）</div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-white rounded-xl p-2 border border-emerald-100/80 shadow-xs">
                  <span className="text-[10px] text-slate-500 block">総カロリー</span>
                  <span className="text-xs font-bold text-slate-900">{currentTotalCal} <span className="text-[9px] font-normal">kcal</span></span>
                </div>
                <div className="bg-white rounded-xl p-2 border border-emerald-100/80 shadow-xs">
                  <span className="text-[10px] text-emerald-700 font-bold block">タンパク質</span>
                  <span className="text-xs font-bold text-emerald-700">{currentTotalP} <span className="text-[9px] font-normal">g</span></span>
                </div>
                <div className="bg-white rounded-xl p-2 border border-emerald-100/80 shadow-xs">
                  <span className="text-[10px] text-slate-500 font-bold block">脂質</span>
                  <span className="text-xs font-bold text-slate-900">{currentTotalFat} <span className="text-[9px] font-normal">g</span></span>
                </div>
                <div className="bg-white rounded-xl p-2 border border-emerald-100/80 shadow-xs">
                  <span className="text-[10px] text-slate-500 font-bold block">炭水化物</span>
                  <span className="text-xs font-bold text-slate-900">{currentTotalCarbs} <span className="text-[9px] font-normal">g</span></span>
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleDrinkProtein}
              className={`w-full h-13 py-3 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/25 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer ${
                proteinRecordedAnim
                  ? 'bg-emerald-600'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'
              } disabled:opacity-50`}
            >
              {proteinRecordedAnim ? (
                <span>記録完了</span>
              ) : isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>記録中...</span>
                </>
              ) : (
                <span>プロテインを記録する（{getNowTime()}）</span>
              )}
            </button>
          </div>
        </div>
      )}

      {isProteinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 border border-slate-100 shadow-2xl my-auto">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsProteinModalOpen(false)}
                  className="flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1 rounded-full cursor-pointer shadow-xs"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                  </svg>
                  戻る
                </button>
                <h3 className="text-sm font-bold text-slate-900">マイプロテイン設定</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsProteinModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold hover:bg-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProteinSettings} className="space-y-3.5">
              <div className="bg-emerald-50/40 border border-emerald-100 rounded-2xl p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-900">栄養成分表示（写真解析）</span>
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
                    className="text-[11px] font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-3 py-1.5 rounded-full transition-all shadow-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {isAnalyzingLabel ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>解析中...</span>
                      </>
                    ) : (
                      <span>成分表を撮影・選択</span>
                    )}
                  </button>
                </div>
                {settingNutritionPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-emerald-200 max-h-32 bg-slate-100">
                    <img
                      src={settingNutritionPreview}
                      alt="成分表"
                      className="w-full h-auto object-cover max-h-32"
                    />
                    <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] px-2 py-0.5 rounded-full font-bold">
                      解析完了
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-500">
                    プロテイン裏面の栄養成分表示の写真を設定すると、タンパク質・カロリー・脂質・炭水化物が自動入力されます。
                  </p>
                )}
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  パッケージ写真 (任意)
                </label>
                <input
                  ref={proteinPackageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProteinPackageChange}
                  className="hidden"
                />
                <div className="flex items-center gap-3">
                  {settingPackagePreview ? (
                    <img
                      src={settingPackagePreview}
                      alt="プロテイン写真"
                      className="w-11 h-11 rounded-xl object-cover border border-slate-200 shadow-xs"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-[10px] text-slate-400 border border-slate-200 font-bold">
                      未設定
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => proteinPackageInputRef.current?.click()}
                    className="py-1.5 px-3.5 text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-full transition-all shadow-xs cursor-pointer"
                  >
                    写真を選択
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  商品名・フレーバー
                </label>
                <input
                  type="text"
                  value={settingName}
                  onChange={(e) => setSettingName(e.target.value)}
                  placeholder="例: ホエイプロテイン チョコレート味"
                  className="w-full bg-white border border-slate-200 rounded-2xl px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">
                    1食あたりの量 (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={settingServingSize}
                    onChange={(e) => setSettingServingSize(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-2xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">
                    エネルギー (kcal)
                  </label>
                  <input
                    type="number"
                    value={settingCalories}
                    onChange={(e) => setSettingCalories(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-2xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">
                    タンパク質 (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={settingProtein}
                    onChange={(e) => setSettingProtein(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-2xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">
                    脂質 (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={settingFat}
                    onChange={(e) => setSettingFat(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-2xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">
                    炭水化物 (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={settingCarbs}
                    onChange={(e) => setSettingCarbs(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-2xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingProtein}
                  className="w-full h-12 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/25 text-xs sm:text-sm disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 transition-all"
                >
                  {isSavingProtein ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>保存中...</span>
                    </>
                  ) : (
                    <span>プロテイン設定を保存する</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
