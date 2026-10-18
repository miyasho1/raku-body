import React, { useState, useEffect } from 'react';
import WheelPicker from './WheelPicker';

export default function GymWorkoutScreen({ goal, presetWorkout, onBack, onRecordSuccess }) {
  const goalOptions = [
    { id: 'fine_muscle', label: '細マッチョ', desc: '引き締まった体・逆三角形ライン', badgeColor: 'bg-[#EBF3FC] text-[#0056B3] border-[#B2D4F5]' },
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

  const gymMenuTemplates = {
    fine_muscle: {
      30: [
        { name: 'チェストプレスマシン', part: '胸', desc: '胸の厚みと輪郭を作る基礎種目', weight: 20, reps: 10, sets: 3 },
        { name: 'ラットプルダウン', part: '背中', desc: '美しい逆三角形の広背筋を作る', weight: 25, reps: 10, sets: 3 },
        { name: 'レッグプレス', part: '脚', desc: '安全に下半身全体を引き締める', weight: 40, reps: 10, sets: 3 }
      ],
      60: [
        { name: 'チェストプレスマシン', part: '胸', desc: '胸の厚みと輪郭を作る基礎種目', weight: 20, reps: 10, sets: 3 },
        { name: 'ラットプルダウン', part: '背中', desc: '美しい逆三角形の広背筋を作る', weight: 25, reps: 10, sets: 3 },
        { name: 'レッグプレス', part: '脚', desc: '安全に下半身全体を引き締める', weight: 40, reps: 10, sets: 3 },
        { name: 'プランク', part: '体幹/お腹', desc: 'お腹まわりを引き締める体幹保持', weight: 0, reps: 15, sets: 2 }
      ],
      90: [
        { name: 'チェストプレスマシン', part: '胸', desc: '胸の厚みと輪郭を作る基礎種目', weight: 20, reps: 10, sets: 3 },
        { name: 'ラットプルダウン', part: '背中', desc: '美しい逆三角形の広背筋を作る', weight: 25, reps: 10, sets: 3 },
        { name: 'レッグプレス', part: '脚', desc: '安全に下半身全体を引き締める', weight: 40, reps: 10, sets: 3 },
        { name: 'プランク', part: '体幹/お腹', desc: 'お腹まわりを引き締める体幹保持', weight: 0, reps: 15, sets: 2 },
        { name: 'ショルダープレス', part: '肩', desc: '肩の立体感と綺麗な逆三角形ライン', weight: 15, reps: 10, sets: 3 }
      ],
      120: [
        { name: 'チェストプレスマシン', part: '胸', desc: '胸の厚みと輪郭を作る基礎種目', weight: 20, reps: 10, sets: 3 },
        { name: 'ラットプルダウン', part: '背中', desc: '美しい逆三角形の広背筋を作る', weight: 25, reps: 10, sets: 3 },
        { name: 'レッグプレス', part: '脚', desc: '安全に下半身全体を引き締める', weight: 40, reps: 10, sets: 3 },
        { name: 'プランク', part: '体幹/お腹', desc: 'お腹まわりを引き締める体幹保持', weight: 0, reps: 15, sets: 2 },
        { name: 'ショルダープレス', part: '肩', desc: '肩の立体感と綺麗な逆三角形ライン', weight: 15, reps: 10, sets: 3 },
        { name: 'アームカール', part: '腕', desc: '二頭筋を引き締めメリハリを出す', weight: 10, reps: 10, sets: 3 },
        { name: 'トライセプスプレス', part: '腕の裏', desc: '二の腕の裏側をすっきり引き締める', weight: 12.5, reps: 10, sets: 3 }
      ]
    },
    bulk_up: {
      30: [
        { name: 'バーベルスクワット', part: '脚', desc: '成長ホルモンを分泌させる王道種目', weight: 35, reps: 8, sets: 3 },
        { name: 'ベンチプレス', part: '胸', desc: '大胸筋の厚みをつくる基本種目', weight: 40, reps: 8, sets: 3 },
        { name: 'デッドリフト', part: '背中', desc: '背中全体の厚みを強化するBIG3', weight: 50, reps: 8, sets: 3 }
      ],
      60: [
        { name: 'バーベルスクワット', part: '脚', desc: '成長ホルモンを分泌させる王道種目', weight: 35, reps: 8, sets: 3 },
        { name: 'ベンチプレス', part: '胸', desc: '大胸筋の厚みをつくる基本種目', weight: 40, reps: 8, sets: 3 },
        { name: 'デッドリフト', part: '背中', desc: '背中全体の厚みを強化するBIG3', weight: 50, reps: 8, sets: 3 },
        { name: 'ショルダープレス', part: '肩', desc: '立体的なメロン肩をつくる', weight: 17.5, reps: 8, sets: 3 }
      ],
      90: [
        { name: 'バーベルスクワット', part: '脚', desc: '成長ホルモンを分泌させる王道種目', weight: 35, reps: 8, sets: 3 },
        { name: 'ベンチプレス', part: '胸', desc: '大胸筋の厚みをつくる基本種目', weight: 40, reps: 8, sets: 3 },
        { name: 'デッドリフト', part: '背中', desc: '背中全体の厚みを強化するBIG3', weight: 50, reps: 8, sets: 3 },
        { name: 'ショルダープレス', part: '肩', desc: '立体的なメロン肩をつくる', weight: 17.5, reps: 8, sets: 3 },
        { name: 'バーベルカール', part: '腕', desc: '力強い力こぶを鍛える', weight: 12.5, reps: 10, sets: 3 }
      ],
      120: [
        { name: 'バーベルスクワット', part: '脚', desc: '成長ホルモンを分泌させる王道種目', weight: 35, reps: 8, sets: 3 },
        { name: 'ベンチプレス', part: '胸', desc: '大胸筋の厚みをつくる基本種目', weight: 40, reps: 8, sets: 3 },
        { name: 'デッドリフト', part: '背中', desc: '背中全体の厚みを強化するBIG3', weight: 50, reps: 8, sets: 3 },
        { name: 'ショルダープレス', part: '肩', desc: '立体的なメロン肩をつくる', weight: 17.5, reps: 8, sets: 3 },
        { name: 'バーベルカール', part: '腕', desc: '力強い力こぶを鍛える', weight: 12.5, reps: 10, sets: 3 },
        { name: 'トライセプスプッシュダウン', part: '二の腕', desc: '腕の太さを決定づける三頭筋強化', weight: 15, reps: 10, sets: 3 },
        { name: 'クランチ', part: '腹筋', desc: '割れた腹筋をつくる集中トレ', weight: 0, reps: 15, sets: 3 }
      ]
    },
    diet: {
      30: [
        { name: 'レッグプレス', part: '脚/大筋群', desc: '下半身の最大筋群を動かし代謝アップ', weight: 35, reps: 12, sets: 3 },
        { name: 'ラットプルダウン', part: '背中', desc: '姿勢を正して脂肪燃焼を加速', weight: 20, reps: 12, sets: 3 },
        { name: 'トレッドミル', part: '有酸素ウォーク', desc: '筋トレ後の15分有酸素で脂肪燃焼', weight: 0, reps: 15, sets: 1 }
      ],
      60: [
        { name: 'レッグプレス', part: '脚/大筋群', desc: '下半身の最大筋群を動かし代謝アップ', weight: 35, reps: 12, sets: 3 },
        { name: 'ラットプルダウン', part: '背中', desc: '姿勢を正して脂肪燃焼を加速', weight: 20, reps: 12, sets: 3 },
        { name: 'トレッドミル', part: '有酸素ウォーク', desc: '筋トレ後の15分有酸素で脂肪燃焼', weight: 0, reps: 15, sets: 1 },
        { name: 'チェストプレスマシン', part: '胸', desc: '上半身の大筋群で消費カロリー増', weight: 17.5, reps: 12, sets: 3 }
      ],
      90: [
        { name: 'レッグプレス', part: '脚/大筋群', desc: '下半身の最大筋群を動かし代謝アップ', weight: 35, reps: 12, sets: 3 },
        { name: 'ラットプルダウン', part: '背中', desc: '姿勢を正して脂肪燃焼を加速', weight: 20, reps: 12, sets: 3 },
        { name: 'トレッドミル', part: '有酸素ウォーク', desc: '筋トレ後の15分有酸素で脂肪燃焼', weight: 0, reps: 15, sets: 1 },
        { name: 'チェストプレスマシン', part: '胸', desc: '上半身の大筋群で消費カロリー増', weight: 17.5, reps: 12, sets: 3 },
        { name: 'プランク', part: '体幹/お腹', desc: 'お腹を凹ませる体幹インナーマッスル', weight: 0, reps: 15, sets: 3 }
      ],
      120: [
        { name: 'レッグプレス', part: '脚/大筋群', desc: '下半身の最大筋群を動かし代謝アップ', weight: 35, reps: 12, sets: 3 },
        { name: 'ラットプルダウン', part: '背中', desc: '姿勢を正して脂肪燃焼を加速', weight: 20, reps: 12, sets: 3 },
        { name: 'トレッドミル', part: '有酸素ウォーク', desc: '筋トレ後の15分有酸素で脂肪燃焼', weight: 0, reps: 15, sets: 1 },
        { name: 'チェストプレスマシン', part: '胸', desc: '上半身の大筋群で消費カロリー増', weight: 17.5, reps: 12, sets: 3 },
        { name: 'プランク', part: '体幹/お腹', desc: 'お腹を凹ませる体幹インナーマッスル', weight: 0, reps: 15, sets: 3 },
        { name: 'アームカール', part: '腕', desc: '腕の引き締めと消費エネルギー追加', weight: 8, reps: 12, sets: 3 },
        { name: 'エリプティカルマシン', part: '有酸素', desc: '全身運動の有酸素で仕上げ', weight: 0, reps: 15, sets: 1 }
      ]
    },
    health: {
      30: [
        { name: 'レッグプレス', part: '脚', desc: '足腰の健康と歩行能力を保つ', weight: 30, reps: 10, sets: 2 },
        { name: 'ラットプルダウン', part: '背中', desc: '猫背を予防し深い呼吸を促す', weight: 20, reps: 10, sets: 2 },
        { name: 'プランク', part: '体幹', desc: '腰痛予防のインナーマッスル', weight: 0, reps: 10, sets: 2 }
      ],
      60: [
        { name: 'レッグプレス', part: '脚', desc: '足腰の健康と歩行能力を保つ', weight: 30, reps: 10, sets: 2 },
        { name: 'ラットプルダウン', part: '背中', desc: '猫背を予防し深い呼吸を促す', weight: 20, reps: 10, sets: 2 },
        { name: 'プランク', part: '体幹', desc: '腰痛予防のインナーマッスル', weight: 0, reps: 10, sets: 2 },
        { name: 'チェストプレスマシン', part: '胸', desc: '無理のない負荷で上半身を活性化', weight: 15, reps: 10, sets: 2 }
      ],
      90: [
        { name: 'レッグプレス', part: '脚', desc: '足腰の健康と歩行能力を保つ', weight: 30, reps: 10, sets: 2 },
        { name: 'ラットプルダウン', part: '背中', desc: '猫背を予防し深い呼吸を促す', weight: 20, reps: 10, sets: 2 },
        { name: 'プランク', part: '体幹', desc: '腰痛予防のインナーマッスル', weight: 0, reps: 10, sets: 2 },
        { name: 'チェストプレスマシン', part: '胸', desc: '無理のない負荷で上半身を活性化', weight: 15, reps: 10, sets: 2 },
        { name: 'ショルダープレス', part: '肩', desc: '肩関節の可動域と血流を改善', weight: 12.5, reps: 10, sets: 2 }
      ],
      120: [
        { name: 'レッグプレス', part: '脚', desc: '足腰の健康と歩行能力を保つ', weight: 30, reps: 10, sets: 2 },
        { name: 'ラットプルダウン', part: '背中', desc: '猫背を予防し深い呼吸を促す', weight: 20, reps: 10, sets: 2 },
        { name: 'プランク', part: '体幹', desc: '腰痛予防のインナーマッスル', weight: 0, reps: 10, sets: 2 },
        { name: 'チェストプレスマシン', part: '胸', desc: '無理のない負荷で上半身を活性化', weight: 15, reps: 10, sets: 2 },
        { name: 'ショルダープレス', part: '肩', desc: '肩関節の可動域と血流を改善', weight: 12.5, reps: 10, sets: 2 },
        { name: '自重スクワット', part: '下半身', desc: '日常生活の立ち上がりを楽にする', weight: 0, reps: 12, sets: 2 },
        { name: 'ストレッチ', part: '柔軟性', desc: '全身の血行促進と疲労回復', weight: 0, reps: 10, sets: 1 }
      ]
    }
  };

  const alternativeMap = {
    'チェストプレスマシン': [
      { name: 'ベンチプレス', weight: 35, reps: 10, sets: 3, part: '胸', desc: 'フリーウェイトの王道種目' },
      { name: 'ダンベルフライ', weight: 10, reps: 12, sets: 3, part: '胸', desc: '胸筋のストレッチ種目' },
      { name: 'プッシュアップ', weight: 0, reps: 15, sets: 3, part: '胸', desc: '安全な自重プッシュ' },
    ],
    'ベンチプレス': [
      { name: 'チェストプレスマシン', weight: 25, reps: 10, sets: 3, part: '胸', desc: '軌道安定マシン' },
      { name: 'ダンベルプレス', weight: 14, reps: 10, sets: 3, part: '胸', desc: '手首が自由な高負荷種目' },
      { name: 'プッシュアップ', weight: 0, reps: 15, sets: 3, part: '胸', desc: '安全な自重プッシュ' },
    ],
    'ラットプルダウン': [
      { name: 'シーテッドローイング', weight: 25, reps: 10, sets: 3, part: '背中', desc: '背中の中央・厚み強化' },
      { name: 'チンニング(懸垂)', weight: 0, reps: 8, sets: 3, part: '背中', desc: '高負荷自重プル' },
      { name: 'ワンハンドダンベルロウ', weight: 12, reps: 10, sets: 3, part: '背中', desc: '片側ずつ意識できる種目' },
    ],
    'レッグプレス': [
      { name: 'バーベルスクワット', weight: 35, reps: 8, sets: 3, part: '脚', desc: '体幹と下半身の王道' },
      { name: 'ブルガリアンスクワット', weight: 10, reps: 10, sets: 3, part: '脚', desc: '片脚集中のヒップアップ' },
      { name: 'レッグエクステンション', weight: 25, reps: 12, sets: 3, part: '脚', desc: '前もも特化マシン' },
    ],
    'バーベルスクワット': [
      { name: 'レッグプレス', weight: 45, reps: 10, sets: 3, part: '脚', desc: '腰に負担の少ない安全マシン' },
      { name: 'ハックスクワット', weight: 30, reps: 10, sets: 3, part: '脚', desc: '大腿四頭筋ダイレクト' },
      { name: '自重スクワット', weight: 0, reps: 20, sets: 3, part: '脚', desc: '安全な自重下半身トレ' },
    ],
    'デッドリフト': [
      { name: 'バックエクステンション', weight: 0, reps: 15, sets: 3, part: '背中/腰', desc: '腰にやさしい脊柱起立筋トレ' },
      { name: 'シーテッドローイング', weight: 30, reps: 10, sets: 3, part: '背中', desc: '背中の厚みマシン' },
    ],
    'ショルダープレス': [
      { name: 'サイドレイズ', weight: 5, reps: 15, sets: 3, part: '肩', desc: '肩の横幅を作るアイソレーション' },
      { name: 'フロントレイズ', weight: 5, reps: 15, sets: 3, part: '肩', desc: '肩の前部を刺激' },
    ],
    'バーベルカール': [
      { name: 'インクラインダンベルカール', weight: 8, reps: 10, sets: 3, part: '腕', desc: '二頭筋の強いストレッチ' },
      { name: 'アームカール', weight: 8, reps: 10, sets: 3, part: '腕', desc: 'ダンベルアームカール' },
    ],
    'アームカール': [
      { name: 'バーベルカール', weight: 12.5, reps: 10, sets: 3, part: '腕', desc: '両手で高重量カール' },
      { name: 'ハンマーカール', weight: 8, reps: 10, sets: 3, part: '腕', desc: '前腕と上腕筋を刺激' },
    ],
    'プランク': [
      { name: 'クランチ', weight: 0, reps: 15, sets: 3, part: '体幹', desc: 'お腹を丸める腹筋運動' },
      { name: 'アブドミナルマシン', weight: 20, reps: 12, sets: 3, part: '体幹', desc: 'マシン腹筋トレ' },
    ],
    'トライセプスプレス': [
      { name: 'トライセプスプッシュダウン', weight: 12.5, reps: 10, sets: 3, part: '腕の裏', desc: 'ロープやバーで二の腕刺激' },
      { name: 'ディップス', weight: 0, reps: 10, sets: 3, part: '腕の裏', desc: '自重二の腕押し出し' },
    ],
    'トライセプスプッシュダウン': [
      { name: 'トライセプスプレス', weight: 15, reps: 10, sets: 3, part: '二の腕', desc: 'マシンで二の腕集中' },
      { name: 'キックバック', weight: 6, reps: 12, sets: 3, part: '二の腕', desc: 'ダンベルで引き締め' },
    ],
    'トレッドミル': [
      { name: 'エアロバイク', weight: 0, reps: 15, sets: 1, part: '有酸素', desc: '膝に優しいバイク有酸素' },
      { name: 'エリプティカルマシン', weight: 0, reps: 15, sets: 1, part: '有酸素', desc: '全身連動の有酸素' },
    ],
    'エリプティカルマシン': [
      { name: 'トレッドミル', weight: 0, reps: 15, sets: 1, part: '有酸素', desc: '傾斜をつけてウォーキング' },
      { name: 'エアロバイク', weight: 0, reps: 15, sets: 1, part: '有酸素', desc: '固定自転車' },
    ],
    '自重スクワット': [
      { name: 'レッグプレス', weight: 25, reps: 10, sets: 2, part: '下半身', desc: 'マシンで下半身サポート' },
      { name: 'ランジ', weight: 0, reps: 10, sets: 2, part: '下半身', desc: '片脚バランス' },
    ],
    'ストレッチ': [
      { name: '肩甲骨ほぐし', weight: 0, reps: 10, sets: 1, part: '柔軟性', desc: '肩こり改善ストレッチ' },
      { name: '股関節ストレッチ', weight: 0, reps: 10, sets: 1, part: '柔軟性', desc: '下半身の緊張を抜く' },
    ],
    'クランチ': [
      { name: 'プランク', weight: 0, reps: 15, sets: 2, part: '体幹', desc: '静的キープ' },
      { name: 'レッグレイズ', weight: 0, reps: 12, sets: 2, part: '下腹部', desc: '下腹部集中' },
    ]
  };

  const bodyParts = {
    chest: {
      label: '胸',
      menus: ['チェストプレスマシン', 'ベンチプレス', 'インクラインベンチプレス', 'ダンベルフライ', 'ケーブルクロスオーバー', 'ディップス', 'プッシュアップ', 'デクラインベンチプレス']
    },
    back: {
      label: '背中',
      menus: ['ラットプルダウン', 'デッドリフト', 'ベントオーバーロウ', 'シーテッドローイング', 'チンニング(懸垂)', 'ワンハンドダンベルロウ', 'バックエクステンション', 'フェイスプル']
    },
    legs: {
      label: '脚・下半身',
      menus: ['レッグプレス', 'バーベルスクワット', 'レッグエクステンション', 'レッグカール', 'ハックスクワット', 'ブルガリアンスクワット', 'カーフレイズ', 'ヒップスラスト']
    },
    shoulders: {
      label: '肩・腕',
      menus: ['ショルダープレス', 'サイドレイズ', 'リアレイズ', 'フロントレイズ', 'バーベルカール', 'インクラインダンベルカール', 'トライセプスローププッシュダウン', 'スカルクラッシャー']
    }
  };

  const weightIntOptions = Array.from({ length: 151 }, (_, i) => i);
  const weightDecOptions = [0, 0.5];
  const repsOptions = Array.from({ length: 50 }, (_, i) => 1 + i);
  const setsOptions = Array.from({ length: 15 }, (_, i) => 1 + i);

  const [selectedGoal, setSelectedGoal] = useState(() => {
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

  const [activePart, setActivePart] = useState('chest');
  const [menuName, setMenuName] = useState('チェストプレスマシン');
  const [weight, setWeight] = useState(20);
  const [reps, setReps] = useState(10);
  const [sets, setSets] = useState(3);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const [customRoutines, setCustomRoutines] = useState({});
  const [workoutHistory, setWorkoutHistory] = useState([]);

  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(90);
  const [timerTotal, setTimerTotal] = useState(90);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerFinished, setTimerFinished] = useState(false);

  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customExerciseList, setCustomExerciseList] = useState(() => {
    try {
      const saved = localStorage.getItem('raku_gym_custom_exercises');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [newExerciseForm, setNewExerciseForm] = useState({
    name: '',
    part: 'chest',
    weight: 20,
    reps: 10,
    sets: 3,
  });

  const handleAddCustomExercise = (e) => {
    e.preventDefault();
    if (!newExerciseForm.name.trim()) return;
    const newEx = {
      name: newExerciseForm.name.trim(),
      part: newExerciseForm.part,
      weight: parseFloat(newExerciseForm.weight) || 0,
      reps: parseInt(newExerciseForm.reps, 10) || 10,
      sets: parseInt(newExerciseForm.sets, 10) || 3,
    };
    const updated = [...customExerciseList, newEx];
    setCustomExerciseList(updated);
    try {
      localStorage.setItem('raku_gym_custom_exercises', JSON.stringify(updated));
    } catch {}
    setActivePart(newEx.part);
    setMenuName(newEx.name);
    setWeight(newEx.weight);
    setReps(newEx.reps);
    setSets(newEx.sets);
    setNewExerciseForm({ name: '', part: 'chest', weight: 20, reps: 10, sets: 3 });
    setIsCustomModalOpen(false);
    setMessage({ type: 'success', text: `カスタム種目「${newEx.name}」を追加しました` });
  };

  const fetchWorkoutHistory = async () => {
    try {
      const res = await fetch('/api/workouts');
      if (res.ok) {
        const data = await res.json();
        if (data.workouts) {
          setWorkoutHistory(data.workouts);
        }
      }
    } catch {}
  };

  useEffect(() => {
    fetchWorkoutHistory();
  }, []);

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

  const startRestTimer = (seconds = 90) => {
    setTimerTotal(seconds);
    setTimerSeconds(seconds);
    setTimerFinished(false);
    setTimerRunning(true);
    setIsTimerOpen(true);
  };

  const handleQuickWeightAdjust = (diff) => {
    setWeight((prev) => {
      const updated = Math.max(0, Math.min(150, Math.round((prev + diff) * 2) / 2));
      return updated;
    });
  };

  useEffect(() => {
    const saved = localStorage.getItem('raku_selected_goal');
    if (saved && saved !== selectedGoal) {
      setSelectedGoal(saved);
    } else if (!selectedGoal && goal?.target_focus) {
      setSelectedGoal(goal.target_focus);
    }
  }, [goal]);

  const getRoutinesFor = (goalKey, dur) => {
    const customKey = `${goalKey}_${dur}`;
    if (customRoutines[customKey]) {
      return customRoutines[customKey];
    }
    const templates = gymMenuTemplates[goalKey] || gymMenuTemplates.fine_muscle;
    const list = templates[dur] || templates[60];
    return list.map((item, idx) => ({
      ...item,
      step: idx + 1,
      uniqueId: `${goalKey}-${dur}-${item.name}-${idx}`
    }));
  };

  const handleSelectGoal = (goalId) => {
    setSelectedGoal(goalId);
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

  const handleSelectRoutineItem = (item) => {
    setMenuName(item.name);
    setWeight(item.weight || 20);
    setReps(item.reps || 10);
    setSets(item.sets || 3);
    setMessage({ type: 'success', text: `「${item.name}」を手動フォームに反映しました` });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRecordSingleRoutine = async (item, idx) => {
    try {
      const res = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workout_type: 'gym',
          menu_name: item.name,
          weight: parseFloat(item.weight || 0),
          reps: parseInt(item.reps || 10, 10),
          sets: parseInt(item.sets || 3, 10),
          note: `${item.part || ''}のトレーニング`,
        }),
      });

      if (res.ok) {
        setCompletedItems((prev) => ({ ...prev, [idx]: true }));
        setMessage({ type: 'success', text: `「${item.name}」の記録を完了しました！インターバル開始` });
        fetchWorkoutHistory();
        startRestTimer(90);
        if (onRecordSuccess) {
          onRecordSuccess(`「${item.name}」を記録しました！`);
        }
      } else {
        setMessage({ type: 'error', text: '保存に失敗しました。' });
      }
    } catch {
      setMessage({ type: 'error', text: '通信エラーが発生しました。' });
    }
  };

  const handleSkipRoutine = (idx) => {
    setSkippedItems((prev) => ({ ...prev, [idx]: true }));
  };

  const handleReplaceWithAlternative = (idx, altItem) => {
    const customKey = `${selectedGoal}_${selectedDuration}`;
    const currentList = getRoutinesFor(selectedGoal, selectedDuration);
    const updated = [...currentList];
    updated[idx] = {
      ...updated[idx],
      name: altItem.name,
      part: altItem.part || updated[idx].part,
      desc: altItem.desc,
      weight: altItem.weight !== undefined ? altItem.weight : updated[idx].weight,
      reps: altItem.reps !== undefined ? altItem.reps : updated[idx].reps,
      sets: altItem.sets !== undefined ? altItem.sets : updated[idx].sets,
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
            workout_type: 'gym',
            menu_name: item.name,
            weight: parseFloat(item.weight || 0),
            reps: parseInt(item.reps || 10, 10),
            sets: parseInt(item.sets || 3, 10),
            note: 'ジム一括記録',
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
          workout_type: 'gym',
          menu_name: menuName,
          weight: parseFloat(weight),
          reps: parseInt(reps, 10),
          sets: parseInt(sets, 10),
          note: note,
        }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: `「${menuName}」を記録しました！インターバル開始` });
        fetchWorkoutHistory();
        startRestTimer(90);
        if (onRecordSuccess) {
          onRecordSuccess('ジム記録を保存しました！');
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

  const activeGoalOpt = goalOptions.find(g => g.id === selectedGoal);
  const currentRoutines = selectedGoal && selectedDuration ? getRoutinesFor(selectedGoal, selectedDuration) : [];

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
          ジムトレーニング
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
            <p className="text-xs text-slate-500 mt-0.5">種目・重量・回数を指定して直接記録します</p>
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
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">対象部位 (プルダウン)</label>
                  <div className="relative">
                    <select
                      value={activePart}
                      onChange={(e) => {
                        const newPart = e.target.value;
                        setActivePart(newPart);
                        const firstMenu = bodyParts[newPart]?.menus[0];
                        if (firstMenu) setMenuName(firstMenu);
                      }}
                      className="w-full bg-slate-50 border border-slate-200/90 text-slate-900 text-xs font-bold rounded-2xl px-3 py-2.5 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer pr-8"
                    >
                      {Object.keys(bodyParts).map((partKey) => (
                        <option key={partKey} value={partKey}>
                          {bodyParts[partKey].label}
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
                      onChange={(e) => setMenuName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200/90 text-slate-900 text-xs font-bold rounded-2xl px-3 py-2.5 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer pr-8 truncate"
                    >
                      <optgroup label={`${bodyParts[activePart]?.label || '標準'} 種目`}>
                        {bodyParts[activePart]?.menus.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </optgroup>
                      {customExerciseList.length > 0 && (
                        <optgroup label="カスタム種目">
                          {customExerciseList.map((c, cIdx) => (
                            <option key={`c-${cIdx}`} value={c.name}>
                              ★ {c.name} ({bodyParts[c.part]?.label || c.part})
                            </option>
                          ))}
                        </optgroup>
                      )}
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
                const lastRecord = workoutHistory.find((w) => w.menu_name === menuName && w.workout_type === 'gym');
                if (lastRecord) {
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        if (lastRecord.weight !== undefined && lastRecord.weight !== null) setWeight(lastRecord.weight);
                        if (lastRecord.reps) setReps(lastRecord.reps);
                        if (lastRecord.sets) setSets(lastRecord.sets);
                        setMessage({ type: 'success', text: `前回の記録（${lastRecord.weight}kg × ${lastRecord.reps}回 × ${lastRecord.sets}セット）を反映しました` });
                      }}
                      className="w-full py-2 px-3 bg-blue-50/90 hover:bg-blue-100/90 border border-blue-200 rounded-2xl flex items-center justify-between transition-all cursor-pointer shadow-xs group"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs">⏱️</span>
                        <span className="text-[11px] font-bold text-blue-900 truncate">
                          前回: {lastRecord.weight}kg × {lastRecord.reps}回 ({lastRecord.sets}セット)
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
                      <span className="text-sm">🏋️</span>
                      <span>重量</span>
                      <span className="text-[10px] text-slate-400 font-normal">(kg)</span>
                    </div>
                    <div className="text-xl font-black text-blue-600 mt-0.5 tabular-nums">
                      {weight} <span className="text-xs font-bold text-slate-500">kg</span>
                    </div>
                    <div className="flex items-center gap-1 mt-2 flex-wrap">
                      {[-5, -2.5, 2.5, 5].map((diff) => (
                        <button
                          key={diff}
                          type="button"
                          onClick={() => handleQuickWeightAdjust(diff)}
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-lg border transition-all cursor-pointer active:scale-95 ${
                            diff < 0
                              ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                              : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                          }`}
                        >
                          {diff > 0 ? `+${diff}` : `${diff}`}
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
                        items={weightIntOptions}
                        value={Math.floor(weight)}
                        onChange={(newInt) => setWeight(newInt + (weight % 1 >= 0.25 ? 0.5 : 0))}
                        width="w-13"
                        height="h-[102px]"
                        itemHeight={34}
                        fontSize="text-lg"
                        subFontSize="text-xs"
                      />
                      <span className="text-base font-bold text-slate-600 select-none pb-0.5">.</span>
                      <WheelPicker
                        items={weightDecOptions}
                        value={weight % 1 >= 0.25 ? 0.5 : 0}
                        onChange={(newDec) => setWeight(Math.floor(weight) + newDec)}
                        width="w-10"
                        height="h-[102px]"
                        itemHeight={34}
                        fontSize="text-lg"
                        subFontSize="text-xs"
                      />
                      <span className="text-[11px] font-bold text-slate-500 pl-1 select-none">kg</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="text-sm">🔄</span>
                      <span>回数</span>
                      <span className="text-[10px] text-slate-400 font-normal">(reps)</span>
                    </div>
                    <div className="text-xl font-black text-blue-600 mt-0.5 tabular-nums">
                      {reps} <span className="text-xs font-bold text-slate-500">回</span>
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      {[-5, -1, 1, 5].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setReps((prev) => Math.max(1, Math.min(50, prev + d)))}
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
                        onChange={setReps}
                        width="w-16"
                        height="h-[102px]"
                        itemHeight={34}
                        fontSize="text-lg"
                        subFontSize="text-xs"
                      />
                      <span className="text-[11px] font-bold text-slate-500 pl-1 select-none">回</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="text-sm">🔢</span>
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
                          onClick={() => setSets((prev) => Math.max(1, Math.min(15, prev + d)))}
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
                        items={setsOptions}
                        value={sets}
                        onChange={setSets}
                        width="w-16"
                        height="h-[102px]"
                        itemHeight={34}
                        fontSize="text-lg"
                        subFontSize="text-xs"
                      />
                      <span className="text-[11px] font-bold text-slate-500 pl-1 select-none">セット</span>
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
                placeholder="例: ラストセットまで余力あり"
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
                <span>ジム記録を保存する</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => startRestTimer(90)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-700 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <span>⏱️ セット間インターバルタイマー (90秒) を起動</span>
            </button>
          </form>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 mb-4 p-4 space-y-4">
        <div className="flex items-center justify-between pb-1">
          <div>
            <h2 className="text-sm font-bold text-slate-900">おすすめメニューを生成</h2>
            <p className="text-xs text-slate-500">目標と時間を選択すると、最適な種目を自動提案します</p>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200/60">
            ステップ選択
          </span>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-slate-900">ステップ1: 目指す目標を選択</span>
            {selectedGoal && (
              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/60">
                選択中: {activeGoalOpt?.label}
              </span>
            )}
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {goalOptions.map((opt) => {
              const isSelected = selectedGoal === opt.id;
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
            selectedGoal ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
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
            selectedGoal && selectedDuration ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="overflow-hidden min-h-0">
            {selectedGoal && selectedDuration && (
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
                    const alternatives = alternativeMap[item.name] || [
                      { name: 'ダンベルプレス', weight: 14, reps: 10, sets: 3, part: item.part, desc: 'ダンベル代用種目' },
                      { name: 'プッシュアップ', weight: 0, reps: 15, sets: 3, part: item.part, desc: '自重代用種目' }
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
                                {item.weight > 0 ? `${item.weight}kg × ` : ''}{item.reps}回 × {item.sets}set
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

                              <div className="bg-blue-50/70 rounded-xl p-2.5 border border-blue-100 flex items-center justify-between text-xs">
                                <span className="text-xs text-slate-800 font-medium">
                                  推奨負荷: <strong className="text-blue-700 font-bold">{item.weight > 0 ? `${item.weight}kg` : '自重'} × {item.reps}回 × {item.sets}セット</strong>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleSelectRoutineItem(item)}
                                  className="text-xs text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
                                >
                                  手動フォームに反映
                                </button>
                              </div>

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
                <h3 className="text-sm font-bold text-slate-900">ジム種目を選択</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPickerOpen(false)}
                className="w-7 h-7 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100 flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-4 gap-1 p-1.5 bg-slate-100 rounded-full mb-3 flex-shrink-0 border border-slate-200/70">
              {Object.keys(bodyParts).map((partKey) => (
                <button
                  key={partKey}
                  type="button"
                  onClick={() => setActivePart(partKey)}
                  className={`py-1.5 text-xs font-bold rounded-full transition-all ${
                    activePart === partKey
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {bodyParts[partKey].label}
                </button>
              ))}
            </div>

            <div className="overflow-y-auto space-y-2 flex-1 pr-1">
              {bodyParts[activePart].menus.map((m, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setMenuName(m);
                    setIsPickerOpen(false);
                  }}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    menuName === m
                      ? 'bg-blue-50/80 border-blue-500 shadow-xs'
                      : 'bg-white border-slate-200/80 hover:border-blue-400'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-900">{m}</span>
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
        <div className="fixed bottom-18 left-0 right-0 max-w-md mx-auto px-4 z-40">
          <div className={`p-4 rounded-3xl border shadow-2xl backdrop-blur-md transition-all ${
            timerFinished
              ? 'bg-emerald-600 text-white border-emerald-400 shadow-emerald-500/30'
              : 'bg-slate-900/95 text-white border-slate-700/80 shadow-black/30'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-base">{timerFinished ? '🔔' : '⏳'}</span>
                <span className="text-xs font-bold">
                  {timerFinished ? '休憩終了！次のセットへ' : 'セット間インターバル'}
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
                    {[60, 90, 120].map((sec) => (
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
                  onClick={() => startRestTimer(90)}
                  className="w-full py-2 bg-white text-emerald-800 font-bold rounded-2xl text-xs hover:bg-slate-100 shadow-sm transition-all cursor-pointer"
                >
                  次の休憩を計測 (90秒)
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
                  <h3 className="text-sm font-bold text-slate-900">新規カスタム種目を追加</h3>
                  <p className="text-[10px] text-slate-500">自分だけの種目を一覧に登録できます</p>
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
                  placeholder="例: インクラインダンベルフライ"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  対象部位 (プルダウン)
                </label>
                <select
                  value={newExerciseForm.part}
                  onChange={(e) => setNewExerciseForm({ ...newExerciseForm, part: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                >
                  {Object.keys(bodyParts).map((partKey) => (
                    <option key={partKey} value={partKey}>
                      {bodyParts[partKey].label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">重量 (kg)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={newExerciseForm.weight}
                    onChange={(e) => setNewExerciseForm({ ...newExerciseForm, weight: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-center font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">回数 (reps)</label>
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
