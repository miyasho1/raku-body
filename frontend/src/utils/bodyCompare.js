import { analyzeBodyImage } from './geminiAnalyzer';
import { inspectBodyPhoto } from './bodyVision';

export const METRIC_DEFS = [
  { key: 'shoulder_hip_ratio', label: '肩幅÷腰幅', unit: '', range: 1.0, digits: 2, by: '骨格検出' },
  { key: 'body_fat', label: '推定体脂肪率', unit: '%', range: 25, digits: 1, by: 'AI' },
  { key: 'shoulders', label: '肩', unit: '点', range: 4, digits: 0, by: 'AI' },
  { key: 'chest', label: '胸', unit: '点', range: 4, digits: 0, by: 'AI' },
  { key: 'arms', label: '腕', unit: '点', range: 4, digits: 0, by: 'AI' },
  { key: 'waist', label: 'お腹の引き締まり', unit: '点', range: 4, digits: 0, by: 'AI' },
  { key: 'legs', label: '脚', unit: '点', range: 4, digits: 0, by: 'AI' }
];

const num = (v) => {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v !== 'string') return null;
  if (/\d\s*(?:[〜～~\-ー－–—]|から)\s*\d/.test(v)) return null;
  const m = v.match(/-?\d+(?:\.\d+)?/);
  const n = m ? parseFloat(m[0]) : NaN;
  return Number.isFinite(n) ? n : null;
};

const score = (v) => {
  const n = num(v);
  if (n === null || !Number.isInteger(n) || n < 1 || n > 5) return null;
  return n;
};

const bodyFat = (v) => {
  const n = num(v);
  return n === null || n < 3 || n > 60 ? null : n;
};

export function buildBodyMetrics(analysis, shoulderHipRatio) {
  const s = (analysis && analysis.body_scores) || {};
  return {
    shoulder_hip_ratio: num(shoulderHipRatio),
    body_fat: bodyFat(analysis && analysis.estimated_body_fat),
    shoulders: score(s.shoulders),
    chest: score(s.chest),
    arms: score(s.arms),
    waist: score(s.waist),
    legs: score(s.legs)
  };
}

export function compareToIdeal(current, ideal, onlyKeys = null) {
  if (!current || !ideal) return null;
  const items = [];
  let gapSum = 0;
  METRIC_DEFS.forEach((d) => {
    if (onlyKeys && !onlyKeys.includes(d.key)) return;
    const c = num(current[d.key]);
    const i = num(ideal[d.key]);
    if (c === null || i === null) return;
    const gap = Math.min(1, Math.abs(c - i) / d.range);
    gapSum += gap;
    items.push({ ...d, current: c, ideal: i, diff: Number((i - c).toFixed(d.digits)), gap });
  });
  if (items.length === 0) return null;
  const meanGap = gapSum / items.length;
  return {
    closeness: Math.round((1 - meanGap) * 100),
    meanGap,
    items
  };
}

const hasValue = (m, key) => Boolean(m) && num(m[key]) !== null;

export function progressSummary(history, ideal) {
  const empty = { points: [], keys: [], gainPoints: null, achievement: null, latestIncluded: false };
  if (!ideal) return empty;
  const list = (Array.isArray(history) ? history : [])
    .filter((h) => h && h.ideal_id === ideal.id && h.metrics)
    .sort((x, y) => (x.analyzed_at || '').localeCompare(y.analyzed_at || ''));
  if (list.length === 0) return empty;
  const keys = METRIC_DEFS.map((d) => d.key).filter((k) => hasValue(list[0].metrics, k) && hasValue(ideal.metrics, k));
  if (keys.length < 3) return { ...empty, keys };
  const usable = list.filter((h) => keys.every((k) => hasValue(h.metrics, k)));
  const points = usable.map((h) => {
    const cmp = compareToIdeal(h.metrics, ideal.metrics, keys);
    return { at: h.analyzed_at, closeness: cmp.closeness, meanGap: cmp.meanGap };
  });
  const first = points[0];
  const last = points[points.length - 1];
  const achievement = points.length > 1 && first.meanGap > 0
    ? Math.round(((first.meanGap - last.meanGap) / first.meanGap) * 100)
    : null;
  const newest = list[list.length - 1];
  return {
    points,
    keys,
    gainPoints: points.length > 1 ? last.closeness - first.closeness : null,
    achievement,
    latestIncluded: usable.includes(newest)
  };
}

export async function analyzeBodyPhoto(file) {
  const check = await inspectBodyPhoto(file);
  if (!check.ok) return { status: 'check_failed' };
  if (check.faceDetected) return { status: 'face' };
  const analysis = await analyzeBodyImage(file);
  if (!analysis) return { status: 'ai_failed' };
  const metrics = buildBodyMetrics(analysis, check.shoulderHipRatio);
  return { status: 'ok', analysis: { ...analysis, metrics }, metrics };
}

export const BODY_PHOTO_MESSAGES = {
  faceOnSelect: '⚠️ 顔が写っています。このままでは使えません（AIにも送っていません）。切り取るか、首から下を撮り直してください。',
  face: '⚠️ 顔が写っています。この写真は使えません（AIにも送っていません）。顔が入らないように、首から下を撮り直してください。',
  check_failed: '顔が写っていないかを確かめられなかったため、この写真は送りませんでした。通信を確認して、もう一度試してください。',
  ai_failed: 'AIで分析できませんでした（AIの設定がない、通信に失敗した、または写真から読み取れなかった）。メニューの「AI（Gemini）の設定」を確認してください。'
};
