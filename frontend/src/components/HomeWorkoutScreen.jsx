import React, { useState, useEffect } from 'react';
import WheelPicker from './WheelPicker';

const goalOptions = [
  { id: 'fine_muscle', label: '細マッチョ', desc: '引き締まった体・腹筋ライン', badgeColor: 'bg-[#EBF3FC] text-[#0056B3] border-[#B2D4F5]' },
  { id: 'bulk_up', label: 'マッスル', desc: '厚みのある胸板と腕・筋肥大', badgeColor: 'bg-[#F2F4F7] text-[#1A1A1C] border-[#D0D5DD]' },
  { id: 'diet', label: 'ダイエット', desc: '効率的な脂肪燃焼・全身引き締め', badgeColor: 'bg-[#F2F4F7] text-[#1A1A1C] border-[#D0D5DD]' },
  { id: 'health', label: '健康維持', desc: '体力維持・運動不足解消・姿勢改善', badgeColor: 'bg-[#F2F4F7] text-[#1A1A1C] border-[#D0D5DD]' }
];

const durationCourses = [
  { id: 30, label: '30分 (3種目)', count: 3, subtitle: '短時間・基本' },
  { id: 60, label: '60分 (4種目)', count: 4, subtitle: '標準' },
  { id: 90, label: '90分 (5種目)', count: 5, subtitle: '強化' },
  { id: 120, label: '120分 (7種目)', count: 7, subtitle: 'フルパック' },
];

const homeMenuTemplates = {
  fine_muscle: {
    30: [
      { name: 'プッシュアップ', part: '胸/腕', desc: '胸板と腕まわりを引き締める王道自重種目', reps: 10, sets: 3, duration: 10 },
      { name: '自重スクワット', part: '脚', desc: '下半身を引き締めてプロポーション向上', reps: 12, sets: 3, duration: 10 },
      { name: 'クランチ', part: 'お腹', desc: 'お腹の中央の縦ラインを引き締める', reps: 12, sets: 3, duration: 10 }
    ],
    60: [
      { name: 'プッシュアップ', part: '胸/腕', desc: '胸板と腕まわりを引き締める王道自重種目', reps: 10, sets: 3, duration: 10 },
      { name: '自重スクワット', part: '脚', desc: '下半身を引き締めてプロポーション向上', reps: 12, sets: 3, duration: 10 },
      { name: 'クランチ', part: 'お腹', desc: 'お腹の中央の縦ラインを引き締める', reps: 12, sets: 3, duration: 10 },
      { name: 'プランク', part: '体幹(1分)', desc: '体幹インナーマッスルの強化とくびれ形成', reps: 60, sets: 3, duration: 10 }
    ],
    90: [
      { name: 'プッシュアップ', part: '胸/腕', desc: '胸板と腕まわりを引き締める王道自重種目', reps: 10, sets: 3, duration: 10 },
      { name: '自重スクワット', part: '脚', desc: '下半身を引き締めてプロポーション向上', reps: 12, sets: 3, duration: 10 },
      { name: 'クランチ', part: 'お腹', desc: 'お腹の中央の縦ラインを引き締める', reps: 12, sets: 3, duration: 10 },
      { name: 'プランク', part: '体幹(1分)', desc: '体幹インナーマッスルの強化とくびれ形成', reps: 60, sets: 3, duration: 10 },
      { name: 'リバースプッシュアップ', part: '二の腕', desc: '二の腕の裏側（三頭筋）を引き締める', reps: 10, sets: 3, duration: 10 }
    ],
    120: [
      { name: 'プッシュアップ', part: '胸/腕', desc: '胸板と腕まわりを引き締める王道自重種目', reps: 10, sets: 3, duration: 10 },
      { name: '自重スクワット', part: '脚', desc: '下半身を引き締めてプロポーション向上', reps: 12, sets: 3, duration: 10 },
      { name: 'クランチ', part: 'お腹', desc: 'お腹の中央の縦ラインを引き締める', reps: 12, sets: 3, duration: 10 },
      { name: 'プランク', part: '体幹(1分)', desc: '体幹インナーマッスルの強化とくびれ形成', reps: 60, sets: 3, duration: 10 },
      { name: 'リバースプッシュアップ', part: '二の腕', desc: '二の腕の裏側（三頭筋）を引き締める', reps: 10, sets: 3, duration: 10 },
      { name: 'マウンテンクライマー', part: '有酸素', desc: '全身の脂肪を燃やし心肺機能を高める', reps: 30, sets: 3, duration: 10 },
      { name: '全身ストレッチ', part: '疲労回復', desc: '深呼吸とともに筋肉をリラックスさせる', reps: 1, sets: 1, duration: 10 }
    ]
  },
  bulk_up: {
    30: [
      { name: 'プッシュアップ', part: '胸/腕', desc: '胸と上腕三頭筋を限界まで刺激', reps: 12, sets: 3, duration: 10 },
      { name: '自重スクワット', part: '脚', desc: '大腿四頭筋と臀筋のサイズアップ', reps: 15, sets: 3, duration: 10 },
      { name: 'リバースクランチ', part: '下腹部', desc: '厚みのある下腹部と体幹を作る', reps: 12, sets: 3, duration: 10 }
    ],
    60: [
      { name: 'プッシュアップ', part: '胸/腕', desc: '胸と上腕三頭筋を限界まで刺激', reps: 12, sets: 3, duration: 10 },
      { name: '自重スクワット', part: '脚', desc: '大腿四頭筋と臀筋のサイズアップ', reps: 15, sets: 3, duration: 10 },
      { name: 'リバースクランチ', part: '下腹部', desc: '厚みのある下腹部と体幹を作る', reps: 12, sets: 3, duration: 10 },
      { name: 'リバースプッシュアップ', part: '二の腕', desc: 'たくましい腕の厚みを作る', reps: 12, sets: 3, duration: 10 }
    ],
    90: [
      { name: 'プッシュアップ', part: '胸/腕', desc: '胸と上腕三頭筋を限界まで刺激', reps: 12, sets: 3, duration: 10 },
      { name: '自重スクワット', part: '脚', desc: '大腿四頭筋と臀筋のサイズアップ', reps: 15, sets: 3, duration: 10 },
      { name: 'リバースクランチ', part: '下腹部', desc: '厚みのある下腹部と体幹を作る', reps: 12, sets: 3, duration: 10 },
      { name: 'リバースプッシュアップ', part: '二の腕', desc: 'たくましい腕の厚みを作る', reps: 12, sets: 3, duration: 10 },
      { name: 'バックエクステンション', part: '背中', desc: '脊柱起立筋と広背筋の筋肥大', reps: 12, sets: 3, duration: 10 }
    ],
    120: [
      { name: 'プッシュアップ', part: '胸/腕', desc: '胸と上腕三頭筋を限界まで刺激', reps: 12, sets: 3, duration: 10 },
      { name: '自重スクワット', part: '脚', desc: '大腿四頭筋と臀筋のサイズアップ', reps: 15, sets: 3, duration: 10 },
      { name: 'リバースクランチ', part: '下腹部', desc: '厚みのある下腹部と体幹を作る', reps: 12, sets: 3, duration: 10 },
      { name: 'リバースプッシュアップ', part: '二の腕', desc: 'たくましい腕の厚みを作る', reps: 12, sets: 3, duration: 10 },
      { name: 'バックエクステンション', part: '背中', desc: '脊柱起立筋と広背筋の筋肥大', reps: 12, sets: 3, duration: 10 },
      { name: 'ブルガリアンスクワット', part: '脚', desc: '片脚ずつ強烈にお尻と大腿を強化', reps: 10, sets: 3, duration: 10 },
      { name: 'ハンドスタンドプッシュアップ風', part: '肩', desc: '自重で三角筋と肩周りをビルドアップ', reps: 8, sets: 3, duration: 10 }
    ]
  },
  diet: {
    30: [
      { name: '自重スクワット', part: '脚', desc: '脚の筋肉をフル稼働して消費エネルギー増', reps: 15, sets: 3, duration: 10 },
      { name: 'バーピージャンプ', part: '全身・有酸素', desc: '心拍数を高めて脂肪燃焼モード突入', reps: 8, sets: 3, duration: 10 },
      { name: 'プランク', part: '体幹', desc: 'お腹を凹ませる体幹インナーマッスル', reps: 60, sets: 3, duration: 10 }
    ],
    60: [
      { name: '自重スクワット', part: '脚', desc: '脚の筋肉をフル稼働して消費エネルギー増', reps: 15, sets: 3, duration: 10 },
      { name: 'バーピージャンプ', part: '全身・有酸素', desc: '心拍数を高めて脂肪燃焼モード突入', reps: 8, sets: 3, duration: 10 },
      { name: 'プランク', part: '体幹', desc: 'お腹を凹ませる体幹インナーマッスル', reps: 60, sets: 3, duration: 10 },
      { name: 'マウンテンクライマー', part: '有酸素', desc: '下腹部の引き締めと有酸素脂肪燃焼', reps: 30, sets: 3, duration: 10 }
    ],
    90: [
      { name: '自重スクワット', part: '脚', desc: '脚の筋肉をフル稼働して消費エネルギー増', reps: 15, sets: 3, duration: 10 },
      { name: 'バーピージャンプ', part: '全身・有酸素', desc: '心拍数を高めて脂肪燃焼モード突入', reps: 8, sets: 3, duration: 10 },
      { name: 'プランク', part: '体幹', desc: 'お腹を凹ませる体幹インナーマッスル', reps: 60, sets: 3, duration: 10 },
      { name: 'マウンテンクライマー', part: '有酸素', desc: '下腹部の引き締めと有酸素脂肪燃焼', reps: 30, sets: 3, duration: 10 },
      { name: 'クランチ', part: 'お腹', desc: 'お腹のたるみを解消し引き締め', reps: 15, sets: 3, duration: 10 }
    ],
    120: [
      { name: '自重スクワット', part: '脚', desc: '脚の筋肉をフル稼働して消費エネルギー増', reps: 15, sets: 3, duration: 10 },
      { name: 'バーピージャンプ', part: '全身・有酸素', desc: '心拍数を高めて脂肪燃焼モード突入', reps: 8, sets: 3, duration: 10 },
      { name: 'プランク', part: '体幹', desc: 'お腹を凹ませる体幹インナーマッスル', reps: 60, sets: 3, duration: 10 },
      { name: 'マウンテンクライマー', part: '有酸素', desc: '下腹部の引き締めと有酸素脂肪燃焼', reps: 30, sets: 3, duration: 10 },
      { name: 'クランチ', part: 'お腹', desc: 'お腹のたるみを解消し引き締め', reps: 15, sets: 3, duration: 10 },
      { name: 'シャドウボクシング', part: '有酸素', desc: 'ウエストをひねりながら全身カロリー消費', reps: 60, sets: 3, duration: 10 },
      { name: '全身ストレッチ', part: '疲労回復', desc: '代謝を高めた体のリカバリー', reps: 1, sets: 1, duration: 10 }
    ]
  },
  health: {
    30: [
      { name: '全身ストレッチ', part: '柔軟性', desc: '全身の血行を促進し肩こり・腰痛を改善', reps: 1, sets: 1, duration: 10 },
      { name: '膝つきプッシュアップ', part: '胸/腕', desc: '無理のない負荷で上半身筋力を維持', reps: 8, sets: 2, duration: 10 },
      { name: '自重スクワット', part: '脚', desc: '歩行や階段を楽にする足腰づくり', reps: 10, sets: 2, duration: 10 }
    ],
    60: [
      { name: '全身ストレッチ', part: '柔軟性', desc: '全身の血行を促進し肩こり・腰痛を改善', reps: 1, sets: 1, duration: 10 },
      { name: '膝つきプッシュアップ', part: '胸/腕', desc: '無理のない負荷で上半身筋力を維持', reps: 8, sets: 2, duration: 10 },
      { name: '自重スクワット', part: '脚', desc: '歩行や階段を楽にする足腰づくり', reps: 10, sets: 2, duration: 10 },
      { name: 'バードドッグ', part: '体幹/背中', desc: '姿勢を安定させるインナーマッスル強化', reps: 10, sets: 2, duration: 10 }
    ],
    90: [
      { name: '全身ストレッチ', part: '柔軟性', desc: '全身の血行を促進し肩こり・腰痛を改善', reps: 1, sets: 1, duration: 10 },
      { name: '膝つきプッシュアップ', part: '胸/腕', desc: '無理のない負荷で上半身筋力を維持', reps: 8, sets: 2, duration: 10 },
      { name: '自重スクワット', part: '脚', desc: '歩行や階段を楽にする足腰づくり', reps: 10, sets: 2, duration: 10 },
      { name: 'バードドッグ', part: '体幹/背中', desc: '姿勢を安定させるインナーマッスル強化', reps: 10, sets: 2, duration: 10 },
      { name: 'ヒップリフト', part: 'お尻/裏もも', desc: '骨盤と下半身を安定させる', reps: 12, sets: 2, duration: 10 }
    ],
    120: [
      { name: '全身ストレッチ', part: '柔軟性', desc: '全身の血行を促進し肩こり・腰痛を改善', reps: 1, sets: 1, duration: 10 },
      { name: '膝つきプッシュアップ', part: '胸/腕', desc: '無理のない負荷で上半身筋力を維持', reps: 8, sets: 2, duration: 10 },
      { name: '自重スクワット', part: '脚', desc: '歩行や階段を楽にする足腰づくり', reps: 10, sets: 2, duration: 10 },
      { name: 'バードドッグ', part: '体幹/背中', desc: '姿勢を安定させるインナーマッスル強化', reps: 10, sets: 2, duration: 10 },
      { name: 'ヒップリフト', part: 'お尻/裏もも', desc: '骨盤と下半身を安定させる', reps: 12, sets: 2, duration: 10 },
      { name: 'その場足踏み', part: '軽い有酸素', desc: '太ももを上げて血行促進・生活習慣病予防', reps: 60, sets: 2, duration: 10 },
      { name: '首・肩まわりのストレッチ', part: '肩こり改善', desc: '首筋と肩甲骨をほぐし自律神経を整える', reps: 1, sets: 1, duration: 10 }
    ]
  }
};

