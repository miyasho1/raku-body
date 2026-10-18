import { getActiveUserId, setUserStorageData, removeUserStorageData } from './authService';

export const DEFAULT_PROTEIN_PRESETS = [
  {
    id: 'preset_gold_whey',
    product_name: 'ゴールドスタンダード 100%ホエイ',
    serving_size_g: 30.0,
    calories: 120,
    protein_g: 24.0,
    fat_g: 1.0,
    carbs_g: 2.0,
    category: 'ホエイ(WPI/WPC)'
  },
  {
    id: 'preset_savas_whey',
    product_name: 'ザバス ホエイプロテイン100 リッチショコラ',
    serving_size_g: 28.0,
    calories: 111,
    protein_g: 19.5,
    fat_g: 2.0,
    carbs_g: 4.1,
    category: 'ホエイ(WPC)'
  },
  {
    id: 'preset_myprotein_wpi',
    product_name: 'マイプロテイン Impact ホエイ アイソレート',
    serving_size_g: 25.0,
    calories: 93,
    protein_g: 22.0,
    fat_g: 0.3,
    carbs_g: 0.6,
    category: 'アイソレート(WPI)'
  },
  {
    id: 'preset_savas_soy',
    product_name: 'ザバス ソイプロテイン100 カフェラテ風味',
    serving_size_g: 28.0,
    calories: 107,
    protein_g: 20.0,
    fat_g: 1.2,
    carbs_g: 3.6,
    category: 'ソイ(大豆)'
  }
];

export function getProteinPresets() {
  try {
    const raw = localStorage.getItem('raku_protein_presets');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
  }
  return DEFAULT_PROTEIN_PRESETS;
}

export function saveProteinPreset(newItem) {
  const current = getProteinPresets();
  const cleanItem = {
    id: newItem.id || `preset_${Date.now()}`,
    product_name: (newItem.product_name || 'マイプロテイン').trim(),
    serving_size_g: Number(parseFloat(newItem.serving_size_g) || 30.0),
    calories: Math.round(parseFloat(newItem.calories) || 120),
    protein_g: Number(parseFloat(newItem.protein_g) || 24.0),
    fat_g: Number(parseFloat(newItem.fat_g !== undefined ? newItem.fat_g : 1.0)),
    carbs_g: Number(parseFloat(newItem.carbs_g !== undefined ? newItem.carbs_g : 2.0)),
    category: newItem.category || 'マイ登録'
  };

  const existingIdx = current.findIndex(
    (p) => p.product_name === cleanItem.product_name || p.id === cleanItem.id
  );
  let nextList;
  if (existingIdx >= 0) {
    nextList = [...current];
    nextList[existingIdx] = { ...nextList[existingIdx], ...cleanItem };
  } else {
    nextList = [cleanItem, ...current];
  }

  localStorage.setItem('raku_protein_presets', JSON.stringify(nextList));
  localStorage.setItem('raku_my_protein', JSON.stringify(cleanItem));
  return { preset: cleanItem, list: nextList };
}

export function getActiveMyProtein() {
  try {
    const raw = localStorage.getItem('raku_my_protein');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.product_name) {
        return parsed;
      }
    }
  } catch {
  }
  return DEFAULT_PROTEIN_PRESETS[0];
}

