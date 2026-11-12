export const ACTIVITY_OPTIONS = [
  { key: 'low', label: '少なめ', desc: '座っていることが多い', pal: 1.5 },
  { key: 'normal', label: 'ふつう', desc: '通学・家事・軽い運動で動く', pal: 1.75 },
  { key: 'high', label: '多め', desc: '立ち仕事や運動の習慣がある', pal: 2.0 }
];

const BMR_PER_KG = {
  male: [[17, 27.0], [29, 23.7], [49, 22.5], [64, 21.8], [74, 21.6], [200, 21.5]],
  female: [[17, 25.3], [29, 22.1], [49, 21.9], [64, 20.7], [74, 20.7], [200, 20.7]]
};

const roundHalf = (v) => Math.round(v * 2) / 2;
const round50 = (v) => Math.round(v / 50) * 50;

export function bmiCategory(bmi) {
  if (bmi < 18.5) return '低体重（やせ）';
  if (bmi < 25) return '普通体重';
  return '肥満（1度以上）';
}

function planFor(goal, direction) {
  if (direction < 0) {
    return goal === 'diet'
      ? { delta: -400, label: '体脂肪を減らすことをねらって、消費の目安より約400kcal少なく食べます' }
      : { delta: -200, label: '少しずつ体重を減らすことをねらって、消費の目安より約200kcal少なく食べます' };
  }
  if (direction > 0) {
    return goal === 'bulk_up'
      ? { delta: 250, label: '体重と筋肉を増やすことをねらって、消費の目安より約250kcal多く食べます' }
      : { delta: 200, label: '少しずつ体重を増やすことをねらって、消費の目安より約200kcal多く食べます' };
  }
  return { delta: 0, label: '今の体重を保つことをねらって、消費の目安と同じくらい食べます' };
}

export function buildRecommendation({ goal, sex, age, height, weight, activity }) {
  const h = height / 100;
  const bmi = weight / (h * h);
  const w = (b) => b * h * h;
  const table = BMR_PER_KG[sex] || BMR_PER_KG.male;
  const perKg = (table.find(([maxAge]) => age <= maxAge) || table[table.length - 1])[1];
  const bmr = perKg * weight;
  const act = ACTIVITY_OPTIONS.find((a) => a.key === activity) || ACTIVITY_OPTIONS[1];
  const pal = age >= 65 ? Number((act.pal - 0.05).toFixed(2)) : act.pal;
  const tdee = bmr * pal;

  let target = weight;
  let targetReason = '';
  if (bmi < 18.5) {
    target = Math.min(w(18.5), weight + 2);
    targetReason = '今は低体重（BMI18.5未満）なので、体重を減らす目標はおすすめしません。BMI18.5に近づくよう、少し増やすことを目標にしています。';
  } else if (goal === 'diet') {
    if (bmi > 22) {
      target = Math.max(w(22), weight * 0.95);
      targetReason = '今の体重の5%（まずはここまで）か、BMI22の体重のうち、近いほうを目標にしています。';
    } else if (bmi >= 20) {
      target = Math.max(w(20), weight - 2);
      targetReason = 'すでにBMIが22以下なので、減らしすぎないよう、最大2kg減（BMI20を下回らない範囲）を目標にしています。';
    } else {
      target = weight;
      targetReason = 'すでにBMIが20未満なので、体重は減らさず、今の体重を保ちながら運動で引き締めることをおすすめします。';
    }
  } else if (goal === 'fine_muscle') {
    if (bmi > 22) {
      target = Math.max(w(22), weight - 3);
      targetReason = '体脂肪を少し落としながら筋肉をつけるため、最大3kg減（BMI22を下回らない範囲）を目標にしています。';
    } else {
      target = weight;
      targetReason = '体重はあまり変えず、筋肉をつけて見た目を引き締めることを目標にしています。';
    }
  } else if (goal === 'bulk_up') {
    if (bmi < 24) {
      target = Math.min(weight + 2, w(25));
      targetReason = '筋肉を増やすため、最大2kg増（BMI25を超えない範囲）を目標にしています。';
    } else {
      target = weight;
      targetReason = 'すでにBMIが24以上なので、体重は増やさず、筋トレで筋肉を増やすことをおすすめします。';
    }
  } else if (bmi >= 25) {
    target = Math.max(w(24.9), weight * 0.95);
    targetReason = '普通体重（BMI25未満）に近づくよう、今の体重の5%減を目安にしています。';
  } else {
    target = weight;
    targetReason = '今は普通体重なので、今の体重を保つことを目標にしています。';
  }
  target = roundHalf(target);
  const diff = target - weight;
  const direction = Math.abs(diff) < 0.5 ? 0 : diff > 0 ? 1 : -1;
  const plan = planFor(goal, direction);

  const intake = round50(Math.max(tdee + plan.delta, bmr));
  const dailyDiff = intake - tdee;
  const sameDirection = direction !== 0 && Math.sign(dailyDiff) === direction;
  const weeklyKg = Math.abs(dailyDiff) * 7 / 7200;
  const weeks = sameDirection && weeklyKg > 0.05 ? Math.ceil(Math.abs(diff) / weeklyKg) : null;

  return {
    bmi: Number(bmi.toFixed(1)),
    bmiLabel: bmiCategory(bmi),
    highBmi: bmi >= 25,
    standardWeight: roundHalf(w(22)),
    bmr: Math.round(bmr),
    pal,
    tdee: Math.round(tdee),
    intake,
    planLabel: plan.label,
    target,
    targetBmi: Number((target / (h * h)).toFixed(1)),
    targetReason,
    weeks
  };
}