const alternativeMap = {
  'プッシュアップ': [
    { name: '膝つきプッシュアップ', duration: 8, part: '胸/腕', desc: '負荷を落として安全に実施' },
    { name: 'リバースプッシュアップ', duration: 10, part: '二の腕', desc: '椅子を使って二の腕と胸を刺激' },
    { name: 'プランク', duration: 5, part: '体幹', desc: '関節に負担のない静的キープ' },
  ],
  '自重スクワット': [
    { name: 'ヒップリフト', duration: 10, part: 'お尻/裏もも', desc: '寝たままできるヒップアップ' },
    { name: 'ブルガリアンスクワット', duration: 10, part: '脚/お尻', desc: '片足ずつ深く刺激' },
    { name: 'その場足踏み', duration: 8, part: '下半身', desc: '関節に優しい足腰運動' },
  ],
  'クランチ': [
    { name: 'プランク', duration: 5, part: '体幹', desc: '腰に負担の少ない体幹キープ' },
    { name: 'リバースクランチ', duration: 10, part: '下腹部', desc: 'ぽっこり下腹部を集中刺激' },
    { name: 'バードドッグ', duration: 8, part: '体幹/背中', desc: '背骨を支えるインナー強化' },
  ],
  'プランク': [
    { name: 'バードドッグ', duration: 8, part: '体幹/背中', desc: '四つん這いで無理なく体幹刺激' },
    { name: 'クランチ', duration: 10, part: 'お腹', desc: 'お腹前面の引き締め' },
  ],
  'リバースプッシュアップ': [
    { name: '膝つきプッシュアップ', duration: 8, part: '胸/腕', desc: '胸と腕を無理なく刺激' },
    { name: 'プッシュアップ', duration: 10, part: '胸/腕', desc: '自重で上半身全体を強化' },
  ],
  'マウンテンクライマー': [
    { name: 'その場足踏み', duration: 10, part: '有酸素', desc: '静かにできる室内有酸素' },
    { name: 'プランク', duration: 5, part: '体幹', desc: '足腰に負担のない体幹トレ' },
  ],
  '全身ストレッチ': [
    { name: '首・肩まわりのストレッチ', duration: 8, part: '肩こり改善', desc: '上半身の緊張を重点的にほぐす' },
    { name: 'バードドッグ', duration: 8, part: '体幹', desc: '体を伸ばしながら体幹刺激' },
  ],
  'リバースクランチ': [
    { name: 'クランチ', duration: 10, part: 'お腹', desc: 'お腹上部を丸め込む' },
    { name: 'プランク', duration: 5, part: '体幹', desc: '体幹インナーマッスル' },
  ],
  'バックエクステンション': [
    { name: 'バードドッグ', duration: 8, part: '背中/体幹', desc: '腰に優しい背筋刺激' },
    { name: '全身ストレッチ', duration: 10, part: '柔軟性', desc: '背中のハリを緩める' },
  ],
  'ブルガリアンスクワット': [
    { name: '自重スクワット', duration: 10, part: '脚', desc: '両足で安定したスクワット' },
    { name: 'ヒップリフト', duration: 10, part: 'お尻', desc: '寝たままお尻を刺激' },
  ],
  'ハンドスタンドプッシュアップ風': [
    { name: 'プッシュアップ', duration: 10, part: '胸/腕', desc: '通常の腕立て伏せ' },
    { name: '膝つきプッシュアップ', duration: 8, part: '上半身', desc: '膝をついて肩・胸を刺激' },
  ],
  'バーピージャンプ': [
    { name: 'マウンテンクライマー', duration: 10, part: '有酸素', desc: 'ジャンプなしの有酸素' },
    { name: 'その場足踏み', duration: 10, part: '軽い有酸素', desc: '足腰に優しい室内運動' },
  ],
  'シャドウボクシング': [
    { name: 'その場足踏み', duration: 10, part: '有酸素', desc: '手軽なリズム運動' },
    { name: 'マウンテンクライマー', duration: 10, part: '有酸素', desc: '体幹を使いながら脂肪燃焼' },
  ],
  '膝つきプッシュアップ': [
    { name: 'プランク', duration: 5, part: '体幹', desc: '腕と体幹を安定させる' },
    { name: '首・肩まわりのストレッチ', duration: 8, part: '柔軟性', desc: '肩まわりの血流改善' },
  ],
  'バードドッグ': [
    { name: 'プランク', duration: 5, part: '体幹', desc: '静止して体幹を鍛える' },
    { name: 'ヒップリフト', duration: 10, part: 'お尻/裏もも', desc: '腰に優しい下半身刺激' },
  ],
  'ヒップリフト': [
    { name: '自重スクワット', duration: 10, part: '脚', desc: '立ち姿勢での下半身トレ' },
    { name: 'バードドッグ', duration: 8, part: '体幹/背中', desc: '体幹とお尻の連動' },
  ],
  'その場足踏み': [
    { name: '全身ストレッチ', duration: 10, part: '柔軟性', desc: 'ゆったり深呼吸' },
    { name: '自重スクワット', duration: 10, part: '下半身', desc: '足腰の筋力強化' },
  ],
  '首・肩まわりのストレッチ': [
    { name: '全身ストレッチ', duration: 10, part: '柔軟性', desc: '全身を大きく伸ばす' },
    { name: 'バードドッグ', duration: 8, part: '体幹', desc: '背筋を伸ばし姿勢改善' },
  ]
};

