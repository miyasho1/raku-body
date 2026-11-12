export function revokeImagePreviewUrl(url) {
  if (url && typeof url === 'string' && url.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(url);
    } catch {
    }
  }
}

export async function processPrivacyImage(file, shouldCropFace = true) {
  if (!file) {
    return { processedFile: null, previewUrl: '' };
  }

  if (!shouldCropFace) {
    return {
      processedFile: file,
      previewUrl: URL.createObjectURL(file)
    };
  }

  return new Promise((resolve) => {
    const tempUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      try {
        const cropRatio = 0.18;
        const srcWidth = img.naturalWidth || img.width || 600;
        const srcHeight = img.naturalHeight || img.height || 800;
        const cropY = Math.round(srcHeight * cropRatio);
        const targetHeight = Math.max(1, srcHeight - cropY);

        const canvas = document.createElement('canvas');
        canvas.width = srcWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');

        ctx.drawImage(
          img,
          0,
          cropY,
          srcWidth,
          targetHeight,
          0,
          0,
          srcWidth,
          targetHeight
        );

        revokeImagePreviewUrl(tempUrl);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const croppedFile = new File([blob], file.name || 'privacy_cropped.jpg', {
                type: 'image/jpeg'
              });
              const croppedPreviewUrl = URL.createObjectURL(croppedFile);
              resolve({
                processedFile: croppedFile,
                previewUrl: croppedPreviewUrl
              });
            } else {
              resolve({
                processedFile: file,
                previewUrl: URL.createObjectURL(file)
              });
            }
          },
          'image/jpeg',
          0.9
        );
      } catch {
        revokeImagePreviewUrl(tempUrl);
        resolve({
          processedFile: file,
          previewUrl: URL.createObjectURL(file)
        });
      }
    };

    img.onerror = () => {
      revokeImagePreviewUrl(tempUrl);
      resolve({
        processedFile: file,
        previewUrl: URL.createObjectURL(file)
      });
    };

    img.src = tempUrl;
  });
}

export async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64Url = reader.result;
      const commaIdx = base64Url.indexOf(',');
      if (commaIdx !== -1) {
        resolve(base64Url.substring(commaIdx + 1));
      } else {
        resolve(base64Url);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

const GEMINI_KEY_STORAGE = 'raku_gemini_api_key';
const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash'];
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

export function getStoredGeminiKey() {
  try {
    return (localStorage.getItem(GEMINI_KEY_STORAGE) || '').trim();
  } catch {
    return '';
  }
}

export function setStoredGeminiKey(key) {
  try {
    const trimmed = (key || '').trim();
    if (trimmed) {
      localStorage.setItem(GEMINI_KEY_STORAGE, trimmed);
    } else {
      localStorage.removeItem(GEMINI_KEY_STORAGE);
    }
  } catch {
  }
}

function parseGeminiJsonText(rawText) {
  let cleaned = (rawText || '').trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(json)?/, '').replace(/```$/, '').trim();
  }
  return JSON.parse(cleaned);
}

async function callGeminiDirect(prompt, base64Data, mimeType, apiKey) {
  const parts = [{ text: prompt }];
  if (base64Data) {
    parts.push({ inlineData: { mimeType: mimeType || 'image/jpeg', data: base64Data } });
  }
  const body = JSON.stringify({
    contents: [{ parts }],
    generationConfig: { responseMimeType: 'application/json' }
  });
  for (const model of GEMINI_MODELS) {
    try {
      const res = await fetch(`${GEMINI_ENDPOINT}/${model}:generateContent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body
      });
      if (!res.ok) continue;
      const json = await res.json();
      const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return parseGeminiJsonText(text);
    } catch {
    }
  }
  return null;
}

async function callGeminiViaServer(prompt, base64Data, mimeType) {
  try {
    const res = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, base64Data, mimeType })
    });
    if (res.ok) {
      const json = await res.json();
      if (json && json.success && json.data) return json.data;
    }
  } catch {
  }
  return null;
}