function formatDateOffset(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function generateWeekDemoDataset() {
  const sampleWeights = [65.8, 65.5, 65.3, 65.1, 64.9, 64.6, 64.4];
  const sampleFats = [19.4, 19.2, 19.0, 18.8, 18.6, 18.4, 18.2];

  const workoutTemplates = [
    { workout_type: 'gym', menu_name: 'チェストプレスマシン（胸）', duration_minutes: 20, weight: 35.0, reps: 10, sets: 3, note: '大胸筋中部を意識してコントロール' },
    { workout_type: 'home', menu_name: 'プランク＆アブローラー（体幹）', duration_minutes: 15, weight: 0, reps: 15, sets: 3, note: '腹直筋と体幹の安定化' },
    { workout_type: 'gym', menu_name: 'ラットプルダウン（背中）', duration_minutes: 25, weight: 40.0, reps: 10, sets: 3, note: '肩甲骨を寄せて広背筋を刺激' },
    { workout_type: 'gym', menu_name: 'バーベルスクワット（脚）', duration_minutes: 25, weight: 50.0, reps: 10, sets: 3, note: '下半身全体と代謝アップ' },
    { workout_type: 'gym', menu_name: 'ダンベルショルダープレス（肩）', duration_minutes: 20, weight: 14.0, reps: 10, sets: 3, note: '三角筋の丸みと逆三角形ライン' },
    { workout_type: 'home', menu_name: 'プッシュアップ＆アームカール（腕・胸）', duration_minutes: 20, weight: 12.0, reps: 12, sets: 3, note: '上腕二頭筋と大胸筋のパンプ' },
    { workout_type: 'gym', menu_name: 'シーテッドローイング＆ベンチプレス（胸・背中）', duration_minutes: 30, weight: 42.5, reps: 10, sets: 4, note: '上半身複合トレーニング完遂' }
  ];

  const dailyMealsPlan = [
    [
      ['07:30', 'オートミール＆ギリシャヨーグルト', 360, 22.0, 6.5, 52.0, 5.5, 0.8],
      ['12:30', '鶏胸肉グリルと玄米プレート', 580, 42.0, 11.0, 74.0, 6.8, 1.9],
      ['16:00', 'ゴールドスタンダード 100%ホエイ（水割り）', 120, 24.0, 1.0, 2.0, 0.0, 0.2],
      ['19:30', 'サーモン塩焼きと豆腐サラダ定食', 590, 36.5, 18.0, 65.0, 6.2, 2.1]
    ],
    [
      ['07:45', '全粒粉トーストとゆで卵2個・プロテイン', 420, 32.0, 12.5, 44.0, 4.2, 1.2],
      ['12:15', 'サバの塩焼き和定食（玄米）', 640, 34.0, 22.0, 72.0, 5.8, 2.3],
      ['16:30', 'ザバス ホエイプロテイン100（豆乳割り）', 203, 26.7, 6.0, 10.3, 0.5, 0.4],
      ['20:00', '豚ヒレ肉とブロッコリーのオイスター炒め', 540, 38.0, 13.5, 62.0, 7.0, 2.0]
    ],
    [
      ['07:30', 'バナナ＆ホエイプロテインスムージー', 340, 27.5, 4.5, 48.0, 4.0, 0.5],
      ['12:30', '牛赤身ステーキ150g＆温野菜ライス', 660, 44.0, 18.5, 76.0, 6.4, 2.1],
      ['17:00', 'マイプロテイン Impact アイソレート（水割り）', 93, 22.0, 0.3, 0.6, 0.0, 0.1],
      ['19:45', '鶏ささみとアボカドのパワーサラダ＆雑穀米', 510, 37.0, 14.0, 58.0, 7.5, 1.7]
    ],
    [
      ['08:00', '和風だし茶漬け＆納豆・温泉卵', 410, 21.5, 9.0, 60.0, 5.1, 2.0],
      ['12:30', 'サラダチキンと玄米おにぎり2個・野菜スープ', 550, 39.0, 7.5, 80.0, 6.0, 2.2],
      ['16:00', 'ゴールドスタンダード 100%ホエイ（牛乳割り）', 254, 30.8, 8.8, 11.9, 0.0, 0.3],
      ['19:30', 'タラと彩り野菜の蒸し鍋・豆腐', 480, 36.0, 8.5, 56.0, 8.2, 2.1]
    ],
    [
      ['07:30', 'オートミール豆乳リゾット（鶏むね入り）', 390, 28.0, 7.5, 52.0, 5.8, 1.4],
      ['12:20', 'マグロ赤身・アボカドポキ丼', 610, 38.5, 15.0, 78.0, 5.5, 2.0],
      ['16:30', 'ザバス ソイプロテイン100（水割り）', 107, 20.0, 1.2, 3.6, 0.4, 0.3],
      ['20:00', '鶏むね肉のトマト煮込み＆全粒粉パスタ', 590, 40.0, 11.5, 76.0, 6.9, 2.2]
    ],
    [
      ['08:00', '高タンパクパンケーキ＆ベリー', 430, 29.0, 9.5, 56.0, 4.8, 0.9],
      ['12:45', '豚しゃぶとたっぷり香味野菜の定食', 590, 36.0, 16.0, 70.0, 6.5, 2.1],
      ['16:15', 'ゴールドスタンダード 100%ホエイ（水割り）', 120, 24.0, 1.0, 2.0, 0.0, 0.2],
      ['19:30', 'カツオのたたきと玄米・具沢山みそ汁', 540, 41.0, 10.0, 68.0, 6.2, 2.3]
    ],
    [
      ['07:30', 'ギリシャヨーグルト＆オートミール・ゆで卵', 380, 26.5, 8.0, 49.0, 5.0, 0.8],
      ['12:30', '特製チキングリルと彩り温野菜・玄米プレート', 560, 38.5, 12.0, 72.0, 7.2, 1.8],
      ['15:30', 'ゴールドスタンダード 100%ホエイ（水割り）', 120, 24.0, 1.0, 2.0, 0.0, 0.2],
      ['19:15', '鮭のホイル焼き＆ひじき豆腐サラダ定食', 570, 37.5, 15.5, 66.0, 6.8, 2.0]
    ]
  ];

  const metrics = [];
  const workouts = [];
  const meals = [];
  const logs = [];

  for (let i = 0; i < 7; i++) {
    const daysAgo = 6 - i;
    const dStr = formatDateOffset(daysAgo);

    metrics.push({
      id: `demo_metric_${i}`,
      date: dStr,
      weight: sampleWeights[i],
      body_fat: sampleFats[i],
      timestamp: `${dStr} 07:15:00`
    });

    const wItem = workoutTemplates[i];
    workouts.unshift({
      id: `demo_workout_${i}`,
      ...wItem,
      log_date: dStr,
      timestamp: `${dStr} 18:00:00`
    });

    logs.unshift({
      id: `demo_log_${i}`,
      category: `${wItem.workout_type === 'gym' ? 'ジム' : '宅トレ'}: ${wItem.menu_name}`,
      note: wItem.note,
      log_date: dStr,
      timestamp: `${dStr} 18:00:00`
    });

    dailyMealsPlan[i].forEach((m, mIdx) => {
      const [mTime, mName, cal, pG, fG, cG, fibG, sG] = m;
      meals.unshift({
        id: `demo_meal_${i}_${mIdx}`,
        meal_type: mTime,
        meal_time: mTime,
        menu_name: mName,
        calories: cal,
        protein_level: pG >= 20 ? '高' : '普通',
        carbs_level: cG <= 30 ? '低' : '普通',
        fat_level: fG <= 15 ? '低' : '普通',
        protein_g: pG,
        fat_g: fG,
        carbs_g: cG,
        fiber_g: fibG,
        salt_g: sG,
        image_url: '',
        note: '1週間サンプルデータ',
        log_date: dStr,
        timestamp: `${dStr} ${mTime}:00`
      });
    });
  }

  return {
    metrics,
    workouts,
    meals,
    logs,
    streakDays: 7,
    isLoggedToday: true
  };
}

export async function seedOneWeekDemoData(targetUid = null) {
  const uid = targetUid || getActiveUserId();
  const dataset = generateWeekDemoDataset();
  setUserStorageData('metrics', dataset.metrics, uid);
  setUserStorageData('workouts', dataset.workouts, uid);
  setUserStorageData('meals', dataset.meals, uid);
  setUserStorageData('logs', dataset.logs, uid);
  setUserStorageData('streak', '7', uid);
  setUserStorageData('protein_presets', DEFAULT_PROTEIN_PRESETS, uid);
  setUserStorageData('my_protein', DEFAULT_PROTEIN_PRESETS[0], uid);
  localStorage.setItem('raku_protein_presets', JSON.stringify(DEFAULT_PROTEIN_PRESETS));
  localStorage.setItem('raku_my_protein', JSON.stringify(DEFAULT_PROTEIN_PRESETS[0]));

  try {
    await fetch('/api/demo/seed', { method: 'POST' });
    await fetch('/api/my-protein', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(DEFAULT_PROTEIN_PRESETS[0])
    });
  } catch {
  }

  return dataset;
}

export async function resetAllAppData(targetUid = null) {
  const uid = targetUid || getActiveUserId();
  const keys = [
    'metrics',
    'workouts',
    'meals',
    'logs',
    'streak',
    'my_protein',
    'protein_presets',
    'selected_goal',
    'body_height',
    'user_height',
    'target_weight',
    'target_calories'
  ];
  keys.forEach((k) => removeUserStorageData(k, uid));
  keys.forEach((k) => {
    try {
      localStorage.removeItem(`raku_demo_${k}`);
      localStorage.removeItem(`raku_${k}`);
    } catch {
    }
  });

  try {
    await fetch('/api/demo/reset', { method: 'POST' });
  } catch {
  }
}