const formGuideMap = {
  'プッシュアップ': {
    target: '胸（大胸筋）・二の腕（上腕三頭筋）',
    targetBadge: '胸・二の腕',
    targetGoal: '10回 × 3セット (インターバル60秒)',
    difficulty: '★☆☆ 初心者〜中級',
    steps: [
      '両手を肩幅よりやや広めに開き、手のひらを床につけます。',
      '頭からかかとまでが一直線になるよう腹筋と臀部に力を入れます。',
      '息を吸いながら、胸が床に近づくまでゆっくり肘を曲げて下ろします。',
      '息を吐きながら床を強く押し、元の姿勢に戻ります。'
    ],
    tips: '腰が反ったりお尻が上がらないよう、お腹に軽く力を入れて板のような姿勢を維持しましょう。',
    illustration: 'pushup',
    youtubeQuery: '腕立て伏せ 正しいフォーム 自宅'
  },
  '自重スクワット': {
    target: '太もも（大腿四頭筋・ハムストリングス）・お尻（大臀筋）',
    targetBadge: '下半身全体',
    targetGoal: '12回 × 3セット (インターバル60秒)',
    difficulty: '★☆☆ 初心者向け',
    steps: [
      '足を肩幅程度に広げ、つま先をやや外側に向けます。',
      '背筋を伸ばし、股関節から折り曲げるようにお尻を後ろへ引きます。',
      '太ももが床と平行になる深さまで腰をゆっくり落とします。',
      '足の裏全体（特にかかと）で床を押して元の立ち姿勢に戻ります。'
    ],
    tips: '膝がつま先より前に出すぎないよう、後ろの椅子に腰掛けるイメージでお尻を引きましょう。',
    illustration: 'squat',
    youtubeQuery: 'スクワット 正しいフォーム 初心者'
  },
  'クランチ': {
    target: 'お腹（腹直筋上部）',
    targetBadge: '腹筋中央',
    targetGoal: '12〜15回 × 3セット',
    difficulty: '★☆☆ 初心者向け',
    steps: [
      '仰向けに寝て膝を90度に曲げ、足裏を床につけます。',
      '両手は胸の前でクロスするか、耳の横に軽く添えます。',
      '息を吐きながら、おへそを覗き込むように背中を丸めて上体を起こします。',
      '腹筋が最も縮んだところで1秒静止し、息を吸いながらゆっくり戻します。'
    ],
    tips: '腰全体を床から浮かせず、みぞおちから上だけを丸め込むのが効果を高めるポイントです。',
    illustration: 'crunch',
    youtubeQuery: 'クランチ 腹筋 正しいやり方'
  },
  'プランク': {
    target: '体幹（腹横筋・腹直筋・脊柱起立筋）',
    targetBadge: '体幹インナー',
    targetGoal: '30秒〜60秒キープ × 3セット',
    difficulty: '★☆☆ 初心者向け',
    steps: [
      '両肘を肩の真下の床につけ、前腕とつま先で体を支えます。',
      '頭・背中・腰・かかとが一直線になる姿勢を作ります。',
      'お腹にグッと力を入れ、呼吸を止めずに姿勢をキープします。'
    ],
    tips: 'お尻が高く上がったり腰が反ったりしないよう、お腹を凹ませる意識を持ちましょう。',
    illustration: 'plank',
    youtubeQuery: 'プランク フォーム コツ 初心者'
  },
  'リバースプッシュアップ': {
    target: '二の腕（上腕三頭筋）・肩後部',
    targetBadge: '二の腕',
    targetGoal: '10回 × 3セット',
    difficulty: '★☆☆ 初心者向け',
    steps: [
      '椅子や低めの台に背を向け、座面の端に両手を置きます。',
      '足を前に出し、膝を軽く曲げて体を支えます。',
      '肘が直角（約90度）になるまで、お尻を床に向かって下ろします。',
      '二の腕の裏側の力を使って、床を押し上げて元の高さに戻ります。'
    ],
    tips: '体が台から離れすぎないように、台のすぐそばを上下させる意識を持ちましょう。',
    illustration: 'reverse_pushup',
    youtubeQuery: 'リバースプッシュアップ 二の腕 椅子'
  },
  'マウンテンクライマー': {
    target: '全身・体幹・股関節・有酸素',
    targetBadge: '有酸素/体幹',
    targetGoal: '30秒〜45秒 × 3セット',
    difficulty: '★★☆ 中級向け',
    steps: [
      '腕立て伏せの姿勢を作り、両手は肩の真下に置きます。',
      '片方の膝を胸に向かって素早く引き上げます。',
      '足を素早く入れ替え、もう片方の膝を胸に引き寄せます。',
      '走るようなリズミカルなテンポで交互に繰り返します。'
    ],
    tips: '腰が上下に跳ねないよう、体幹を一直線に保って行いましょう。',
    illustration: 'climber',
    youtubeQuery: 'マウンテンクライマー 有酸素 フォーム'
  },
  '全身ストレッチ': {
    target: '全身の筋肉・関節・柔軟性',
    targetBadge: '柔軟性/疲労回復',
    targetGoal: '5〜10分間 リラックス',
    difficulty: '☆☆☆ リラクゼーション',
    steps: [
      '深呼吸をしながら、首と肩をゆっくり大きく回します。',
      '両手を高く組んで伸び上がり、上半身を左右に倒して体側を伸ばします。',
      '開脚して前屈し、太もも裏と股関節をじんわり伸ばします。',
      '全身の力を抜いて呼吸を整え、血流を行き渡らせます。'
    ],
    tips: '反動をつけず、心地よい伸びを感じる位置で20〜30秒深呼吸を続けましょう。',
    illustration: 'stretch',
    youtubeQuery: '全身ストレッチ 疲労回復 柔軟性'
  },
  'リバースクランチ': {
    target: '下腹部（ぽっこりお腹解消）・腸腰筋',
    targetBadge: '下腹部',
    targetGoal: '12回 × 3セット',
    difficulty: '★☆☆ 初心者向け',
    steps: [
      '仰向けになり、両手は体の横で床につけます。',
      '膝を軽く曲げた状態で両足を持ち上げます。',
      '骨盤を丸め込むようにして、お尻を床から少し浮かせ膝を胸に引き寄せます。',
      '下腹部の力を抜かずに、ゆっくりと元の位置へ戻します。'
    ],
    tips: '反動を使わず、下腹部を丸める力で骨盤を持ち上げるのがコツです。',
    illustration: 'reverse_crunch',
    youtubeQuery: 'リバースクランチ 下腹部 腹筋'
  },
  'バックエクステンション': {
    target: '背中（脊柱起立筋）・お尻（大臀筋）',
    targetBadge: '背中',
    targetGoal: '12回 × 3セット',
    difficulty: '★☆☆ 初心者向け',
    steps: [
      'うつ伏せになり、両手は頭の後ろまたは前に伸ばします。',
      '息を吐きながら、胸と脚を床からゆっくり数センチ浮かせます。',
      '背中の筋肉を意識しながら頂点で1秒キープします。',
      '息を吸いながらゆっくりと床すれすれまで下ろします。'
    ],
    tips: '腰を反らしすぎず、背中全体を心地よく縮めるイメージで行いましょう。',
    illustration: 'back_extension',
    youtubeQuery: 'バックエクステンション 背筋 自宅'
  },
  'ブルガリアンスクワット': {
    target: 'お尻（大臀筋）・太もも（大腿四頭筋・ハムストリングス）',
    targetBadge: 'お尻/美脚',
    targetGoal: '左右各10回 × 3セット',
    difficulty: '★★☆ 中級向け',
    steps: [
      '椅子やソファに背を向け、片足のつま先を後ろの台に乗せます。',
      'もう片方の足を一歩大きく前に踏み出します。',
      '前足の膝が90度になるまで、真下にゆっくり腰を落とします。',
      '前足のかかとで床を強く押して立ち上がります。'
    ],
    tips: '背筋をまっすぐに保ち、前足のお尻に体重を乗せるとヒップアップ効果が抜群です。',
    illustration: 'bulgarian_squat',
    youtubeQuery: 'ブルガリアンスクワット フォーム お尻'
  },
  'ハンドスタンドプッシュアップ風': {
    target: '肩（三角筋）・上腕三頭筋',
    targetBadge: '肩/二の腕',
    targetGoal: '8〜10回 × 3セット',
    difficulty: '★★☆ 中級向け',
    steps: [
      '床に手と足をつき、お尻を高く突き上げて山型の姿勢（パイク姿勢）を作ります。',
      '手と足の距離を近づけ、肩に体重が乗るようにします。',
      '頭のてっぺんを手と手の少し前の床に向かってゆっくり下ろします。',
      '肩の力で床を押し返して元の山型に戻ります。'
    ],
    tips: '最初は無理をせず、下ろす深さを浅くして肩の筋肉を使う感覚を掴みましょう。',
    illustration: 'pike_pushup',
    youtubeQuery: 'パイクプッシュアップ 肩トレ 自宅'
  },
  'バーピージャンプ': {
    target: '全身（下半身・胸・体幹・心肺機能）',
    targetBadge: '全身/脂肪燃焼',
    targetGoal: '8〜10回 × 3セット',
    difficulty: '★★☆ 全身燃焼',
    steps: [
      '足を肩幅に広げて立ち、しゃがんで両手を床につけます。',
      '両足を後ろにジャンプさせて腕立て伏せの姿勢になります。',
      '足を素早く手元の位置に戻してしゃがんだ姿勢に戻ります。',
      '真上に向かって軽くジャンプし、両手を頭上で叩きます。'
    ],
    tips: 'ジャンプが難しい場合は、ジャンプを省略して立ち上がるだけでも十分な脂肪燃焼効果があります。',
    illustration: 'burpee',
    youtubeQuery: 'バーピージャンプ 正しいフォーム'
  },
  'シャドウボクシング': {
    target: '肩・背中・わき腹（腹斜筋）・有酸素',
    targetBadge: '有酸素/くびれ',
    targetGoal: '1分間 × 3セット',
    difficulty: '★☆☆ 有酸素',
    steps: [
      '脇を軽く締め、両手を顎の前に構えてリラックスします。',
      'リズミカルにワンツージャブ（左右のストレートパンチ）を繰り出します。',
      '腰をひねりながら左右のフックやアッパーを織り交ぜます。',
      '常に足を軽く前後させながら、軽快なステップを踏みます。'
    ],
    tips: '腕だけでなくウエストをしっかりひねることで、お腹の引き締め効果が倍増します。',
    illustration: 'boxing',
    youtubeQuery: 'シャドウボクシング ダイエット 自宅'
  },
  '膝つきプッシュアップ': {
    target: '胸（大胸筋）・二の腕（上腕三頭筋）',
    targetBadge: '上半身/初心者',
    targetGoal: '8〜10回 × 2〜3セット',
    difficulty: '★☆☆ 初心者向け',
    steps: [
      '床に四つん這いになり、膝を床につけたまま両手を肩幅より広めに置きます。',
      '膝から頭までが一直線になるように姿勢を整えます。',
      '肘を曲げて胸を床にゆっくり近づけます。',
      '床を手で押して元の姿勢に戻ります。'
    ],
    tips: '腰を反らさず、胸を床にしっかり近づけることで大胸筋を優しく鍛えられます。',
    illustration: 'knee_pushup',
    youtubeQuery: '膝つき腕立て伏せ 初心者'
  },
  'バードドッグ': {
    target: '体幹・背筋・お尻（大臀筋）',
    targetBadge: '体幹/姿勢改善',
    targetGoal: '左右各10回 × 2セット',
    difficulty: '★☆☆ 初心者向け',
    steps: [
      '手は肩の真下、膝は股関節の真下の位置で四つん這いになります。',
      '右手と左足を同時に床と平行になる高さまでまっすぐ伸ばします。',
      '背中をまっすぐに保ち、2秒キープします。',
      'ゆっくり元の位置に戻し、反対側の手足も同様に行います。'
    ],
    tips: '手足を伸ばしたときに腰がグラグラしないよう、お腹を引き締めておきましょう。',
    illustration: 'birddog',
    youtubeQuery: 'バードドッグ 体幹 トレーニング'
  },
  'ヒップリフト': {
    target: 'お尻（大臀筋）・太もも裏（ハムストリングス）',
    targetBadge: 'ヒップ/骨盤',
    targetGoal: '12〜15回 × 2〜3セット',
    difficulty: '★☆☆ 初心者向け',
    steps: [
      '仰向けに寝て膝を90度に立て、両手は体の横に置きます。',
      'かかとで床を押し、お尻をキュッと締めながら腰を持ち上げます。',
      '膝から肩までが一直線になった高さで1秒キープします。',
      'お尻を完全に床につけず、すれすれまで下ろして繰り返します。'
    ],
    tips: '腰を反りすぎず、お尻の穴を締めるイメージで持ち上げると効果的です。',
    illustration: 'hiplift',
    youtubeQuery: 'ヒップリフト 正しいやり方 お尻'
  },
  'その場足踏み': {
    target: '腸腰筋・下半身血行・軽い有酸素',
    targetBadge: '軽有酸素/健康',
    targetGoal: '2〜3分間',
    difficulty: '☆☆☆ 初心者向け',
    steps: [
      '背筋をまっすぐ伸ばし、リラックスして立ちます。',
      '肘を直角に曲げて前後に大きくリズミカルに振ります。',
      '太ももを床と水平になる高さまでしっかり引き上げながら足踏みします。'
    ],
    tips: '目線を前に向け、深い呼吸を維持しながら行いましょう。',
    illustration: 'marching',
    youtubeQuery: 'その場足踏み 有酸素運動 高齢者 初心者'
  },
  '首・肩まわりのストレッチ': {
    target: '僧帽筋・肩甲骨・首筋の緊張緩和',
    targetBadge: '肩こり/首こり',
    targetGoal: '3〜5分間 リラックス',
    difficulty: '☆☆☆ リラクゼーション',
    steps: [
      '背筋を伸ばして座り、片手を頭に乗せて優しく真横に倒し首筋を伸ばします。',
      '斜め前にも倒して、首の後ろから肩にかけて心地よくストレッチします。',
      '両手を肩に乗せ、肘で大きな円を描くように肩甲骨を前回し・後ろ回しします。'
    ],
    tips: '息を吐きながら痛気持ちいい強さで伸ばし、無理に引っ張らないようにしましょう。',
    illustration: 'neck_stretch',
    youtubeQuery: '肩甲骨はがし 首肩ストレッチ 簡単'
  }
};