async function executeGeminiCall(prompt, base64Data, mimeType) {
  const apiKey = getStoredGeminiKey();
  if (apiKey) {
    const direct = await callGeminiDirect(prompt, base64Data, mimeType, apiKey);
    if (direct) return direct;
  }
  return callGeminiViaServer(prompt, base64Data, mimeType);
}

export async function testGeminiConnection(apiKey) {
  const key = (apiKey || '').trim();
  if (!key) return false;
  const result = await callGeminiDirect('次のJSONだけをそのまま返してください。{"ok": true}', null, null, key);
  return Boolean(result && result.ok === true);
}

const toNumberOrNull = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export async function analyzeNutritionLabelImage(imageFile) {
  if (!imageFile) return null;
  try {
    const base64Data = await fileToBase64(imageFile);
    const mimeType = imageFile.type || 'image/jpeg';

    const prompt = `あなたはプロテインおよび市販食品の栄養成分表示ラベル（OCR）解析AIです。
画像内の「栄養成分表示（Nutrition Facts）」から数値を正確に読み取り、以下のJSON形式のみを返してください。

{
  "product_name": "商品名（例: ザバス ホエイプロテイン100 リッチショコラ）",
  "serving_size_g": 28.0,
  "calories": 111,
  "protein_g": 19.5,
  "fat_g": 2.0,
  "carbs_g": 4.1
}`;

    const parsed = await executeGeminiCall(prompt, base64Data, mimeType);
    if (!parsed || toNumberOrNull(parsed.calories) === null) return null;
    const result = {
      product_name: parsed.product_name || '',
      serving_size_g: toNumberOrNull(parsed.serving_size_g),
      calories: Math.round(toNumberOrNull(parsed.calories)),
      protein_g: toNumberOrNull(parsed.protein_g),
      fat_g: toNumberOrNull(parsed.fat_g),
      carbs_g: toNumberOrNull(parsed.carbs_g)
    };
    return { source: 'ai_gemini', ...result, ai_original: { ...result } };
  } catch {
    return null;
  }
}

export async function analyzeMealImage(imageFile) {
  if (!imageFile) return null;
  try {
    const base64Data = await fileToBase64(imageFile);
    const mimeType = imageFile.type || 'image/jpeg';

    const prompt = `あなたはプロの管理栄養士・スポーツ栄養AIです。
食事の写真から料理名と推定重量、カロリーおよびPFCバランス、五角形レーダーチャート達成度スコア（各0〜100点）を精密に推定してください。
隠れ油や調味料も含めたリアルな数値を計算し、以下の厳格なJSONスキーマのみを返してください。

{
  "meal_name": "料理名（例: 鶏胸肉とブロッコリーの玄米プレート）",
  "serving_g": 420,
  "calories": 540,
  "protein_g": 38.5,
  "fat_g": 12.0,
  "carbs_g": 62.0,
  "fiber_g": 6.8,
  "salt_g": 2.1,
  "protein_level": "高",
  "carbs_level": "普通",
  "fat_level": "低",
  "radar_data": [
    {"subject": "エネルギー", "score": 82, "fullMark": 100},
    {"subject": "タンパク質", "score": 95, "fullMark": 100},
    {"subject": "脂質適正度", "score": 88, "fullMark": 100},
    {"subject": "炭水化物", "score": 78, "fullMark": 100},
    {"subject": "食物繊維/V", "score": 85, "fullMark": 100}
  ],
  "nutrient_bars": [
    {"name": "タンパク質", "amount": 38.5, "unit": "g", "target": 30.0, "percentage": 128, "status": "高水準充足"},
    {"name": "脂質", "amount": 12.0, "unit": "g", "target": 18.0, "percentage": 67, "status": "控えめ良好"},
    {"name": "炭水化物", "amount": 62.0, "unit": "g", "target": 75.0, "percentage": 83, "status": "適正量"},
    {"name": "食物繊維", "amount": 6.8, "unit": "g", "target": 7.0, "percentage": 97, "status": "良好"},
    {"name": "食塩相当量", "amount": 2.1, "unit": "g", "target": 2.5, "percentage": 84, "status": "適正範囲"}
  ],
  "feedback_comment": "タンパク質がしっかり補給されており、脂質も控えめで筋肉合成に理想的な構成です！"
}`;

    const parsed = await executeGeminiCall(prompt, base64Data, mimeType);
    if (!parsed || !parsed.meal_name || toNumberOrNull(parsed.calories) === null) return null;
    return {
      ...parsed,
      source: 'ai_gemini',
      ai_original: {
        meal_name: parsed.meal_name,
        serving_g: toNumberOrNull(parsed.serving_g),
        calories: toNumberOrNull(parsed.calories),
        protein_g: toNumberOrNull(parsed.protein_g),
        fat_g: toNumberOrNull(parsed.fat_g),
        carbs_g: toNumberOrNull(parsed.carbs_g),
        fiber_g: toNumberOrNull(parsed.fiber_g),
        salt_g: toNumberOrNull(parsed.salt_g)
      }
    };
  } catch {
    return null;
  }
}

