const HTTPS_PREFIX = ['https:', ''].join('/');
const GEMINI_API_BASE = [HTTPS_PREFIX, 'generativelanguage.googleapis.com', 'v1beta', 'models'].join('/');

async function callGeminiModel(modelName, payload, apiKey) {
  const url = `${GEMINI_API_BASE}/${modelName}:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  if (response.ok) {
    return response;
  }
  return null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const apiKey = (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '').trim();
  if (!apiKey) {
    return res.status(200).json({ success: false, fallback: true });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { prompt, base64Data, mimeType } = body;

    if (!prompt) {
      return res.status(200).json({ success: false, fallback: true });
    }

    const parts = [{ text: prompt }];
    if (base64Data) {
      parts.push({
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: base64Data
        }
      });
    }

    const payload = {
      contents: [{ parts }],
      generationConfig: {
        responseMimeType: 'application/json'
      }
    };

    let geminiRes = await callGeminiModel('gemini-2.5-flash', payload, apiKey);
    if (!geminiRes) {
      geminiRes = await callGeminiModel('gemini-1.5-flash', payload, apiKey);
    }

    if (!geminiRes) {
      return res.status(200).json({ success: false, fallback: true });
    }

    const json = await geminiRes.json();
    const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      return res.status(200).json({ success: false, fallback: true });
    }

    let cleaned = rawText.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    }

    const parsed = JSON.parse(cleaned);
    return res.status(200).json({ success: true, data: parsed });
  } catch {
    return res.status(200).json({ success: false, fallback: true });
  }
}