const standardSuggestions = [
  { name: '全身ストレッチ', time: 10, desc: '柔軟性向上・疲労回復' },
  { name: '自重スクワット', time: 10, desc: '下半身の引き締め・代謝アップ' },
  { name: 'プッシュアップ', time: 10, desc: '上半身の王道自重種目' },
];

const homeWorkoutCategories = [
  {
    id: 'bodyweight',
    name: '自重筋トレ',
    menus: [
      { name: 'プッシュアップ', time: 10, desc: '胸板と腕まわりを強化' },
      { name: '自重スクワット', time: 10, desc: '下半身の基礎代謝アップ' },
      { name: 'クランチ', time: 10, desc: 'お腹の中央を引き締める' },
      { name: 'プランク', time: 10, desc: '体幹インナーマッスル' },
      { name: 'リバースプッシュアップ', time: 10, desc: '二の腕のたるみを引き締め' },
      { name: 'ヒップリフト', time: 10, desc: 'ヒップラインを上向きに整える' },
      { name: 'ブルガリアンスクワット', time: 10, desc: '片脚集中のヒップアップ' },
      { name: '膝つきプッシュアップ', time: 8, desc: '無理のない負荷で上半身を刺激' },
      { name: 'バックエクステンション', time: 10, desc: '美しい背筋ラインを作る' },
    ]
  },
  {
    id: 'stretch',
    name: 'ストレッチ',
    menus: [
      { name: '全身ストレッチ', time: 10, desc: '柔軟性向上・疲労回復' },
      { name: '首・肩まわりのストレッチ', time: 8, desc: '肩こり解消・猫背改善' },
      { name: 'バードドッグ', time: 8, desc: '背骨の安定と姿勢改善' },
    ]
  },
  {
    id: 'cardio',
    name: '有酸素',
    menus: [
      { name: 'バーピージャンプ', time: 10, desc: '短時間で全身の脂肪を燃焼' },
      { name: 'マウンテンクライマー', time: 10, desc: '体幹と下半身の有酸素燃焼' },
      { name: 'シャドウボクシング', time: 10, desc: 'ウエストをひねり脂肪燃焼' },
      { name: 'その場足踏み', time: 10, desc: '室内で気軽に有酸素' },
    ]
  }
];

function ExerciseIllustration({ type }) {
  if (type === 'pushup') {
    return (
      <svg className="w-full h-20 text-[#0056B3]" viewBox="0 0 200 100" fill="none" stroke="currentColor">
        <line x1="20" y1="85" x2="180" y2="85" stroke="#D0D5DD" strokeWidth="2" strokeDasharray="4 4" />
        <circle cx="50" cy="40" r="8" stroke="currentColor" strokeWidth="2" fill="#EBF3FC" />
        <line x1="58" y1="44" x2="120" y2="58" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <line x1="120" y1="58" x2="165" y2="85" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <path d="M75 50 L65 70 L60 85" stroke="#004494" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <text x="80" y="32" fill="#0056B3" fontSize="10" fontWeight="bold">胸を床すれすれまで下ろす</text>
      </svg>
    );
  }
  if (type === 'squat') {
    return (
      <svg className="w-full h-20 text-[#0056B3]" viewBox="0 0 200 100" fill="none" stroke="currentColor">
        <line x1="20" y1="90" x2="180" y2="90" stroke="#D0D5DD" strokeWidth="2" strokeDasharray="4 4" />
        <circle cx="100" cy="22" r="7" stroke="currentColor" strokeWidth="2" fill="#EBF3FC" />
        <line x1="100" y1="30" x2="90" y2="55" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <line x1="90" y1="55" x2="120" y2="58" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <line x1="120" y1="58" x2="110" y2="90" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <line x1="100" y1="35" x2="125" y2="40" stroke="#004494" strokeWidth="2.5" strokeLinecap="round" />
        <text x="120" y="65" fill="#0056B3" fontSize="10" fontWeight="bold">太ももを床と平行に</text>
      </svg>
    );
  }
  if (type === 'plank') {
    return (
      <svg className="w-full h-20 text-[#0056B3]" viewBox="0 0 200 100" fill="none" stroke="currentColor">
        <line x1="20" y1="85" x2="180" y2="85" stroke="#D0D5DD" strokeWidth="2" strokeDasharray="4 4" />
        <circle cx="45" cy="45" r="7" stroke="currentColor" strokeWidth="2" fill="#EBF3FC" />
        <line x1="53" y1="48" x2="125" y2="56" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <line x1="125" y1="56" x2="165" y2="85" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <line x1="68" y1="50" x2="65" y2="72" stroke="#004494" strokeWidth="3" strokeLinecap="round" />
        <line x1="65" y1="72" x2="78" y2="85" stroke="#004494" strokeWidth="3" strokeLinecap="round" />
        <text x="75" y="35" fill="#0056B3" fontSize="10" fontWeight="bold">一直線の板をキープ</text>
      </svg>
    );
  }
  if (type === 'crunch') {
    return (
      <svg className="w-full h-20 text-[#0056B3]" viewBox="0 0 200 100" fill="none" stroke="currentColor">
        <line x1="20" y1="85" x2="180" y2="85" stroke="#D0D5DD" strokeWidth="2" strokeDasharray="4 4" />
        <circle cx="55" cy="55" r="7" stroke="currentColor" strokeWidth="2" fill="#EBF3FC" />
        <path d="M60 62 Q75 75 95 80" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M95 80 L125 60 L140 85" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
        <text x="65" y="40" fill="#0056B3" fontSize="10" fontWeight="bold">おへそを見て丸める</text>
      </svg>
    );
  }
  return (
    <div className="w-full h-16 bg-[#EBF3FC] border border-[#B2D4F5] rounded-lg flex items-center justify-center text-center p-1.5">
      <span className="text-xs font-bold text-[#0056B3]">正しい姿勢と呼吸を意識</span>
    </div>
  );
}

