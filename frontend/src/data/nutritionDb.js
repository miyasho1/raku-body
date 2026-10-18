export const nutritionDatabase = [
  {
    id: 'chicken_breast_plate',
    name: '鶏胸肉とブロッコリー玄米定食',
    category: '高タンパク定食',
    serving_g: 450,
    calories: 520,
    protein: 42.0,
    fat: 8.5,
    carbs: 65.0,
    fiber: 7.2,
    salt: 1.8,
    radar_scores: { energy: 78, protein: 98, fat: 92, carbs: 75, fiber: 90 },
    advice: '極めて高タンパク・低脂質な筋トレ・減量に最も理想的な組み合わせです。ビタミンCと食物繊維も充分です。'
  },
  {
    id: 'salad_chicken',
    name: 'サラダチキン（プレーン）',
    category: 'コンビニ・軽食',
    serving_g: 110,
    calories: 115,
    protein: 24.1,
    fat: 1.2,
    carbs: 0.1,
    fiber: 0.0,
    salt: 1.1,
    radar_scores: { energy: 45, protein: 96, fat: 98, carbs: 10, fiber: 20 },
    advice: '超高純度のタンパク質補給に最適。炭水化物やおにぎり、野菜サラダと組み合わせるとさらにバランスが整います。'
  },
  {
    id: 'grilled_salmon_set',
    name: '鮭の塩焼き定食',
    category: '和定食',
    serving_g: 480,
    calories: 580,
    protein: 32.5,
    fat: 16.0,
    carbs: 72.0,
    fiber: 5.5,
    salt: 2.4,
    radar_scores: { energy: 82, protein: 88, fat: 80, carbs: 78, fiber: 75 },
    advice: '良質なオメガ3脂肪酸（EPA・DHA）とアスタキサンチンが豊富。抗酸化作用と筋肉の回復を促進します。'
  },
  {
    id: 'mackerel_miso_set',
    name: '鯖の味噌煮定食',
    category: '和定食',
    serving_g: 500,
    calories: 680,
    protein: 28.0,
    fat: 26.5,
    carbs: 78.0,
    fiber: 6.0,
    salt: 3.2,
    radar_scores: { energy: 88, protein: 82, fat: 68, carbs: 80, fiber: 78 },
    advice: '青魚特有の良質脂肪が豊富ですが、味噌だれで糖質・塩分が少し高め。汁を残すことで塩分を抑えられます。'
  },
  {
    id: 'ginger_pork_set',
    name: '豚の生姜焼き定食',
    category: '定食',
    serving_g: 520,
    calories: 720,
    protein: 26.5,
    fat: 32.0,
    carbs: 78.0,
    fiber: 4.8,
    salt: 3.5,
    radar_scores: { energy: 90, protein: 78, fat: 60, carbs: 82, fiber: 65 },
    advice: 'ビタミンB1が豊富で糖質代謝と疲労回復に効果的。添えられたキャベツをしっかり食べて食物繊維を補いましょう。'
  },
  {
    id: 'beef_bowl',
    name: '牛丼（並盛）',
    category: '丼物',
    serving_g: 380,
    calories: 650,
    protein: 20.0,
    fat: 23.0,
    carbs: 88.0,
    fiber: 2.8,
    salt: 2.7,
    radar_scores: { energy: 86, protein: 70, fat: 65, carbs: 88, fiber: 40 },
    advice: 'タンパク質とエネルギーの即効補給に適しています。生卵やサラダ、豚汁を追加すると栄養バランスが飛躍的に向上します。'
  },
  {
    id: 'oyakodon',
    name: '親子丼',
    category: '丼物',
    serving_g: 400,
    calories: 590,
    protein: 28.5,
    fat: 14.5,
    carbs: 82.0,
    fiber: 2.5,
    salt: 2.9,
    radar_scores: { energy: 80, protein: 85, fat: 82, carbs: 84, fiber: 42 },
    advice: '鶏肉と卵のダブルタンパク質で脂質も控えめな優秀メニュー。野菜サラダやおひたしを合わせると完璧です。'
  },
  {
    id: 'katsudon',
    name: 'カツ丼',
    category: '丼物',
    serving_g: 450,
    calories: 860,
    protein: 29.0,
    fat: 36.5,
    carbs: 98.0,
    fiber: 3.2,
    salt: 3.8,
    radar_scores: { energy: 95, protein: 80, fat: 45, carbs: 92, fiber: 45 },
    advice: '高カロリー・高脂質なのでハードな筋トレ日のエネルギー充填向き。前後の食事で脂質を抑えて調整しましょう。'
  },
  {
    id: 'zaru_soba',
    name: 'ざるそば（海苔付き）',
    category: '麺類',
    serving_g: 300,
    calories: 330,
    protein: 13.5,
    fat: 2.0,
    carbs: 64.0,
    fiber: 4.2,
    salt: 2.4,
    radar_scores: { energy: 60, protein: 62, fat: 95, carbs: 70, fiber: 68 },
    advice: '低GIでルチン（ポリフェノール）が豊富。タンパク質がやや控えめなので、ゆで卵や納豆、鶏肉のトッピングがおすすめです。'
  },
  {
    id: 'kake_udon',
    name: 'かけうどん',
    category: '麺類',
    serving_g: 350,
    calories: 320,
    protein: 9.0,
    fat: 1.5,
    carbs: 66.0,
    fiber: 2.4,
    salt: 4.2,
    radar_scores: { energy: 58, protein: 50, fat: 95, carbs: 72, fiber: 38 },
    advice: '消化吸収が早く運動前後の炭水化物補給に最適。おつゆの塩分が高いので飲み干さず残すのがポイントです。'
  },
  {
    id: 'shoyu_ramen',
    name: '醤油ラーメン',
    category: '麺類',
    serving_g: 500,
    calories: 520,
    protein: 22.0,
    fat: 18.0,
    carbs: 66.0,
    fiber: 3.5,
    salt: 5.8,
    radar_scores: { energy: 75, protein: 72, fat: 70, carbs: 75, fiber: 50 },
    advice: 'チャーシューからタンパク質は摂れますが塩分が多め。スープは半分以上残し、煮卵やメンマで栄養を補いましょう。'
  },
  {
    id: 'tonkotsu_ramen',
    name: '豚骨ラーメン',
    category: '麺類',
    serving_g: 520,
    calories: 680,
    protein: 26.0,
    fat: 32.0,
    carbs: 70.0,
    fiber: 3.2,
    salt: 6.2,
    radar_scores: { energy: 88, protein: 76, fat: 50, carbs: 78, fiber: 45 },
    advice: '背脂が多く脂質と塩分が高水準。替え玉を控え、次回食事で温野菜やフルーツを摂ってカリウムを補給しましょう。'
  },
  {
    id: 'pork_curry',
    name: 'カレーライス（ポーク）',
    category: '洋食・ご飯',
    serving_g: 480,
    calories: 750,
    protein: 18.5,
    fat: 25.0,
    carbs: 108.0,
    fiber: 5.2,
    salt: 3.6,
    radar_scores: { energy: 92, protein: 65, fat: 62, carbs: 95, fiber: 68 },
    advice: 'スパイスによる代謝促進効果があります。ご飯の量を少し調整し、ゆで卵やチキンカツ以外のトッピングでPを高めましょう。'
  },
  {
    id: 'oatmeal_protein',
    name: 'オートミール＆プロテインボウル',
    category: '朝食・軽食',
    serving_g: 300,
    calories: 340,
    protein: 28.5,
    fat: 5.2,
    carbs: 44.0,
    fiber: 6.8,
    salt: 0.6,
    radar_scores: { energy: 65, protein: 94, fat: 90, carbs: 68, fiber: 92 },
    advice: 'βグルカン豊富なオートミールとホエイの理想的コンビネーション。血糖値の上昇を緩やかにし腹持ちも抜群です。'
  },
  {
    id: 'pork_shabu_salad',
    name: '豆腐と豚しゃぶサラダ',
    category: '高タンパク低糖質',
    serving_g: 320,
    calories: 380,
    protein: 26.0,
    fat: 19.5,
    carbs: 14.0,
    fiber: 5.6,
    salt: 1.8,
    radar_scores: { energy: 62, protein: 88, fat: 72, carbs: 40, fiber: 85 },
    advice: '糖質を抑えつつ植物性＋動物性のタンパク質をダブル補給。ノンオイルまたはポン酢ドレッシングがベストです。'
  },
  {
    id: 'natto_rice_set',
    name: '納豆ご飯と豆腐の味噌汁',
    category: '朝食・和食',
    serving_g: 350,
    calories: 420,
    protein: 16.5,
    fat: 6.8,
    carbs: 72.0,
    fiber: 5.4,
    salt: 2.2,
    radar_scores: { energy: 70, protein: 70, fat: 88, carbs: 78, fiber: 82 },
    advice: '発酵食品のナットウキナーゼとイソフラボンで腸内環境と血管をサポート。卵を落とすとPがさらに強化されます。'
  },
  {
    id: 'salmon_onigiri',
    name: 'おにぎり（鮭）',
    category: 'コンビニ・軽食',
    serving_g: 110,
    calories: 180,
    protein: 4.8,
    fat: 1.0,
    carbs: 38.0,
    fiber: 1.2,
    salt: 1.1,
    radar_scores: { energy: 48, protein: 42, fat: 96, carbs: 65, fiber: 30 },
    advice: 'クリーンな炭水化物補給。運動前のエネルギーチャージや、プロテイン飲料・ゆで卵とセットで摂るのがおすすめです。'
  },
  {
    id: 'tuna_mayo_onigiri',
    name: 'おにぎり（ツナマヨ）',
    category: 'コンビニ・軽食',
    serving_g: 115,
    calories: 230,
    protein: 4.2,
    fat: 8.5,
    carbs: 35.0,
    fiber: 1.0,
    salt: 1.2,
    radar_scores: { energy: 55, protein: 40, fat: 78, carbs: 62, fiber: 28 },
    advice: 'マヨネーズによる脂質があるため鮭や昆布よりカロリー高め。活動量の多い日の手軽な補給に適しています。'
  },
  {
    id: 'ume_onigiri',
    name: 'おにぎり（梅干し）',
    category: 'コンビニ・軽食',
    serving_g: 105,
    calories: 165,
    protein: 2.8,
    fat: 0.5,
    carbs: 37.5,
    fiber: 1.1,
    salt: 1.6,
    radar_scores: { energy: 45, protein: 30, fat: 98, carbs: 64, fiber: 30 },
    advice: 'クエン酸が豊富で疲労回復をアシスト。超低脂質なので減量中の炭水化物摂取に非常に適しています。'
  },
  {
    id: 'makunouchi_bento',
    name: '幕の内弁当',
    category: '弁当',
    serving_g: 450,
    calories: 720,
    protein: 24.0,
    fat: 22.0,
    carbs: 102.0,
    fiber: 4.5,
    salt: 3.8,
    radar_scores: { energy: 88, protein: 75, fat: 70, carbs: 88, fiber: 68 },
    advice: '魚・肉・煮物がバランスよく入った王道弁当。揚げ物が入っている場合は先に野菜から食べることで血糖値の上昇を抑えられます。'
  },
  {
    id: 'karaage_bento',
    name: 'から揚げ弁当',
    category: '弁当',
    serving_g: 480,
    calories: 850,
    protein: 32.0,
    fat: 38.0,
    carbs: 92.0,
    fiber: 3.0,
    salt: 4.2,
    radar_scores: { energy: 95, protein: 84, fat: 42, carbs: 86, fiber: 45 },
    advice: '鶏肉からタンパク質はしっかり摂れますが、衣の油で脂質が高め。レモンを絞って酸化を抑え、野菜ジュース等を添えましょう。'
  },
  {
    id: 'beef_steak_set',
    name: '牛赤身肉ステーキ定食',
    category: '定食',
    serving_g: 450,
    calories: 640,
    protein: 38.5,
    fat: 22.0,
    carbs: 68.0,
    fiber: 4.0,
    salt: 2.6,
    radar_scores: { energy: 84, protein: 96, fat: 72, carbs: 75, fiber: 62 },
    advice: 'クレアチンとヘム鉄が豊富な赤身肉は筋力アップと代謝向上に最強の食材。脂身を残すとさらにスマートです。'
  },
  {
    id: 'sashimi_set',
    name: '刺身定食（マグロ・白身）',
    category: '和定食',
    serving_g: 420,
    calories: 480,
    protein: 35.0,
    fat: 6.5,
    carbs: 68.0,
    fiber: 3.8,
    salt: 2.1,
    radar_scores: { energy: 72, protein: 95, fat: 92, carbs: 74, fiber: 60 },
    advice: '加熱調理油を使わないため極めてクリーン。高純度タンパク質と必須脂肪酸を効率よくチャージできます。'
  },
  {
    id: 'yakitori_tare',
    name: '焼き鳥盛り合わせ（タレ5本）',
    category: '居酒屋・外食',
    serving_g: 220,
    calories: 410,
    protein: 36.0,
    fat: 16.0,
    carbs: 18.0,
    fiber: 0.5,
    salt: 2.8,
    radar_scores: { energy: 68, protein: 92, fat: 75, carbs: 45, fiber: 20 },
    advice: 'もも・レバー・むね肉など良質タンパク源の宝庫。甘辛いタレに糖質が含まれるため、塩焼きと組み合わせるとより低糖質になります。'
  },
  {
    id: 'yakitori_shio',
    name: '焼き鳥盛り合わせ（塩5本）',
    category: '居酒屋・外食',
    serving_g: 200,
    calories: 350,
    protein: 38.0,
    fat: 15.0,
    carbs: 1.5,
    fiber: 0.2,
    salt: 2.2,
    radar_scores: { energy: 60, protein: 96, fat: 80, carbs: 15, fiber: 15 },
    advice: '糖質ほぼゼロでタンパク質38gの圧倒的マクロバランス。お酒のおつまみや夜遅い食事でも安心です。'
  },
  {
    id: 'tonjiru_set',
    name: '豚汁定食（ご飯普通盛）',
    category: '和定食',
    serving_g: 460,
    calories: 560,
    protein: 22.0,
    fat: 18.5,
    carbs: 74.0,
    fiber: 6.8,
    salt: 3.4,
    radar_scores: { energy: 78, protein: 74, fat: 76, carbs: 78, fiber: 88 },
    advice: '根菜と豚肉の栄養が溶け込んだ優秀スープ。食物繊維が豊富で満腹感が高く、減量期にも重宝します。'
  },
  {
    id: 'mabo_tofu_set',
    name: '麻婆豆腐定食',
    category: '中華定食',
    serving_g: 500,
    calories: 710,
    protein: 25.0,
    fat: 32.0,
    carbs: 78.0,
    fiber: 4.2,
    salt: 4.0,
    radar_scores: { energy: 88, protein: 76, fat: 58, carbs: 80, fiber: 62 },
    advice: '大豆イソフラボンと唐辛子カプサイシンの発汗効果。油の量が多めなのでご飯のおかわりは控えめに。'
  },
  {
    id: 'hoikoro_set',
    name: '回鍋肉定食',
    category: '中華定食',
    serving_g: 510,
    calories: 760,
    protein: 22.5,
    fat: 38.0,
    carbs: 80.0,
    fiber: 5.5,
    salt: 3.6,
    radar_scores: { energy: 90, protein: 72, fat: 52, carbs: 82, fiber: 75 },
    advice: 'たっぷりのキャベツと豚バラ肉。キャベツのビタミンU（キャベジン）で胃腸を保護しつつスタミナがつきます。'
  },
  {
    id: 'gyoza_set',
    name: '餃子定食（6個）',
    category: '中華定食',
    serving_g: 450,
    calories: 680,
    protein: 21.0,
    fat: 24.0,
    carbs: 92.0,
    fiber: 3.8,
    salt: 3.2,
    radar_scores: { energy: 86, protein: 72, fat: 68, carbs: 88, fiber: 58 },
    advice: '皮（糖質）・餡（肉と野菜）のバランスが良い一品。タレにお酢と胡椒を多めに使うと減塩になります。'
  },
  {
    id: 'yasai_itame_set',
    name: '野菜炒め定食',
    category: '定食',
    serving_g: 460,
    calories: 510,
    protein: 18.5,
    fat: 19.0,
    carbs: 65.0,
    fiber: 7.5,
    salt: 2.8,
    radar_scores: { energy: 74, protein: 68, fat: 74, carbs: 72, fiber: 92 },
    advice: '1日に必要な野菜の半分以上をカバー。豚肉のタンパク質も摂れてヘルシーかつ満腹度が高い定食です。'
  },
  {
    id: 'hamburg_set',
    name: 'ハンバーグ定食（デミグラス）',
    category: '洋食定食',
    serving_g: 480,
    calories: 780,
    protein: 28.0,
    fat: 36.0,
    carbs: 84.0,
    fiber: 4.2,
    salt: 3.5,
    radar_scores: { energy: 90, protein: 80, fat: 55, carbs: 84, fiber: 60 },
    advice: '挽肉によるジューシーな旨味とタンパク質。和風おろしソースを選ぶと脂質とカロリーを約15%カット可能です。'
  },
  {
    id: 'omurice',
    name: 'オムライス',
    category: '洋食',
    serving_g: 420,
    calories: 690,
    protein: 19.5,
    fat: 24.0,
    carbs: 96.0,
    fiber: 2.6,
    salt: 3.2,
    radar_scores: { energy: 88, protein: 68, fat: 66, carbs: 92, fiber: 42 },
    advice: '卵による良質タンパク質とチキンライスの炭水化物。サラダをプラスして食物繊維を補うのがコツです。'
  },
  {
    id: 'carbonara',
    name: 'カルボナーラパスタ',
    category: 'パスタ',
    serving_g: 380,
    calories: 740,
    protein: 24.0,
    fat: 34.0,
    carbs: 82.0,
    fiber: 3.0,
    salt: 3.4,
    radar_scores: { energy: 90, protein: 75, fat: 55, carbs: 84, fiber: 45 },
    advice: 'チーズと卵、ベーコンの濃厚パスタ。運動後の筋グリコーゲン回復に向きますが、脂質は高めなので夜遅い時間は控えめに。'
  },
  {
    id: 'tomato_mozzarella_pasta',
    name: 'トマトとモッツァレラのパスタ',
    category: 'パスタ',
    serving_g: 360,
    calories: 580,
    protein: 20.0,
    fat: 18.0,
    carbs: 82.0,
    fiber: 4.5,
    salt: 2.8,
    radar_scores: { energy: 80, protein: 72, fat: 78, carbs: 82, fiber: 68 },
    advice: 'リコピンの強い抗酸化作用とモッツァレラのタンパク質。カルボナーラよりも脂質が大幅に抑えられてヘルシーです。'
  },
  {
    id: 'peperoncino',
    name: 'ペペロンチーノ',
    category: 'パスタ',
    serving_g: 320,
    calories: 510,
    protein: 13.0,
    fat: 17.5,
    carbs: 74.0,
    fiber: 3.2,
    salt: 2.6,
    radar_scores: { energy: 75, protein: 55, fat: 76, carbs: 80, fiber: 50 },
    advice: 'オリーブオイルのオレイン酸とニンニクの滋養強壮。タンパク質が不足しやすいのでチキンやシーフード追加が理想です。'
  },
  {
    id: 'margherita_pizza',
    name: 'マルゲリータピザ（1/2枚）',
    category: 'ピザ',
    serving_g: 220,
    calories: 480,
    protein: 18.0,
    fat: 16.0,
    carbs: 64.0,
    fiber: 3.5,
    salt: 2.2,
    radar_scores: { energy: 76, protein: 68, fat: 76, carbs: 74, fiber: 55 },
    advice: 'シンプルな具材でピザの中では比較的ヘルシー。サラダと一緒にゆっくり噛んで食べると満足度が高まります。'
  },
  {
    id: 'hamburger',
    name: 'ハンバーガー（ファストフード）',
    category: 'ファストフード',
    serving_g: 135,
    calories: 380,
    protein: 16.0,
    fat: 17.0,
    carbs: 40.0,
    fiber: 2.0,
    salt: 2.2,
    radar_scores: { energy: 65, protein: 65, fat: 70, carbs: 62, fiber: 35 },
    advice: '牛パティからタンパク質は確保可能。ポテトやシェイクではなく黒烏龍茶やサラダと組み合わせるのがスマートな選択です。'
  },
  {
    id: 'cheeseburger',
    name: 'チーズバーガー',
    category: 'ファストフード',
    serving_g: 145,
    calories: 440,
    protein: 20.0,
    fat: 22.0,
    carbs: 41.0,
    fiber: 2.0,
    salt: 2.7,
    radar_scores: { energy: 72, protein: 74, fat: 60, carbs: 64, fiber: 35 },
    advice: 'チーズ追加でタンパク質が20gまで上昇。脂質と塩分が上がりますが、PFCバランス自体はファストフードの中では悪くありません。'
  },
  {
    id: 'fried_chicken',
    name: 'フライドチキン（1ピース）',
    category: 'ファストフード・軽食',
    serving_g: 110,
    calories: 260,
    protein: 16.5,
    fat: 17.5,
    carbs: 9.5,
    fiber: 0.5,
    salt: 1.6,
    radar_scores: { energy: 58, protein: 72, fat: 60, carbs: 35, fiber: 15 },
    advice: '皮と衣に油が集中しています。筋肥大目的のタンパク質補給には優秀ですが、減量中は皮を少し外すとカロリー半減できます。'
  },
  {
    id: 'boiled_eggs',
    name: 'ゆで卵（2個）',
    category: '完全栄養食・間食',
    serving_g: 110,
    calories: 145,
    protein: 12.8,
    fat: 10.2,
    carbs: 0.6,
    fiber: 0.0,
    salt: 0.6,
    radar_scores: { energy: 50, protein: 84, fat: 75, carbs: 10, fiber: 10 },
    advice: 'アミノ酸スコア100の完全栄養食。コリンやビタミンDも豊富で、筋合成のスイッチを入れる手軽な間食として最高です。'
  },
  {
    id: 'protein_bar',
    name: 'プロテインバー（チョコ）',
    category: 'サプリ・間食',
    serving_g: 45,
    calories: 200,
    protein: 15.0,
    fat: 8.5,
    carbs: 15.0,
    fiber: 3.5,
    salt: 0.4,
    radar_scores: { energy: 52, protein: 85, fat: 78, carbs: 45, fiber: 65 },
    advice: '持ち運びやすく外出先でのタンパク質枯渇を防ぎます。お菓子代わりに活用して甘いもの欲を満たすのに有効です。'
  },
  {
    id: 'greek_yogurt',
    name: 'ギリシャヨーグルト（プレーン無糖）',
    category: '乳製品・間食',
    serving_g: 100,
    calories: 70,
    protein: 10.5,
    fat: 0.2,
    carbs: 4.5,
    fiber: 0.0,
    salt: 0.1,
    radar_scores: { energy: 35, protein: 86, fat: 98, carbs: 25, fiber: 10 },
    advice: '濃縮されたカゼインプロテインと乳酸菌。就寝前や小腹が空いた時のヘルシーなデザートとして最適です。'
  },
  {
    id: 'caesar_salad',
    name: 'シーザーサラダ',
    category: 'サラダ',
    serving_g: 180,
    calories: 240,
    protein: 6.5,
    fat: 20.0,
    carbs: 7.5,
    fiber: 3.8,
    salt: 1.5,
    radar_scores: { energy: 52, protein: 45, fat: 58, carbs: 30, fiber: 75 },
    advice: 'クルトンとチーズ、クリーミードレッシングで野菜ながら意外と高脂質。ドレッシングを別添えにしてかける量を調整しましょう。'
  },
  {
    id: 'seaweed_salad',
    name: '和風海藻サラダ',
    category: 'サラダ',
    serving_g: 160,
    calories: 95,
    protein: 3.2,
    fat: 3.5,
    carbs: 12.0,
    fiber: 5.2,
    salt: 1.8,
    radar_scores: { energy: 35, protein: 35, fat: 90, carbs: 40, fiber: 95 },
    advice: '水溶性食物繊維（フコイダン）とミネラルが凝縮。食事の最初に食べることで血糖値スパイクを強力に防止します。'
  },
  {
    id: 'mix_sandwich',
    name: 'ミックスサンドイッチ',
    category: '軽食・パン',
    serving_g: 160,
    calories: 310,
    protein: 12.0,
    fat: 14.0,
    carbs: 32.0,
    fiber: 2.8,
    salt: 1.9,
    radar_scores: { energy: 62, protein: 65, fat: 72, carbs: 60, fiber: 50 },
    advice: 'ハム・卵・野菜のまとまりの良い軽食。時間のない朝や運動前の手軽な補給に適しています。'
  },
  {
    id: 'egg_benedict',
    name: 'エッグベネディクト',
    category: 'カフェ・洋食',
    serving_g: 260,
    calories: 560,
    protein: 18.0,
    fat: 32.0,
    carbs: 48.0,
    fiber: 2.0,
    salt: 2.6,
    radar_scores: { energy: 78, protein: 68, fat: 55, carbs: 70, fiber: 35 },
    advice: 'ポーチドエッグとオランデーズソース。卵の栄養は高いですがバターソースで脂質が多めなので特別な日の朝食に。'
  },
  {
    id: 'avocado_toast',
    name: 'アボカドトースト',
    category: 'カフェ・軽食',
    serving_g: 220,
    calories: 380,
    protein: 9.5,
    fat: 21.0,
    carbs: 38.0,
    fiber: 7.0,
    salt: 1.4,
    radar_scores: { energy: 65, protein: 55, fat: 70, carbs: 62, fiber: 90 },
    advice: '食べる美容液とも呼ばれる不飽和脂肪酸と食物繊維。ゆで卵やスモークサーモンを乗せるとPがアップします。'
  },
  {
    id: 'kaisen_don',
    name: '特選海鮮丼',
    category: '丼物・和食',
    serving_g: 450,
    calories: 620,
    protein: 36.0,
    fat: 11.0,
    carbs: 88.0,
    fiber: 3.0,
    salt: 2.6,
    radar_scores: { energy: 84, protein: 96, fat: 86, carbs: 85, fiber: 50 },
    advice: 'マグロ、サーモン、白身魚の贅沢な高タンパク丼。お醤油を小皿で少しずつつけて食べることで減塩を意識しましょう。'
  },
  {
    id: 'tendon',
    name: '海老天丼',
    category: '丼物・和食',
    serving_g: 440,
    calories: 790,
    protein: 18.0,
    fat: 28.0,
    carbs: 112.0,
    fiber: 3.5,
    salt: 3.6,
    radar_scores: { energy: 92, protein: 65, fat: 60, carbs: 96, fiber: 48 },
    advice: '天ぷらの衣がタレを吸って糖質・脂質ともに高め。お味噌汁と野菜小鉢を添えて栄養バランスを補正しましょう。'
  },
  {
    id: 'unadon',
    name: '鰻丼（うな重並）',
    category: '丼物・和食',
    serving_g: 420,
    calories: 710,
    protein: 28.0,
    fat: 24.0,
    carbs: 92.0,
    fiber: 2.8,
    salt: 3.2,
    radar_scores: { energy: 88, protein: 84, fat: 72, carbs: 88, fiber: 45 },
    advice: 'ビタミンA・B群・EやDHA・EPAが凝縮されたスタミナ食。山椒を効かせると消化吸収がより促進されます。'
  },
  {
    id: 'sukiyaki_set',
    name: 'すき焼き定食',
    category: '和定食',
    serving_g: 500,
    calories: 820,
    protein: 34.0,
    fat: 32.0,
    carbs: 95.0,
    fiber: 5.2,
    salt: 4.4,
    radar_scores: { energy: 94, protein: 90, fat: 60, carbs: 90, fiber: 72 },
    advice: '牛肉、豆腐、焼きねぎ、しらたき。割下の甘辛さで糖質・塩分が高くなりやすいので、生卵にくぐらせてまろやかにいただきましょう。'
  },
  {
    id: 'chicken_nanban_set',
    name: 'チキン南蛮定食',
    category: '定食',
    serving_g: 520,
    calories: 890,
    protein: 35.0,
    fat: 44.0,
    carbs: 86.0,
    fiber: 4.0,
    salt: 4.0,
    radar_scores: { energy: 96, protein: 88, fat: 40, carbs: 86, fiber: 55 },
    advice: '甘酢とタルタルソースが魅力の宮崎名物。高タンパクですが揚げ油＋マヨネーズで脂質が限界突破するため、チートミール向きです。'
  }
];