export async function analyzeBodyImage(imageFile) {
  if (!imageFile) return null;
  try {
    const base64Data = await fileToBase64(imageFile);
    const mimeType = imageFile.type || 'image/jpeg';

    const prompt = `あなたはプロのパーソナルトレーナー・体型骨格診断AIです。
写真からユーザーの体型タイプ、推定体脂肪率、筋肉発達バランス（腕・胸・ウエスト・脚：各1〜5点）、部位別ギャップ、おすすめメニュー、アドバイスを分析し、以下のJSON形式のみを出力してください。

{
  "body_type": "逆三角形・アスリート型（または標準・細身・筋肉質など）",
  "estimated_body_fat": 15.5,
  "summary": "現状の強みを褒めつつ理想体型へ向けた前向きな総括コメント",
  "analysis_summary": "胸板と肩のラインが発達しており、姿勢も良好です。",
  "focus_areas": ["大胸筋・厚み", "背中・逆三角形", "体幹・くびれ"],
  "body_scores": {
    "arms": 4,
    "chest": 4,
    "waist": 2,
    "legs": 3
  },
  "parts_analysis": [
    {"part": "胸（大胸筋）", "status": "現在の状態", "target": "理想の目標", "gap": "差分ポイント", "priority": "高"},
    {"part": "背中（広背筋）", "status": "現在の状態", "target": "理想の目標", "gap": "差分ポイント", "priority": "高"},
    {"part": "腕・肩（三角筋・上腕）", "status": "現在の状態", "target": "理想の目標", "gap": "差分ポイント", "priority": "中"},
    {"part": "ウエスト・腹筋", "status": "現在の状態", "target": "理想の目標", "gap": "差分ポイント", "priority": "中"},
    {"part": "脚（大腿部・ヒップ）", "status": "現在の状態", "target": "理想の目標", "gap": "差分ポイント", "priority": "高"}
  ],
  "compound_menu": [
    {"name": "チェストプレスマシン", "category": "gym", "reps": 10, "sets": 3, "weight": 35, "point": "胸の厚みを強化する理由"},
    {"name": "ラットプルダウン", "category": "gym", "reps": 10, "sets": 3, "weight": 35, "point": "逆三角形を作る理由"},
    {"name": "プッシュアップ（腕立て伏せ）", "category": "home", "reps": 15, "sets": 3, "weight": 0, "point": "自宅で体幹と胸を鍛える理由"}
  ],
  "recommended_workout": {
    "title": "上半身Vシェイプ強化ルーティン",
    "focus": "大胸筋上部・広背筋",
    "menus": [
      {"name": "チェストプレスマシン", "sets": 3, "reps": 10, "weight": 35},
      {"name": "ラットプルダウン", "sets": 3, "reps": 10, "weight": 35},
      {"name": "サイドレイズ", "sets": 3, "reps": 15, "weight": 8}
    ]
  },
  "advice": "肩と広背筋を重点的に鍛えることで、より美しい逆三角形シルエットが強調されます。"
}`;

    const parsed = await executeGeminiCall(prompt, base64Data, mimeType);
    if (!parsed || !parsed.body_type) return null;
    return {
      focus_areas: [],
      parts_analysis: [],
      compound_menu: [],
      ...parsed,
      source: 'ai_gemini',
      analyzed_at: new Date().toISOString()
    };
  } catch {
    return null;
  }
}