export default function HomeWorkoutScreen({ goal, presetWorkout, onBack, onRecordSuccess }) {
  const [activeGoal, setActiveGoal] = useState(() => {
    const saved = localStorage.getItem('raku_selected_goal');
    if (saved) return saved;
    if (typeof goal === 'string') return goal;
    if (goal?.target_focus) return goal.target_focus;
    return 'fine_muscle';
  });
  const [selectedDuration, setSelectedDuration] = useState(null);
  const [completedItems, setCompletedItems] = useState({});
  const [skippedItems, setSkippedItems] = useState({});
  const [expandedItems, setExpandedItems] = useState({});
  const [activeAltModalIdx, setActiveAltModalIdx] = useState(null);

  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);

  const [activeGuideItem, setActiveGuideItem] = useState(null);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [videoTimer, setVideoTimer] = useState(0);

  const [menuName, setMenuName] = useState('腕立て伏せ');
  const [reps, setReps] = useState(15);
  const [sets, setSets] = useState(3);
  const [duration, setDuration] = useState(10);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('bodyweight');
  const [workoutHistory, setWorkoutHistory] = useState([]);

  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customExerciseList, setCustomExerciseList] = useState(() => {
    try {
      const saved = localStorage.getItem('raku_home_custom_exercises');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [newExerciseForm, setNewExerciseForm] = useState({
    name: '',
    category: 'bodyweight',
    reps: 15,
    sets: 3,
    duration: 10,
  });

  const handleAddCustomExercise = (e) => {
    e.preventDefault();
    if (!newExerciseForm.name.trim()) return;
    const newEx = {
      name: newExerciseForm.name.trim(),
      category: newExerciseForm.category,
      reps: parseInt(newExerciseForm.reps, 10) || 15,
      sets: parseInt(newExerciseForm.sets, 10) || 3,
      duration: parseInt(newExerciseForm.duration, 10) || 10,
    };
    const updated = [...customExerciseList, newEx];
    setCustomExerciseList(updated);
    try {
      localStorage.setItem('raku_home_custom_exercises', JSON.stringify(updated));
    } catch {}
    setSelectedCategory(newEx.category);
    setMenuName(newEx.name);
    setReps(newEx.reps);
    setSets(newEx.sets);
    setDuration(newEx.duration);
    setNewExerciseForm({ name: '', category: 'bodyweight', reps: 15, sets: 3, duration: 10 });
    setIsCustomModalOpen(false);
    setMessage({ type: 'success', text: `カスタム種目「${newEx.name}」を追加しました` });
  };

  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [timerTotal, setTimerTotal] = useState(60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerFinished, setTimerFinished] = useState(false);

  const repsOptions = Array.from({ length: 100 }, (_, i) => ({
    label: `${i + 1}`,
    value: i + 1,
    subLabel: '回'
  }));

  const setsOptions = Array.from({ length: 10 }, (_, i) => ({
    label: `${i + 1}`,
    value: i + 1,
    subLabel: 'set'
  }));

  const [customRoutines, setCustomRoutines] = useState({});

  useEffect(() => {
    fetchWorkoutHistory();
  }, []);

  const fetchWorkoutHistory = async () => {
    try {
      const res = await fetch('/api/workouts');
      if (res.ok) {
        const data = await res.json();
        setWorkoutHistory(data.workouts || []);
      }
    } catch {
    }
  };

  useEffect(() => {
    let interval = null;
    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setTimerRunning(false);
            setTimerFinished(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds]);

  const startRestTimer = (seconds = 60) => {
    setTimerTotal(seconds);
    setTimerSeconds(seconds);
    setTimerFinished(false);
    setTimerRunning(true);
    setIsTimerOpen(true);
  };

  useEffect(() => {
    const saved = localStorage.getItem('raku_selected_goal');
    if (saved && saved !== activeGoal) {
      setActiveGoal(saved);
    } else if (!activeGoal && goal?.target_focus) {
      setActiveGoal(goal.target_focus);
    }
  }, [goal]);

  useEffect(() => {
    let interval = null;
    if (isPlayingVideo) {
      interval = setInterval(() => {
        setVideoTimer((prev) => (prev >= 30 ? 0 : prev + 1));
      }, 1000);
    } else {
      setVideoTimer(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlayingVideo]);

  const getRoutinesFor = (goalKey, dur) => {
    const customKey = `${goalKey}_${dur}`;
    if (customRoutines[customKey]) {
      return customRoutines[customKey];
    }
    const templates = homeMenuTemplates[goalKey] || homeMenuTemplates.fine_muscle;
    const list = templates[dur] || templates[60];
    return list.map((item, idx) => ({
      ...item,
      step: idx + 1,
      uniqueId: `${goalKey}-${dur}-${item.name}-${idx}`
    }));
  };

  const handleSelectGoal = (goalId) => {
    setActiveGoal(goalId);
    setSelectedDuration(null);
    localStorage.setItem('raku_selected_goal', goalId);
    const targetOpt = goalOptions.find((g) => g.id === goalId);
    fetch('/api/goal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target_focus: goalId,
        preset_name: targetOpt ? targetOpt.label : '細マッチョ'
      })
    }).catch(() => {});
    setCompletedItems({});
    setSkippedItems({});
    setExpandedItems({});
    setActiveAltModalIdx(null);
  };

  const handleSelectDuration = (durId) => {
    if (selectedDuration === durId) {
      setSelectedDuration(null);
    } else {
      setSelectedDuration(durId);
    }
    setCompletedItems({});
    setSkippedItems({});
    setExpandedItems({});
    setActiveAltModalIdx(null);
  };

  const toggleExpand = (idx) => {
    setExpandedItems((prev) => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const toggleAllExpand = (routinesList) => {
    const allOpen = routinesList.length > 0 && routinesList.every((_, idx) => expandedItems[idx]);
    const nextState = {};
    routinesList.forEach((_, idx) => {
      nextState[idx] = !allOpen;
    });
    setExpandedItems(nextState);
  };

  const handleRecordSingleRoutine = async (item, idx) => {
    try {
      const res = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workout_type: 'home',
          menu_name: item.name,
          duration_minutes: parseInt(item.duration, 10),
          note: `${item.part || ''}の宅トレ (${item.reps}回 × ${item.sets}set)`,
        }),
      });

      if (res.ok) {
        setCompletedItems((prev) => ({ ...prev, [idx]: true }));
        setMessage({ type: 'success', text: `「${item.name}」の記録を完了しました！インターバル開始` });
        fetchWorkoutHistory();
        startRestTimer(60);
        if (onRecordSuccess) {
          onRecordSuccess(`「${item.name}」を記録しました！`);
        }
        if (activeGuideItem && activeGuideItem.idx === idx) {
          setActiveGuideItem(null);
          setIsPlayingVideo(false);
        }
      }
    } catch {
      setMessage({ type: 'error', text: '記録の保存に失敗しました。' });
    }
  };

  const handleSkipRoutine = (idx) => {
    setSkippedItems((prev) => ({ ...prev, [idx]: true }));
  };

  const handleReplaceWithAlternative = (idx, altItem) => {
    const customKey = `${activeGoal}_${selectedDuration}`;
    const currentList = getRoutinesFor(activeGoal, selectedDuration);
    const updated = [...currentList];
    updated[idx] = {
      ...updated[idx],
      name: altItem.name,
      part: altItem.part || updated[idx].part,
      desc: altItem.desc,
      duration: altItem.duration,
    };
    setCustomRoutines((prev) => ({
      ...prev,
      [customKey]: updated
    }));
    setActiveAltModalIdx(null);
  };

  const handleBatchRecord = async (routinesList) => {
    const unrecorded = routinesList.filter((_, idx) => !completedItems[idx] && !skippedItems[idx]);
    if (unrecorded.length === 0) {
      setMessage({ type: 'error', text: '保存可能な未完了メニューがありません。' });
      return;
    }

    setIsSubmitting(true);
    try {
      for (const item of unrecorded) {
        await fetch('/api/workouts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workout_type: 'home',
            menu_name: item.name,
            duration_minutes: parseInt(item.duration, 10),
            note: '宅トレ一括記録',
          }),
        });
      }

      const allCompleted = { ...completedItems };
      routinesList.forEach((_, idx) => {
        if (!skippedItems[idx]) allCompleted[idx] = true;
      });
      setCompletedItems(allCompleted);
      setMessage({ type: 'success', text: '提案メニューを一括で記録しました！' });
      if (onRecordSuccess) {
        onRecordSuccess('提案メニューを一括で記録しました！');
      }
    } catch {
      setMessage({ type: 'error', text: '一括保存中にエラーが発生しました。' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenGuide = (item, idx) => {
    const guideData = formGuideMap[item.name] || {
      target: item.part,
      targetBadge: item.part,
      targetGoal: `${item.reps || 10}回 × ${item.sets || 3}セット`,
      difficulty: '★☆☆ 初心者向け',
      steps: [
        '姿勢を正し、鍛える部位を意識してスタートポジションをとります。',
        '無理のない範囲でゆっくりと筋肉を収縮・伸展させます。',
        '呼吸を止めずにリズミカルに動作を繰り返します。'
      ],
      tips: '反動を使わず、フォームを崩さないことを最優先しましょう。',
      illustration: 'general',
      youtubeQuery: `${item.name} フォーム 自宅`
    };

    setActiveGuideItem({
      ...guideData,
      name: item.name,
      part: item.part,
      idx: idx,
      rawItem: item
    });
    setIsPlayingVideo(false);
  };

  const handleSelectCustomMenu = (name, time) => {
    setMenuName(name);
    if (time) setDuration(time);
    setIsPickerOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!menuName.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workout_type: 'home',
          menu_name: menuName,
          reps: parseInt(reps, 10),
          sets: parseInt(sets, 10),
          duration_minutes: parseInt(duration, 10),
          note: note,
        }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: `「${menuName}」を記録しました！インターバル開始` });
        fetchWorkoutHistory();
        startRestTimer(60);
        if (onRecordSuccess) {
          onRecordSuccess('宅トレ記録を保存しました！');
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

  const activeGoalOpt = goalOptions.find(g => g.id === activeGoal);
  const currentRoutines = activeGoal && selectedDuration ? getRoutinesFor(activeGoal, selectedDuration) : [];

  return (
    <div className="flex flex-col min-h-[calc(100vh-5rem)] px-4 py-3 pb-40 relative bg-slate-100 no-scrollbar [&::-webkit-scrollbar]:hidden">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200/80 px-3 py-1.5 rounded-full shadow-xs cursor-pointer transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
          戻る
        </button>
        <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200/80 shadow-xs">
          宅トレ・自重運動
        </span>
      </div>

      {message && (
        <div className={`p-3 rounded-2xl text-xs font-bold text-center mb-3 shadow-xs transition-colors ${
          message.type === 'success'
            ? 'bg-blue-50 text-blue-700 border border-blue-200'
            : 'bg-rose-50 text-rose-700 border border-rose-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 mb-4 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/40 via-white to-transparent">
          <div>
            <h2 className="text-sm font-bold text-slate-900">種目を手動で記録</h2>
            <p className="text-xs text-slate-500 mt-0.5">種目・時間を選んですぐに記録できます</p>
          </div>
          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/70">
            手動入力
          </span>
        </div>

        <div className="p-4">
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">トレーニング種目を選択</label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsCustomModalOpen(true)}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-full border border-blue-200/80 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span>＋ 種目を追加</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPickerOpen(true)}
                    className="text-[11px] font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200/70 px-2.5 py-1 rounded-full border border-slate-200/80 transition-colors cursor-pointer"
                  >
                    一覧
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">カテゴリー (プルダウン)</label>
                  <div className="relative">
                    <select
                      value={selectedCategory}
                      onChange={(e) => {
                        const newCat = e.target.value;
                        setSelectedCategory(newCat);
                        const catObj = homeWorkoutCategories.find((c) => c.id === newCat);
                        if (catObj && catObj.menus[0]) {
                          setMenuName(catObj.menus[0].name);
                          if (catObj.menus[0].time) setDuration(catObj.menus[0].time);
                        }
                      }}
                      className="w-full bg-slate-50 border border-slate-200/90 text-slate-900 text-xs font-bold rounded-2xl px-3 py-2.5 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer pr-8"
                    >
                      {homeWorkoutCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">種目 (プルダウン)</label>
                  <div className="relative">
                    <select
                      value={menuName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setMenuName(val);
                        const currentCat = homeWorkoutCategories.find((c) => c.id === selectedCategory);
                        const found = currentCat?.menus.find((m) => m.name === val);
                        if (found && found.time) setDuration(found.time);
                      }}
                      className="w-full bg-slate-50 border border-slate-200/90 text-slate-900 text-xs font-bold rounded-2xl px-3 py-2.5 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer pr-8 truncate"
                    >
                      {(() => {
                        const currentCat = homeWorkoutCategories.find((c) => c.id === selectedCategory);
                        return (
                          <>
                            <optgroup label={`${currentCat?.name || '標準'} 種目`}>
                              {currentCat?.menus.map((m) => (
                                <option key={m.name} value={m.name}>
                                  {m.name} ({m.time}分)
                                </option>
                              ))}
                            </optgroup>
                            {customExerciseList.length > 0 && (
                              <optgroup label="カスタム種目">
                                {customExerciseList.map((c, cIdx) => (
                                  <option key={`c-${cIdx}`} value={c.name}>
                                    ★ {c.name}
                                  </option>
                                ))}
                              </optgroup>
                            )}
                          </>
                        );
                      })()}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {(() => {
                const lastRecord = workoutHistory.find((w) => (w.menu_name === menuName || (menuName === '腕立て伏せ' && w.menu_name === 'プッシュアップ') || (menuName === 'プッシュアップ' && w.menu_name === '腕立て伏せ')) && w.workout_type === 'home');
                if (lastRecord) {
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        if (lastRecord.reps) setReps(lastRecord.reps);
                        if (lastRecord.sets) setSets(lastRecord.sets);
                        setMessage({ type: 'success', text: `前回の記録（${lastRecord.reps}回 × ${lastRecord.sets}セット）を反映しました` });
                      }}
                      className="w-full py-2 px-3 bg-blue-50/90 hover:bg-blue-100/90 border border-blue-200 rounded-2xl flex items-center justify-between transition-all cursor-pointer shadow-xs group"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs">⏱️</span>
                        <span className="text-[11px] font-bold text-blue-900 truncate">
                          前回: {lastRecord.reps}回 × {lastRecord.sets}セット
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-blue-700 bg-white/90 group-hover:bg-white px-2 py-0.5 rounded-full border border-blue-200/80 flex-shrink-0">
                        タップで反映 ›
                      </span>
                    </button>
                  );
                }
                return (
                  <div className="w-full py-1.5 px-3 bg-slate-50 border border-slate-200/70 rounded-2xl flex items-center justify-between text-slate-500 text-[11px]">
                    <span className="flex items-center gap-1.5">
                      <span>⏱️</span>
                      <span>前回: 未記録（初回）</span>
                    </span>
                    <span className="text-[10px] text-slate-400">標準値を入力中</span>
                  </div>
                );
              })()}

              <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl divide-y divide-slate-100 overflow-hidden shadow-xs">
                <div className="p-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="text-sm">🏠</span>
                      <span>種目</span>
                    </div>
                    <div className="text-base font-black text-slate-900 mt-0.5 truncate">
                      {menuName}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPickerOpen(true)}
                    className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200 transition-colors cursor-pointer flex-shrink-0"
                  >
                    一覧から選択 ›
                  </button>
                </div>

                <div className="p-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="text-sm">🔄</span>
                      <span>回数 / 秒数</span>
                      <span className="text-[10px] text-slate-400 font-normal">(reps/sec)</span>
                    </div>
                    <div className="text-xl font-black text-blue-600 mt-0.5 tabular-nums">
                      {reps} <span className="text-xs font-bold text-slate-500">{menuName.includes('プランク') ? '秒' : '回'}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      {[-5, 5, 10].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setReps((prev) => Math.max(1, Math.min(100, prev + d)))}
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-lg border transition-all cursor-pointer active:scale-95 ${
                            d < 0
                              ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                              : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                          }`}
                        >
                          {d > 0 ? `+${d}` : d}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="relative bg-white border border-slate-200/80 rounded-2xl px-2 py-0.5 shadow-xs flex items-center flex-shrink-0">
                    <div className="pointer-events-none absolute inset-x-1 top-1/2 -translate-y-1/2 h-[34px] bg-blue-50/60 rounded-xl border border-blue-200/80 z-0" />
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-white/95 to-transparent z-10" />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-white/95 to-transparent z-10" />

                    <div className="relative z-0 flex items-center">
                      <WheelPicker
                        items={repsOptions}
                        value={reps}
                        onChange={(newReps) => setReps(newReps)}
                        width="w-14"
                        height="h-[102px]"
                        itemHeight={34}
                        fontSize="text-lg"
                        subFontSize="text-xs"
                      />
                      <span className="text-[11px] font-bold text-slate-500 pl-1 select-none">
                        {menuName.includes('プランク') ? '秒' : '回'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="text-sm">📊</span>
                      <span>セット数</span>
                      <span className="text-[10px] text-slate-400 font-normal">(sets)</span>
                    </div>
                    <div className="text-xl font-black text-blue-600 mt-0.5 tabular-nums">
                      {sets} <span className="text-xs font-bold text-slate-500">セット</span>
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      {[-1, 1].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setSets((prev) => Math.max(1, Math.min(10, prev + d)))}
                          className={`px-2.5 py-0.5 text-[10px] font-bold rounded-lg border transition-all cursor-pointer active:scale-95 ${
                            d < 0
                              ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                              : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                          }`}
                        >
                          {d > 0 ? `+${d}` : d}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="relative bg-white border border-slate-200/80 rounded-2xl px-2 py-0.5 shadow-xs flex items-center flex-shrink-0">
                    <div className="pointer-events-none absolute inset-x-1 top-1/2 -translate-y-1/2 h-[34px] bg-blue-50/60 rounded-xl border border-blue-200/80 z-0" />
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-white/95 to-transparent z-10" />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-white/95 to-transparent z-10" />

                    <div className="relative z-0 flex items-center">
                      <WheelPicker
                        items={setsOptions}
                        value={sets}
                        onChange={(newSets) => setSets(newSets)}
                        width="w-14"
                        height="h-[102px]"
                        itemHeight={34}
                        fontSize="text-lg"
                        subFontSize="text-xs"
                      />
                      <span className="text-[11px] font-bold text-slate-500 pl-1 select-none">set</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">メモ (任意)</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="例: 体が温まった・軽快に動けた"
                className="w-full bg-white border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-13 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/25 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>記録を保存中...</span>
                </>
              ) : (
                <span>宅トレ記録を保存する</span>
              )}
            </button>
          </form>

          <div className="mt-3 pt-3 border-t border-slate-100">
            <div
              onClick={() => setIsSuggestionsOpen(!isSuggestionsOpen)}
              className="flex items-center justify-between cursor-pointer select-none text-xs font-bold text-slate-600 hover:text-slate-900"
            >
              <span>手軽にできる定番種目 (3件)</span>
              <span className="text-xs">{isSuggestionsOpen ? '閉じる ▲' : '選ぶ ▼'}</span>
            </div>

            {isSuggestionsOpen && (
              <div className="mt-2 space-y-1.5">
                {standardSuggestions.map((s, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      handleSelectCustomMenu(s.name, s.time);
                      setIsSuggestionsOpen(false);
                    }}
                    className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      menuName === s.name
                        ? 'bg-blue-50/80 border-blue-500 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-blue-400'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900">{s.name}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full">
                          {s.time}分
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">{s.desc}</p>
                    </div>
                    <span className="text-blue-600 text-xs font-bold">セット</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 mb-4 p-4 space-y-4">
        <div className="flex items-center justify-between pb-1">
          <div>
            <h2 className="text-sm font-bold text-slate-900">おすすめメニューを生成</h2>
            <p className="text-xs text-slate-500">目標と時間を選択すると、自宅でできる最適な種目を自動提案します</p>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200/60">
            ステップ選択
          </span>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-slate-900">ステップ1: 目指す目標を選択</span>
            {activeGoal && (
              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/60">
                選択中: {activeGoalOpt?.label}
              </span>
            )}
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {goalOptions.map((opt) => {
              const isSelected = activeGoal === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectGoal(opt.id)}
                  className={`py-2 px-1 rounded-2xl text-center transition-all flex flex-col items-center justify-center border cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold shadow-md shadow-blue-500/20 border-transparent'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80 font-medium'
                  }`}
                >
                  <div className="flex items-center justify-center mb-1">
                    <span
                      className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'border-white bg-white/20'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </span>
                  </div>
                  <span className="text-xs leading-tight">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div
          className={`grid transition-[grid-template-rows,opacity] duration-300 ${
            activeGoal ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="overflow-hidden min-h-0">
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-900">ステップ2: トレーニング時間を選択</span>
                {selectedDuration && (
                  <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/60">
                    選択中: {selectedDuration}分コース
                  </span>
                )}
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {durationCourses.map((c) => {
                  const isSelected = selectedDuration === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectDuration(c.id)}
                      className={`py-2 px-1 rounded-2xl text-center transition-all flex flex-col items-center justify-center border cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold shadow-md shadow-blue-500/20 border-transparent'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80 font-medium'
                      }`}
                    >
                      <div className="flex items-center justify-center mb-1">
                        <span
                          className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'border-white bg-white/20'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && (
                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </span>
                      </div>
                      <span className="text-xs block leading-tight">{c.label}</span>
                      <span className={`text-[10px] block mt-0.5 ${isSelected ? 'text-blue-100 font-bold' : 'text-slate-500'}`}>
                        {c.count}種目
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div
          className={`grid transition-[grid-template-rows,opacity] duration-300 ${
            activeGoal && selectedDuration ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="overflow-hidden min-h-0">
            {activeGoal && selectedDuration && (
              <div className="pt-2 border-t border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      ステップ3: おすすめメニュー
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {activeGoalOpt?.label}・{selectedDuration}分コース (全{currentRoutines.length}種目)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleAllExpand(currentRoutines)}
                    className="text-[11px] bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-3 py-1 rounded-full font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    {currentRoutines.every((_, idx) => expandedItems[idx]) ? 'すべて閉じる' : 'すべて開く'}
                  </button>
                </div>

                <div className="space-y-2 bg-slate-50/80 rounded-2xl p-3 border border-slate-200/80">
                  {currentRoutines.map((item, idx) => {
                    const isCompleted = completedItems[idx];
                    const isSkipped = skippedItems[idx];
                    const isExpanded = !!expandedItems[idx];
                    const guide = formGuideMap[item.name];
                    const alternatives = alternativeMap[item.name] || [
                      { name: '自重スクワット', duration: 10, part: item.part, desc: '下半身基礎種目' },
                      { name: 'プランク', duration: 5, part: item.part, desc: '体幹静的キープ' }
                    ];

                    return (
                      <div
                        key={item.uniqueId || idx}
                        className={`rounded-2xl border transition-all overflow-hidden ${
                          isCompleted
                            ? 'bg-blue-50/70 border-blue-200 shadow-xs'
                            : isSkipped
                            ? 'bg-slate-100/70 border-slate-200 opacity-60'
                            : isExpanded
                            ? 'bg-white border-blue-500 shadow-md shadow-blue-500/10'
                            : 'bg-white border-slate-200/80 hover:border-blue-400 shadow-xs'
                        }`}
                      >
                        <div
                          onClick={() => toggleExpand(idx)}
                          className="p-3 flex items-center justify-between cursor-pointer select-none"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-xs flex-shrink-0">
                              {idx + 1}
                            </span>
                            <div>
                              <span className="text-sm font-bold text-slate-900 block">{item.name}</span>
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold inline-block mt-0.5">
                                {item.part}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {isCompleted ? (
                              <span className="text-xs bg-blue-50 text-blue-700 font-bold px-2.5 py-0.5 rounded-full border border-blue-200">
                                記録済
                              </span>
                            ) : isSkipped ? (
                              <span className="text-xs bg-slate-100 text-slate-500 font-medium px-2.5 py-0.5 rounded-full border border-slate-200">
                                スキップ
                              </span>
                            ) : (
                              <span className="text-xs font-bold text-blue-600">
                                {item.reps}回 × {item.sets}set
                              </span>
                            )}

                            <span className="text-slate-400 ml-0.5">
                              <svg
                                className={`w-3.5 h-3.5 transform transition-transform ${
                                  isExpanded ? 'rotate-180' : 'rotate-0'
                                }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                              </svg>
                            </span>
                          </div>
                        </div>

                        <div
                          className={`grid transition-[grid-template-rows,opacity] duration-300 ${
                            isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                          }`}
                        >
                          <div className="overflow-hidden min-h-0">
                            <div className="px-3 pb-3 pt-1 space-y-2.5 border-t border-slate-100">
                              <p className="text-xs text-slate-600 leading-relaxed">
                                {item.desc}
                              </p>

                              {guide && (
                                <div className="bg-blue-50/60 rounded-2xl p-3 border border-blue-100 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-900">
                                      部位: {guide.target}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenGuide(item, idx)}
                                      className="text-xs text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
                                    >
                                      詳細ガイドを見る ›
                                    </button>
                                  </div>

                                  <div className="bg-white rounded-xl p-1.5 flex justify-center border border-blue-100 shadow-xs">
                                    <ExerciseIllustration type={guide.illustration} />
                                  </div>

                                  <div className="space-y-1">
                                    {guide.steps.slice(0, 2).map((st, sIdx) => (
                                      <div key={sIdx} className="flex items-start gap-1.5 text-xs text-slate-600">
                                        <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                                          {sIdx + 1}
                                        </span>
                                        <span>{st}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {!isCompleted && !isSkipped && (
                                <div className="pt-1">
                                  <div className="border-t border-slate-100 bg-slate-50 px-3 py-2.5 -mx-3 -mb-3 rounded-b-2xl flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleRecordSingleRoutine(item, idx)}
                                      className="flex-1 h-10 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-1 cursor-pointer"
                                    >
                                      <span>完了して記録する</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setActiveAltModalIdx(activeAltModalIdx === idx ? null : idx)}
                                      className="h-10 px-3 py-1.5 bg-white border border-slate-200/90 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                                    >
                                      切り替える
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleSkipRoutine(idx)}
                                      className="h-10 px-3 py-1.5 bg-white border border-slate-200/90 hover:bg-slate-100 text-slate-500 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                                    >
                                      スキップ
                                    </button>
                                  </div>

                                  {activeAltModalIdx === idx && (
                                    <div className="bg-white rounded-2xl p-3 mt-2 border border-blue-200/80 shadow-sm space-y-2">
                                      <span className="text-xs text-slate-700 font-bold block mb-0.5">
                                        代替種目を選択して切り替える:
                                      </span>
                                      {alternatives.map((alt, altIdx) => (
                                        <div
                                          key={altIdx}
                                          onClick={() => handleReplaceWithAlternative(idx, alt)}
                                          className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/60 cursor-pointer flex items-center justify-between text-xs transition-colors"
                                        >
                                          <div>
                                            <span className="font-bold text-slate-900 block">{alt.name}</span>
                                            <span className="text-[10px] text-slate-500">{alt.desc}</span>
                                          </div>
                                          <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-bold">
                                            切り替える
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <div className="mt-2 pt-2 border-t border-slate-200/80">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleBatchRecord(currentRoutines)}
                      className="w-full h-13 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-bold rounded-2xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <span>未記録のメニューを一括保存する</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-2xl text-xs font-bold text-center mb-3 shadow-xs transition-colors ${
          message.type === 'success'
            ? 'bg-blue-50 text-blue-700 border border-blue-200'
            : 'bg-rose-50 text-rose-700 border border-rose-200'
        }`}>
          {message.text}
        </div>
      )}

      {activeGuideItem && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => {
              setActiveGuideItem(null);
              setIsPlayingVideo(false);
            }}
          />

          <div className="relative w-full max-w-md mx-auto bg-white rounded-t-[2.5rem] p-5 shadow-2xl flex flex-col max-h-[85vh] z-10 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3 flex-shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveGuideItem(null);
                    setIsPlayingVideo(false);
                  }}
                  className="flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200/80 px-3 py-1 rounded-full cursor-pointer shadow-xs"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                  </svg>
                  戻る
                </button>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-slate-900">{activeGuideItem.name}</h3>
                  <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                    {activeGuideItem.targetBadge}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveGuideItem(null);
                  setIsPlayingVideo(false);
                }}
                className="w-7 h-7 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100 flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 flex-1 pr-1 pb-3">
              <div className="bg-slate-900 rounded-2xl p-3.5 text-white shadow-md relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold">動作ガイド</span>
                  <span className="text-[10px] bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold px-2 py-0.5 rounded-full shadow-xs">
                    {isPlayingVideo ? `再生中 0:${videoTimer.toString().padStart(2, '0')}/0:30` : '30秒ガイド'}
                  </span>
                </div>

                <div className="relative bg-neutral-950 rounded-xl overflow-hidden aspect-video flex flex-col items-center justify-center p-3 border border-neutral-800">
                  {isPlayingVideo ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-center space-y-1.5">
                      <div className="w-8 h-8 rounded-full border-3 border-blue-500 border-t-transparent animate-spin flex items-center justify-center" />
                      <span className="text-xs font-bold text-white">動作ガイド再生中</span>
                      <p className="text-[10px] text-neutral-300 max-w-[80%]">
                        {videoTimer % 2 === 0 ? '息を吸いながら下ろす' : '息を吐きながら押し上げる'}
                      </p>
                      <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden mt-1">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-1000"
                          style={{ width: `${(videoTimer / 30) * 100}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center space-y-2">
                      <button
                        type="button"
                        onClick={() => setIsPlayingVideo(true)}
                        className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 transition-all cursor-pointer pl-0.5"
                      >
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </button>
                      <span className="text-[10px] font-bold text-neutral-300">タップして動作ガイドを再生</span>
                      <a
                        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(activeGuideItem.youtubeQuery)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-blue-300 hover:text-white hover:underline flex items-center gap-1 mt-0.5"
                      >
                        <span>解説動画を検索</span>
                        <span>↗</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-200/80">
                <span className="text-xs font-bold text-slate-900 block mb-1.5">フォーム図解</span>
                <ExerciseIllustration type={activeGuideItem.illustration} />
              </div>

              <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">動作ステップ</span>
                  <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                    {activeGuideItem.difficulty}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {activeGuideItem.steps.map((step, sIdx) => (
                    <div key={sIdx} className="flex items-start gap-2 text-xs">
                      <span className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                        {sIdx + 1}
                      </span>
                      <p className="text-slate-800 leading-relaxed font-medium">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200">
                <div className="text-xs font-bold text-slate-900 mb-0.5">
                  ポイント・注意点
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {activeGuideItem.tips}
                </p>
              </div>

              <div className="bg-blue-50/70 rounded-xl p-2.5 flex items-center justify-between text-xs border border-blue-100">
                <span className="text-slate-600 font-medium">推奨目安:</span>
                <span className="font-bold text-blue-900">{activeGuideItem.targetGoal}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex-shrink-0">
              <button
                type="button"
                onClick={() => handleRecordSingleRoutine(activeGuideItem.rawItem, activeGuideItem.idx)}
                className="w-full h-12 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-2xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center cursor-pointer"
              >
                <span>この種目を完了して記録する</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {isPickerOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsPickerOpen(false)}
          />

          <div className="relative w-full max-w-md mx-auto bg-white rounded-t-[2.5rem] p-5 shadow-2xl flex flex-col max-h-[75vh] z-10 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3 flex-shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPickerOpen(false)}
                  className="flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200/80 px-3 py-1 rounded-full cursor-pointer shadow-xs"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                  </svg>
                  戻る
                </button>
                <h3 className="text-sm font-bold text-slate-900">運動種目を選択</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPickerOpen(false)}
                className="w-7 h-7 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100 flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1 p-1.5 bg-slate-100 rounded-full mb-3 flex-shrink-0 border border-slate-200/70">
              {homeWorkoutCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`py-1.5 text-xs font-bold rounded-full transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <div className="overflow-y-auto space-y-2 flex-1 pr-1">
              {homeWorkoutCategories
                .find((cat) => cat.id === selectedCategory)
                ?.menus.map((m, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectCustomMenu(m.name, m.time)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      menuName === m.name
                        ? 'bg-blue-50/80 border-blue-500 shadow-xs'
                        : 'bg-white border-slate-200/80 hover:border-blue-400'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{m.name}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full">
                          {m.time}分
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{m.desc}</p>
                    </div>
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                      選択
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {isTimerOpen && (
        <div className="fixed bottom-20 left-4 right-4 max-w-md mx-auto z-50 animate-bounce-subtle pointer-events-auto">
          <div className="bg-slate-900/95 text-white rounded-3xl p-4 shadow-2xl border border-slate-700/80 backdrop-blur-md">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-200">
                  {timerFinished ? 'インターバル終了！次のセットへ' : 'セット間インターバル (休憩)'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTimerRunning(false);
                  setIsTimerOpen(false);
                }}
                className="text-white/80 hover:text-white text-xs px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
              >
                閉じる ✕
              </button>
            </div>

            <div className="flex items-baseline justify-center gap-1.5 my-1.5">
              <span className="text-3xl font-black tracking-tight tabular-nums">
                {Math.floor(timerSeconds / 60)}:{String(timerSeconds % 60).padStart(2, '0')}
              </span>
              <span className="text-xs opacity-75">
                {timerFinished ? '経過' : '残り'}
              </span>
            </div>

            {!timerFinished ? (
              <div className="space-y-2 mt-2">
                <div className="w-full bg-white/20 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-blue-400 h-full transition-all duration-1000 ease-linear rounded-full"
                    style={{ width: `${timerTotal > 0 ? (timerSeconds / timerTotal) * 100 : 0}%` }}
                  />
                </div>
                <div className="flex items-center justify-between gap-1.5 pt-1 flex-wrap">
                  <span className="text-[10px] opacity-75 font-medium">時間切替:</span>
                  <div className="flex gap-1.5">
                    {[30, 60, 90].map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => startRestTimer(sec)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                          timerTotal === sec
                            ? 'bg-blue-500 text-white shadow-xs'
                            : 'bg-white/10 text-white/90 hover:bg-white/20'
                        }`}
                      >
                        {sec}秒
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setTimerRunning(!timerRunning)}
                      className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-white/20 hover:bg-white/30 text-white transition-all cursor-pointer"
                    >
                      {timerRunning ? '一時停止' : '再開'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-2 text-center">
                <button
                  type="button"
                  onClick={() => startRestTimer(60)}
                  className="w-full py-2 bg-white text-emerald-800 font-bold rounded-2xl text-xs hover:bg-slate-100 shadow-sm transition-all cursor-pointer"
                >
                  次の休憩を計測 (60秒)
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {isCustomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsCustomModalOpen(false)}
          />
          <div className="relative bg-white rounded-3xl p-5 shadow-2xl max-w-sm w-full border border-slate-200 z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center text-sm font-bold">
                  ＋
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">新規宅トレ種目を追加</h3>
                  <p className="text-[10px] text-slate-500">オリジナルの宅トレメニューを登録できます</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomModalOpen(false)}
                className="w-7 h-7 rounded-full border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustomExercise} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  種目名 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newExerciseForm.name}
                  onChange={(e) => setNewExerciseForm({ ...newExerciseForm, name: e.target.value })}
                  placeholder="例: エア縄跳び・バーピー"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  カテゴリー (プルダウン)
                </label>
                <select
                  value={newExerciseForm.category}
                  onChange={(e) => setNewExerciseForm({ ...newExerciseForm, category: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                >
                  {homeWorkoutCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">回数/秒数</label>
                  <input
                    type="number"
                    min="1"
                    value={newExerciseForm.reps}
                    onChange={(e) => setNewExerciseForm({ ...newExerciseForm, reps: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-center font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">セット数</label>
                  <input
                    type="number"
                    min="1"
                    value={newExerciseForm.sets}
                    onChange={(e) => setNewExerciseForm({ ...newExerciseForm, sets: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-center font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">時間 (分)</label>
                  <input
                    type="number"
                    min="1"
                    value={newExerciseForm.duration}
                    onChange={(e) => setNewExerciseForm({ ...newExerciseForm, duration: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-center font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCustomModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  追加して選択
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