export function findMatchingFood(query) {
  if (!query || typeof query !== 'string') return null;
  const q = query.trim().toLowerCase();

  const exact = nutritionDatabase.find(item => item.name.toLowerCase() === q);
  if (exact) return exact;

  const partial = nutritionDatabase.find(item => {
    const n = item.name.toLowerCase();
    return n.includes(q) || q.includes(n);
  });
  if (partial) return partial;

  const keywords = q.split(/[\s・,、]+/);
  let bestMatch = null;
  let maxMatches = 0;

  for (const item of nutritionDatabase) {
    const itemName = item.name.toLowerCase();
    const itemCat = item.category.toLowerCase();
    let matches = 0;
    for (const kw of keywords) {
      if (kw.length >= 2 && (itemName.includes(kw) || itemCat.includes(kw))) {
        matches++;
      }
    }
    if (matches > maxMatches) {
      maxMatches = matches;
      bestMatch = item;
    }
  }

  return bestMatch || nutritionDatabase[0];
}

export function calculateScaledNutrition(item, targetCalories) {
  if (!item) return null;
  const baseCal = item.calories || 500;
  const ratio = targetCalories ? targetCalories / baseCal : 1;

  const cal = Math.round(baseCal * ratio);
  const p = Number((item.protein * ratio).toFixed(1));
  const f = Number((item.fat * ratio).toFixed(1));
  const c = Number((item.carbs * ratio).toFixed(1));
  const fiber = Number((item.fiber * ratio).toFixed(1));
  const salt = Number((item.salt * ratio).toFixed(1));

  const pScore = Math.min(100, Math.round((p / 30) * 100));
  const fScore = Math.max(30, Math.min(100, Math.round(100 - Math.abs(f - 15) * 2.5)));
  const cScore = Math.min(100, Math.round((c / 75) * 100));
  const calScore = Math.max(40, Math.min(100, Math.round(100 - Math.abs(cal - 600) * 0.08)));
  const fiberScore = Math.min(100, Math.round((fiber / 7) * 100));

  return {
    ...item,
    calories: cal,
    protein: p,
    fat: f,
    carbs: c,
    fiber: fiber,
    salt: salt,
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
}
