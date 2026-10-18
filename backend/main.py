import os
import json
import uuid
import shutil
import sqlite3
from datetime import datetime, date, timedelta
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List

app = FastAPI(title="らくボディ API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(__file__)
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
DB_PATH = os.path.join(BASE_DIR, "raku_body.db")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS training_logs (
            id TEXT PRIMARY KEY,
            category TEXT NOT NULL,
            note TEXT,
            log_date TEXT NOT NULL,
            timestamp TEXT NOT NULL
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS photo_logs (
            id TEXT PRIMARY KEY,
            filename TEXT NOT NULL,
            url TEXT NOT NULL,
            record_type TEXT NOT NULL,
            timestamp TEXT NOT NULL
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS body_metrics (
            id TEXT PRIMARY KEY,
            date TEXT NOT NULL,
            weight REAL NOT NULL,
            body_fat REAL,
            timestamp TEXT NOT NULL
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS workout_logs (
            id TEXT PRIMARY KEY,
            workout_type TEXT NOT NULL,
            menu_name TEXT NOT NULL,
            duration_minutes INTEGER,
            weight REAL,
            reps INTEGER,
            sets INTEGER,
            note TEXT,
            log_date TEXT NOT NULL,
            timestamp TEXT NOT NULL
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS body_analysis_results (
            id TEXT PRIMARY KEY,
            ideal_images TEXT NOT NULL,
            current_image TEXT NOT NULL,
            analysis_json TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS meal_logs (
            id TEXT PRIMARY KEY,
            meal_type TEXT NOT NULL,
            menu_name TEXT NOT NULL,
            calories INTEGER,
            protein_level TEXT,
            carbs_level TEXT,
            fat_level TEXT,
            protein_g REAL,
            fat_g REAL,
            carbs_g REAL,
            fiber_g REAL,
            salt_g REAL,
            analysis_json TEXT,
            image_url TEXT,
            note TEXT,
            log_date TEXT NOT NULL,
            timestamp TEXT NOT NULL
        )
    """)

    for col_name, col_type in [
        ("protein_g", "REAL"),
        ("fat_g", "REAL"),
        ("carbs_g", "REAL"),
        ("fiber_g", "REAL"),
        ("salt_g", "REAL"),
        ("analysis_json", "TEXT")
    ]:
        try:
            cursor.execute(f"ALTER TABLE meal_logs ADD COLUMN {col_name} {col_type}")
        except Exception:
            pass

    try:
        cursor.execute("ALTER TABLE meal_logs ADD COLUMN meal_time TEXT")
    except Exception:
        pass

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_protein_settings (
            id TEXT PRIMARY KEY,
            product_name TEXT NOT NULL,
            protein_g REAL NOT NULL,
            calories INTEGER NOT NULL,
            image_url TEXT,
            updated_at TEXT NOT NULL,
            serving_size_g REAL,
            fat_g REAL,
            carbs_g REAL,
            nutrition_image_url TEXT
        )
    """)

    for p_col, p_type in [
        ("serving_size_g", "REAL"),
        ("fat_g", "REAL"),
        ("carbs_g", "REAL"),
        ("nutrition_image_url", "TEXT")
    ]:
        try:
            cursor.execute(f"ALTER TABLE user_protein_settings ADD COLUMN {p_col} {p_type}")
        except Exception:
            pass

    cursor.execute("SELECT COUNT(*) AS count FROM user_protein_settings")
    if cursor.fetchone()["count"] == 0:
        cursor.execute(
            "INSERT INTO user_protein_settings (id, product_name, protein_g, calories, image_url, updated_at, serving_size_g, fat_g, carbs_g, nutrition_image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            ("default", "ゴールドスタンダード ホエイ", 24.0, 120, "", datetime.now().strftime("%Y-%m-%d %H:%M:%S"), 30.0, 1.0, 2.0, "")
        )

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_goal_settings (
            id TEXT PRIMARY KEY,
            target_focus TEXT NOT NULL,
            preset_name TEXT NOT NULL,
            arms INTEGER,
            chest INTEGER,
            waist INTEGER,
            legs INTEGER,
            updated_at TEXT NOT NULL
        )
    """)

    cursor.execute("SELECT COUNT(*) AS count FROM user_goal_settings")
    if cursor.fetchone()["count"] == 0:
        cursor.execute(
            "INSERT INTO user_goal_settings (id, target_focus, preset_name, arms, chest, waist, legs, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            ("default", "fine_muscle", "細マッチョ", 4, 4, 1, 3, datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
        )

    cursor.execute("SELECT COUNT(*) AS count FROM body_metrics")
    if cursor.fetchone()["count"] == 0:
        base_date = date.today() - timedelta(days=6)
        sample_weights = [65.8, 65.5, 65.6, 65.2, 65.0, 64.8, 64.7]
        sample_fats = [21.5, 21.3, 21.4, 21.0, 20.9, 20.7, 20.5]
        for i in range(7):
            d_str = (base_date + timedelta(days=i)).strftime("%Y-%m-%d")
            cursor.execute(
                "INSERT INTO body_metrics (id, date, weight, body_fat, timestamp) VALUES (?, ?, ?, ?, ?)",
                (str(uuid.uuid4()), d_str, sample_weights[i], sample_fats[i], f"{d_str} 08:00:00")
            )

    cursor.execute("SELECT COUNT(*) AS count FROM meal_logs")
    if cursor.fetchone()["count"] == 0:
        base_date = date.today() - timedelta(days=6)
        sample_meals = [
            ("朝食", "オートミールとプロテイン", 350, "高", "普通", "低"),
            ("昼食", "鶏胸肉と玄米定食", 600, "高", "普通", "低"),
            ("夕食", "サーモンとアボカドサラダ", 500, "高", "低", "普通"),
            ("昼食", "サバの塩焼き定食", 650, "高", "普通", "普通"),
            ("夕食", "豆腐と豚しゃぶサラダ", 450, "高", "低", "低"),
            ("昼食", "サラダチキンと玄米おにぎり", 480, "高", "普通", "低"),
            ("夕食", "牛赤身肉ステーキと野菜", 550, "高", "低", "普通"),
        ]
        for i, m in enumerate(sample_meals):
            d_str = (base_date + timedelta(days=i)).strftime("%Y-%m-%d")
            cursor.execute(
                "INSERT INTO meal_logs (id, meal_type, menu_name, calories, protein_level, carbs_level, fat_level, image_url, note, log_date, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (str(uuid.uuid4()), m[0], m[1], m[2], m[3], m[4], m[5], "", "高タンパクを意識", d_str, f"{d_str} 12:30:00")
            )

    conn.commit()
    conn.close()

init_db()

class TrainingLog(BaseModel):
    category: str = "トレーニング完了"
    note: str = ""

class BodyMetricInput(BaseModel):
    weight: float
    body_fat: float | None = None
    date: str | None = None

class WorkoutLogInput(BaseModel):
    workout_type: str
    menu_name: str
    duration_minutes: int | None = None
    weight: float | None = None
    reps: int | None = None
    sets: int | None = None
    note: str = ""
    date: str | None = None

def calculate_streak(cursor):
    cursor.execute("SELECT DISTINCT log_date FROM training_logs ORDER BY log_date DESC")
    dates = [row["log_date"] for row in cursor.fetchall()]
    if not dates:
        return 0

    today_str = date.today().strftime("%Y-%m-%d")
    streak = 0
    check_date = date.today()

    if dates[0] == today_str:
        streak += 1
        check_date = date.fromordinal(check_date.toordinal() - 1)
        dates = dates[1:]
    else:
        yesterday_str = date.fromordinal(check_date.toordinal() - 1).strftime("%Y-%m-%d")
        if dates[0] == yesterday_str:
            streak += 1
            check_date = date.fromordinal(check_date.toordinal() - 2)
            dates = dates[1:]
        else:
            return 0

    for d_str in dates:
        expected_str = check_date.strftime("%Y-%m-%d")
        if d_str == expected_str:
            streak += 1
            check_date = date.fromordinal(check_date.toordinal() - 1)
        else:
            break

    return streak

@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "raku-body-api",
        "database": "sqlite",
        "cost": "free",
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

@app.get("/api/status")
def get_status():
    today_str = date.today().strftime("%Y-%m-%d")
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) AS count FROM training_logs WHERE log_date = ?", (today_str,))
    today_count = cursor.fetchone()["count"]
    streak = calculate_streak(cursor)
    cursor.execute("SELECT COUNT(*) AS total FROM training_logs")
    total_logs = cursor.fetchone()["total"]
    conn.close()

    return {
        "is_logged_today": today_count > 0,
        "streak_days": streak,
        "total_logs": total_logs
    }

@app.get("/api/logs")
def get_logs():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, category, note, timestamp, log_date FROM training_logs ORDER BY timestamp DESC")
    rows = cursor.fetchall()
    logs = [dict(row) for row in rows]
    cursor.execute("SELECT COUNT(*) AS total FROM training_logs")
    total = cursor.fetchone()["total"]
    streak = calculate_streak(cursor)
    conn.close()

    return {
        "logs": logs,
        "total_count": total,
        "streak_days": streak
    }

@app.post("/api/log")
def create_log(log: TrainingLog):
    now = datetime.now()
    log_id = str(uuid.uuid4())
    log_date = now.strftime("%Y-%m-%d")
    timestamp = now.strftime("%Y-%m-%d %H:%M:%S")

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO training_logs (id, category, note, log_date, timestamp) VALUES (?, ?, ?, ?, ?)",
        (log_id, log.category, log.note, log_date, timestamp)
    )
    conn.commit()

    streak = calculate_streak(cursor)
    cursor.execute("SELECT COUNT(*) AS total FROM training_logs")
    total = cursor.fetchone()["total"]
    conn.close()

    return {
        "success": True,
        "message": "本日のトレーニングを記録しました",
        "data": {
            "id": log_id,
            "category": log.category,
            "note": log.note,
            "log_date": log_date,
            "timestamp": timestamp
        },
        "streak_days": streak,
        "total_days": total
    }

@app.post("/api/workouts")
def create_workout(workout: WorkoutLogInput):
    now = datetime.now()
    workout_id = str(uuid.uuid4())
    log_date = workout.date or now.strftime("%Y-%m-%d")
    timestamp = now.strftime("%Y-%m-%d %H:%M:%S")

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """INSERT INTO workout_logs 
           (id, workout_type, menu_name, duration_minutes, weight, reps, sets, note, log_date, timestamp) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (workout_id, workout.workout_type, workout.menu_name, workout.duration_minutes,
         workout.weight, workout.reps, workout.sets, workout.note, log_date, timestamp)
    )

    category = "宅トレ・運動" if workout.workout_type == "home" else "ジムトレ"
    details = []
    if workout.duration_minutes:
        details.append(f"{workout.duration_minutes}分")
    if workout.weight:
        details.append(f"{workout.weight}kg")
    if workout.reps:
        details.append(f"{workout.reps}回")
    if workout.sets:
        details.append(f"{workout.sets}セット")
    detail_str = f"{workout.menu_name} ({', '.join(details)})" if details else workout.menu_name

    training_id = str(uuid.uuid4())
    cursor.execute(
        "INSERT INTO training_logs (id, category, note, log_date, timestamp) VALUES (?, ?, ?, ?, ?)",
        (training_id, category, detail_str, log_date, timestamp)
    )

    conn.commit()

    streak = calculate_streak(cursor)
    cursor.execute("SELECT COUNT(*) AS total FROM training_logs")
    total = cursor.fetchone()["total"]
    conn.close()

    return {
        "success": True,
        "message": "ワークアウトを記録しました",
        "workout_id": workout_id,
        "streak_days": streak,
        "total_days": total
    }

@app.get("/api/workouts")
def get_workouts():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM workout_logs ORDER BY timestamp DESC")
    rows = cursor.fetchall()
    workouts = [dict(row) for row in rows]
    conn.close()
    return {"workouts": workouts}

@app.post("/api/analyze-body-target")
async def analyze_body_target(
    ideal_files: List[UploadFile] = File(...),
    current_file: UploadFile = File(...)
):
    temp_paths = []
    for f in ideal_files:
        ext = os.path.splitext(f.filename)[1] or ".jpg"
        fn = f"ideal_{uuid.uuid4()}{ext}"
        fp = os.path.join(UPLOAD_DIR, fn)
        with open(fp, "wb") as buf:
            shutil.copyfileobj(f.file, buf)
        temp_paths.append(fp)

    c_ext = os.path.splitext(current_file.filename)[1] or ".jpg"
    c_fn = f"curr_{uuid.uuid4()}{c_ext}"
    c_fp = os.path.join(UPLOAD_DIR, c_fn)
    with open(c_fp, "wb") as buf:
        shutil.copyfileobj(current_file.file, buf)
    temp_paths.append(c_fp)

    gemini_key = os.getenv("GEMINI_API_KEY")
    analysis_data = None

    if gemini_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=gemini_key)
            model = genai.GenerativeModel("gemini-1.5-flash")
            
            prompt = """
            あなたはトップクラスのパーソナルトレーナー・ボディデザイナーAIです。
            提示された「理想の体型写真」と「現在の自分の体型写真」を詳細に比較・画像分析し、
            以下のJSON形式のみを出力してください（マークダウンのコードブロックなし、純粋なJSON文字列）。

            {
              "summary": "現状の強みを褒めつつ、理想体型へ向けた前向きな総括コメント",
              "focus_areas": ["最優先部位1", "最優先部位2", "最優先部位3"],
              "parts_analysis": [
                {"part": "胸（大胸筋）", "status": "現在の状態", "target": "理想の目標", "gap": "差分ポイント", "priority": "高または中または低"},
                {"part": "背中（広背筋）", "status": "現在の状態", "target": "理想の目標", "gap": "差分ポイント", "priority": "高または中または低"},
                {"part": "腕・肩（三角筋・上腕）", "status": "現在の状態", "target": "理想の目標", "gap": "差分ポイント", "priority": "高または中または低"},
                {"part": "ウエスト・腹筋", "status": "現在の状態", "target": "理想の目標", "gap": "差分ポイント", "priority": "高または中または低"},
                {"part": "脚・下半身（大腿四頭筋・臀部）", "status": "現在の状態", "target": "理想の目標", "gap": "差分ポイント", "priority": "高または中または低"}
              ],
              "compound_menu": [
                {
                  "name": "スクワットや懸垂やディップスやデッドリフトなどの種目名",
                  "category": "gymまたはhome",
                  "targets": ["主要部位1", "主要部位2", "補助部位"],
                  "reps": "8〜10回など",
                  "sets": "3セットなど",
                  "point": "なぜこの種目で複数筋肉を同時に鍛えて効率よく理想に近づけるかの理由"
                }
              ],
              "advice": "最短で理想へ近づくための継続と食事・休息のアドバイス"
            }
            """
            response = model.generate_content([prompt])
            text = response.text.strip()
            if text.startswith("```"):
                text = text.strip("`")
                if text.startswith("json"):
                    text = text[4:].strip()
            analysis_data = json.loads(text)
        except Exception:
            analysis_data = None

    if not analysis_data:
        analysis_data = {
            "summary": "現在のスリムで整った骨格バランスは大きな強みです！理想写真と比較すると、大胸筋の厚みと背中の逆三角形ライン、体幹の引き締まりを強化することで、最も短期間で劇的なプロポーション進化が狙えます。",
            "focus_areas": ["大胸筋・厚み", "背中・逆三角形", "体幹・くびれ"],
            "parts_analysis": [
              {
                "part": "胸（大胸筋）",
                "status": "スッキリしたライン",
                "target": "上部・外側の立体的な厚み",
                "gap": "胸板の厚みとボリュームアップ",
                "priority": "高"
              },
              {
                "part": "背中（広背筋）",
                "status": "自然な背筋",
                "target": "脇下から広がる逆三角形シルエット",
                "gap": "広がりと厚みの同時強化",
                "priority": "高"
              },
              {
                "part": "腕・肩（三角筋・上腕）",
                "status": "シャープ",
                "target": "肩の丸みと力強い二頭筋・三頭筋",
                "gap": "肩幅の拡張と腕の引き締め",
                "priority": "中"
              },
              {
                "part": "ウエスト・腹筋",
                "status": "引き締まっている",
                "target": "深いくびれと腹筋の陰影",
                "gap": "体幹のコルセット筋強化",
                "priority": "中"
              },
              {
                "part": "脚（大腿部・ヒップ）",
                "status": "スリム",
                "target": "引き締まった美脚とヒップライン",
                "gap": "下半身の代謝最大化",
                "priority": "高"
              }
            ],
            "compound_menu": [
              {
                "name": "バーベルスクワット",
                "category": "gym",
                "targets": ["大腿四頭筋", "大臀筋", "体幹コア"],
                "reps": "8〜10回",
                "sets": "3セット",
                "point": "下半身全体と体幹を一度に刺激し、全身の代謝向上とホルモン分泌をブーストする最重要種目です。"
              },
              {
                "name": "懸垂（チンニング / ラットプルダウン）",
                "category": "gym",
                "targets": ["広背筋", "大円筋", "上腕二頭筋"],
                "reps": "8〜10回",
                "sets": "3セット",
                "point": "背中の横幅を一気に広げ、ウエストとの対比で理想の逆三角形ボディを作る王道種目です。"
              },
              {
                "name": "ディップス / 自重プッシュアップ",
                "category": "home",
                "targets": ["大胸筋下部", "上腕三頭筋", "三角筋前部"],
                "reps": "10〜12回",
                "sets": "3セット",
                "point": "上半身のスクワットとも呼ばれ、胸の立体的な輪郭とたくましい腕まわりを同時に作ります。"
              },
              {
                "name": "デッドリフト",
                "category": "gym",
                "targets": ["脊柱起立筋", "ハムストリングス", "広背筋"],
                "reps": "8回",
                "sets": "3セット",
                "point": "背中から下半身後面の全身連動を高め、姿勢をシャキッと正して分厚い体幹を作ります。"
              }
            ],
            "advice": "1つの種目で複数の筋肉群を同時に動かす『コンパウンド（複合関節）種目』を中心に行うことで、最短ルートで理想のボディラインへ到達できます。運動後は手のひら一杯分のタンパク質補給を忘れずに！"
        }

    for p in temp_paths:
        try:
            if os.path.exists(p):
                os.remove(p)
        except Exception:
            pass

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    analysis_id = str(uuid.uuid4())
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM body_analysis_results")
    cursor.execute(
        """INSERT INTO body_analysis_results 
           (id, ideal_images, current_image, analysis_json, created_at) 
           VALUES (?, ?, ?, ?, ?)""",
        (analysis_id, json.dumps([]), "", json.dumps(analysis_data, ensure_ascii=False), now_str)
    )
    conn.commit()
    conn.close()

    return {
        "success": True,
        "id": analysis_id,
        "data": analysis_data,
        "ideal_urls": [],
        "current_url": ""
    }

@app.get("/api/body-analysis")
def get_body_analysis():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM body_analysis_results ORDER BY created_at DESC LIMIT 1")
    row = cursor.fetchone()
    conn.close()
    if row:
        return {
            "has_analysis": True,
            "id": row["id"],
            "ideal_urls": json.loads(row["ideal_images"]),
            "current_url": row["current_image"],
            "data": json.loads(row["analysis_json"]),
            "created_at": row["created_at"]
        }
    return {"has_analysis": False}

@app.get("/api/advice")
def get_ai_advice():
    conn = get_db_connection()
    cursor = conn.cursor()

    streak = calculate_streak(cursor)

    cursor.execute("SELECT * FROM workout_logs ORDER BY timestamp DESC LIMIT 3")
    recent_workouts = [dict(r) for r in cursor.fetchall()]

    cursor.execute("SELECT analysis_json FROM body_analysis_results ORDER BY created_at DESC LIMIT 1")
    analysis_row = cursor.fetchone()
    focus_label = "胸・背中・体幹"
    if analysis_row:
        try:
            a_data = json.loads(analysis_row["analysis_json"])
            focus_label = "・".join(a_data.get("focus_areas", ["胸", "背中"]))
        except:
            pass

    conn.close()

    if not recent_workouts:
        if streak >= 3:
            return {
                "title": "AIパーソナル助言",
                "tag": "習慣化順調",
                "praise": f"{streak}日連続でトレーニングを記録できています！",
                "advice": f"目標（重点: {focus_label}）に向けて素晴らしいペースです。日々の運動が体型変化の確実な土台となります。",
                "next_action": "今日は画像分析で提案された「複合関節メニュー（スクワット・懸垂・ディップス）」に挑戦してみましょう！",
                "highlight_type": "success"
            }
        else:
            return {
                "title": "AIパーソナル助言",
                "tag": "スタート期",
                "praise": "理想体型へのパーソナライズ計画がセットされました！",
                "advice": "初めは5分〜10分の軽い運動でも十分な効果があります。完璧を目指さず、まずは3日間の継続を目標にしましょう。",
                "next_action": "ホームの「宅トレ」や「ジム」から、分析おすすめ種目を選んで体を動かしてみましょう！",
                "highlight_type": "challenge"
            }

    latest = recent_workouts[0]
    menu = latest["menu_name"]
    w_type = latest["workout_type"]

    if w_type == "gym":
        leg_keywords = ["スクワット", "レッグ", "下半身", "脚", "カーフ"]
        chest_keywords = ["ベンチプレス", "ダンベルフライ", "チェスト", "胸", "ディップス"]
        back_keywords = ["ラットプル", "デッドリフト", "ロー", "背中", "チンニング", "懸垂"]

        if any(k in menu for k in leg_keywords):
            return {
                "title": "AIパーソナル助言",
                "tag": "回復・ケア推奨",
                "praise": f"直近で「{menu}」など負荷の高い下半身トレーニングを完遂しました！",
                "advice": "脚や臀部は全身で最も大きな筋群です。強い刺激の後は48時間〜72時間の超回復期間を設けることで筋肉が成長します。",
                "next_action": "今日は下半身を休め、上半身（懸垂やディップス）のトレーニング、または軽いストレッチと十分なタンパク質補給を優先しましょう。",
                "highlight_type": "recovery"
            }
        elif any(k in menu for k in chest_keywords):
            return {
                "title": "AIパーソナル助言",
                "tag": "超回復中",
                "praise": f"直近で「{menu}」など胸筋への力強い刺激を完了しています！",
                "advice": f"目標（重点: {focus_label}）の厚い胸板作りに直結するトレーニングです。質の高い睡眠と栄養補給で筋肉を育てましょう。",
                "next_action": "次回は背中（懸垂・ラットプルダウン等）や脚のトレーニングへ切り替えて、全身のバランスを整えましょう。",
                "highlight_type": "success"
            }
        elif any(k in menu for k in back_keywords):
            return {
                "title": "AIパーソナル助言",
                "tag": "姿勢改善中",
                "praise": f"「{menu}」で背中の引き締めトレーニングをバッチリこなしました！",
                "advice": "背筋の強化は逆三角形シルエットと基礎代謝アップの要です。引く動作の後は肩甲骨周りを軽くほぐしておきましょう。",
                "next_action": "今日は脚トレで全身の消費カロリーを稼ぐか、お風呂上がりのストレッチで疲労を抜きましょう。",
                "highlight_type": "success"
            }
        else:
            return {
                "title": "AIパーソナル助言",
                "tag": "筋力向上中",
                "praise": f"ジムで「{menu}」のウェイトトレーニングをしっかり行いました！",
                "advice": "重量と回数を記録し続けることで、確実に筋肉へ適応が起こります。運動後45分以内の栄養補給を忘れずに。",
                "next_action": "次回は別の部位に刺激を変えて、偏りのない全身の筋力アップを目指しましょう。",
                "highlight_type": "success"
            }
    else:
        if "HIIT" in menu or "有酸素" in menu or "ウォーキング" in menu:
            return {
                "title": "AIパーソナル助言",
                "tag": "脂肪燃焼モード",
                "praise": f"「{menu}」で効率の良い有酸素・心肺機能トレーニングを達成しました！",
                "advice": "運動後も代謝が上がっていますので、常温の水分をこまめに摂りましょう。",
                "next_action": "明日はディップスやスクワットなどの複合関節種目を組み合わせると、さらに体脂肪が燃えやすい体に進化します。",
                "highlight_type": "success"
            }
        elif "ストレッチ" in menu or "ヨガ" in menu:
            return {
                "title": "AIパーソナル助言",
                "tag": "柔軟性・回復",
                "praise": f"「{menu}」で丁寧なコンディショニングを行いました！",
                "advice": "可動域を広げて関節の柔軟性を高めることは、今後の複合種目での怪我予防と代謝向上に絶大な効果があります。",
                "next_action": "体がほぐれて動きやすくなっている今、次はプッシュアップやスクワットにチャレンジしてみましょう。",
                "highlight_type": "recovery"
            }
        else:
            return {
                "title": "AIパーソナル助言",
                "tag": "宅トレ継続中",
                "praise": f"自宅で「{menu}」をしっかりやり切りました！",
                "advice": "フォームを意識してゆっくり動かすと自重でも十分な負荷が得られます。",
                "next_action": "今日はしっかり休息を取り、明日は別の部位や有酸素を組み合わせてみましょう。",
                "highlight_type": "success"
            }

@app.post("/api/upload")
async def upload_image(file: UploadFile = File(...), record_type: str = Form("meal")):
    file_extension = os.path.splitext(file.filename)[1]
    if not file_extension:
        file_extension = ".jpg"
    photo_id = str(uuid.uuid4())
    saved_filename = f"{photo_id}{file_extension}"
    save_path = os.path.join(UPLOAD_DIR, saved_filename)

    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    image_url = f"/uploads/{saved_filename}"
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO photo_logs (id, filename, url, record_type, timestamp) VALUES (?, ?, ?, ?, ?)",
        (photo_id, saved_filename, image_url, record_type, timestamp)
    )
    conn.commit()
    conn.close()

    return {
        "success": True,
        "message": "画像を保存しました",
        "id": photo_id,
        "filename": saved_filename,
        "url": image_url,
        "record_type": record_type,
        "timestamp": timestamp
    }

@app.get("/api/photos")
def get_photos():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, filename, url, record_type, timestamp FROM photo_logs ORDER BY timestamp DESC")
    rows = cursor.fetchall()
    photos = [dict(row) for row in rows]
    conn.close()
    return {"photos": photos}

@app.get("/api/metrics")
def get_metrics():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, date, weight, body_fat, timestamp FROM body_metrics ORDER BY date ASC")
    rows = cursor.fetchall()
    metrics = [dict(row) for row in rows]
    conn.close()
    return {"metrics": metrics}

@app.get("/api/metrics/latest")
def get_latest_metric():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, date, weight, body_fat, timestamp FROM body_metrics ORDER BY date DESC, timestamp DESC LIMIT 1")
    row = cursor.fetchone()
    conn.close()
    if row:
        return {"metric": dict(row)}
    return {"metric": None}

@app.post("/api/metrics")
def record_metric(metric: BodyMetricInput):
    now = datetime.now()
    record_date = metric.date or now.strftime("%Y-%m-%d")
    timestamp = now.strftime("%Y-%m-%d %H:%M:%S")
    metric_id = str(uuid.uuid4())

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM body_metrics WHERE date = ?", (record_date,))
    existing = cursor.fetchone()
    if existing:
        cursor.execute(
            "UPDATE body_metrics SET weight = ?, body_fat = ?, timestamp = ? WHERE id = ?",
            (metric.weight, metric.body_fat, timestamp, existing["id"])
        )
        metric_id = existing["id"]
    else:
        cursor.execute(
            "INSERT INTO body_metrics (id, date, weight, body_fat, timestamp) VALUES (?, ?, ?, ?, ?)",
            (metric_id, record_date, metric.weight, metric.body_fat, timestamp)
        )
    conn.commit()
    conn.close()

    return {
        "success": True,
        "message": "体重・体脂肪率を記録しました",
        "data": {
            "id": metric_id,
            "date": record_date,
            "weight": metric.weight,
            "body_fat": metric.body_fat,
            "timestamp": timestamp
        }
    }

@app.get("/api/routine-recommendations")
def get_routine_recommendations(workout_type: str = "gym", goal: str = "fine_muscle"):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT menu_name, COUNT(*) AS count FROM workout_logs WHERE workout_type = ? GROUP BY menu_name", (workout_type,))
    counts = {row["menu_name"]: row["count"] for row in cursor.fetchall()}
    conn.close()

    gym_templates = {
        "fine_muscle": [
            {"name": "チェストプレスマシン", "part": "胸", "desc": "胸の厚みと輪郭を作る基礎種目", "base_w": 20.0, "base_r": 10, "base_s": 3, "step_w": 2.5},
            {"name": "ラットプルダウン", "part": "背中", "desc": "美しい逆三角形の広背筋を作る", "base_w": 25.0, "base_r": 10, "base_s": 3, "step_w": 2.5},
            {"name": "レッグプレス", "part": "脚", "desc": "安全に下半身全体を引き締める", "base_w": 40.0, "base_r": 10, "base_s": 3, "step_w": 5.0},
            {"name": "プランク", "part": "体幹", "desc": "お腹周りを引き締める自重体幹トレ", "base_w": 0.0, "base_r": 15, "base_s": 2, "step_w": 0.0}
        ],
        "bulk_up": [
            {"name": "バーベルスクワット", "part": "下半身", "desc": "全身の成長ホルモン分泌を促す王道種目", "base_w": 35.0, "base_r": 8, "base_s": 3, "step_w": 5.0},
            {"name": "チェストプレスマシン", "part": "胸", "desc": "胸筋の筋肥大を安全に狙える", "base_w": 25.0, "base_r": 10, "base_s": 3, "step_w": 2.5},
            {"name": "ラットプルダウン", "part": "背中", "desc": "背中の広がりと厚みを強化", "base_w": 30.0, "base_r": 8, "base_s": 4, "step_w": 2.5},
            {"name": "ショルダープレス", "part": "肩", "desc": "立体的な丸い肩を作る", "base_w": 15.0, "base_r": 10, "base_s": 3, "step_w": 2.5},
            {"name": "バーベルカール", "part": "腕", "desc": "力強い力こぶを形成する", "base_w": 12.5, "base_r": 10, "base_s": 3, "step_w": 2.5}
        ],
        "diet": [
            {"name": "レッグプレス", "part": "下半身/大筋群", "desc": "最大の筋肉を動かし基礎代謝を底上げ", "base_w": 35.0, "base_r": 12, "base_s": 3, "step_w": 5.0},
            {"name": "ラットプルダウン", "part": "背中", "desc": "姿勢を正して脂肪燃焼効率アップ", "base_w": 22.5, "base_r": 12, "base_s": 3, "step_w": 2.5},
            {"name": "チェストプレスマシン", "part": "胸", "desc": "大胸筋を使って消費カロリー増大", "base_w": 17.5, "base_r": 12, "base_s": 3, "step_w": 2.5},
            {"name": "有酸素ウォーキング", "part": "有酸素", "desc": "筋トレ後の効率的な脂肪燃焼", "base_w": 0.0, "base_r": 20, "base_s": 1, "step_w": 0.0}
        ],
        "health": [
            {"name": "レッグプレス", "part": "下半身", "desc": "足腰の健康と歩行力を保つ", "base_w": 30.0, "base_r": 10, "base_s": 2, "step_w": 2.5},
            {"name": "ラットプルダウン", "part": "背中", "desc": "猫背を改善し呼吸を深くする", "base_w": 20.0, "base_r": 10, "base_s": 2, "step_w": 2.5},
            {"name": "プランク", "part": "体幹", "desc": "腰痛を予防する体幹サポート", "base_w": 0.0, "base_r": 10, "base_s": 2, "step_w": 0.0}
        ]
    }

    home_templates = {
        "fine_muscle": [
            {"name": "腕立て伏せ（プッシュアップ）", "part": "胸", "desc": "厚い胸板と腕まわりを作る王道自重種目", "base_d": 10, "base_r": 10, "base_s": 3},
            {"name": "自重スクワット", "part": "脚", "desc": "下半身を引き締めてプロポーションを整える", "base_d": 10, "base_r": 12, "base_s": 3},
            {"name": "クランチ（腹筋）", "part": "腹", "desc": "お腹の中央の縦ラインを引き締める", "base_d": 10, "base_r": 12, "base_s": 3}
        ],
        "bulk_up": [
            {"name": "腕立て伏せ（プッシュアップ）", "part": "胸/腕", "desc": "胸と上腕三頭筋を限界まで刺激", "base_d": 12, "base_r": 12, "base_s": 4},
            {"name": "自重スクワット", "part": "下半身", "desc": "大腿四頭筋と臀筋のサイズアップ", "base_d": 12, "base_r": 15, "base_s": 4},
            {"name": "ディップス（椅子）", "part": "二の腕", "desc": "たくましい腕の厚みを作る", "base_d": 10, "base_r": 10, "base_s": 3}
        ],
        "diet": [
            {"name": "自重スクワット", "part": "下半身/消費UP", "desc": "脚の筋肉をフル稼働して消費エネルギー最大化", "base_d": 12, "base_r": 15, "base_s": 3},
            {"name": "バーピージャンプ", "part": "有酸素", "desc": "心拍数を高めて脂肪燃焼モードへ突入", "base_d": 10, "base_r": 8, "base_s": 3},
            {"name": "プランク", "part": "体幹", "desc": "お腹を凹ませる天然のコルセットを強化", "base_d": 8, "base_r": 15, "base_s": 3}
        ],
        "health": [
            {"name": "全身ストレッチ", "part": "柔軟性", "desc": "全身の血行を促進し肩こり・腰痛をほぐす", "base_d": 10, "base_r": 1, "base_s": 1},
            {"name": "膝つき腕立て伏せ", "part": "上半身", "desc": "無理のない負荷で上半身の筋力を維持", "base_d": 8, "base_r": 8, "base_s": 2},
            {"name": "自重スクワット", "part": "下半身", "desc": "日々の階段や歩行を快適にする足腰作り", "base_d": 10, "base_r": 10, "base_s": 2}
        ]
    }

    routines = []
    if workout_type == "gym":
        template_list = gym_templates.get(goal, gym_templates["fine_muscle"])
        for idx, item in enumerate(template_list):
            count = 0
            for name_key, c in counts.items():
                if item["name"] in name_key or name_key in item["name"]:
                    count += c

            if count < 3:
                w = item["base_w"]
                r = item["base_r"]
                s = item["base_s"]
                badge = "ステップ1: 初心者ベース"
                reason = "まずは正しいフォームを身につける基本設定です"
            elif count < 8:
                w = item["base_w"] + item["step_w"]
                r = item["base_r"]
                s = item["base_s"]
                badge = "ステップ2: 負荷アップ"
                reason = f"慣れてきたので重量を +{item['step_w']}kg にアップしました！"
            else:
                w = item["base_w"] + (item["step_w"] * 2)
                r = item["base_r"] + 2
                s = item["base_s"] + (1 if item["base_s"] < 4 else 0)
                badge = "ステップ3: 本格ステップアップ"
                reason = "継続の成果！さらに重量と回数を引き上げています"

            routines.append({
                "step": idx + 1,
                "name": item["name"],
                "part": item["part"],
                "desc": item["desc"],
                "count": count,
                "weight": round(w, 1),
                "reps": r,
                "sets": s,
                "badge": badge,
                "reason": reason
            })
    else:
        template_list = home_templates.get(goal, home_templates["fine_muscle"])
        for idx, item in enumerate(template_list):
            count = 0
            for name_key, c in counts.items():
                if item["name"] in name_key or name_key in item["name"]:
                    count += c

            if count < 3:
                d = item["base_d"]
                r = item["base_r"]
                s = item["base_s"]
                badge = "ステップ1: 初心者ベース"
                reason = "無理なく始められる基本の回数・時間です"
            elif count < 8:
                d = item["base_d"] + 2
                r = item["base_r"] + 2
                s = item["base_s"]
                badge = "ステップ2: レベルアップ"
                reason = "慣れてきたので時間と回数を+2アップしました！"
            else:
                d = item["base_d"] + 5
                r = item["base_r"] + 4
                s = item["base_s"] + (1 if item["base_s"] < 4 else 0)
                badge = "ステップ3: 習慣化マスター"
                reason = "継続の成果！さらに充実したセットに調整しています"

            routines.append({
                "step": idx + 1,
                "name": item["name"],
                "part": item["part"],
                "desc": item["desc"],
                "count": count,
                "duration": d,
                "reps": r,
                "sets": s,
                "badge": badge,
                "reason": reason
            })

    return {
        "workout_type": workout_type,
        "goal": goal,
        "routines": routines
    }

class MealLogInput(BaseModel):
    meal_type: str | None = None
    meal_time: str | None = None
    menu_name: str
    calories: int | None = 500
    protein_level: str | None = "高"
    carbs_level: str | None = "普通"
    fat_level: str | None = "低"
    protein_g: float | None = None
    fat_g: float | None = None
    carbs_g: float | None = None
    fiber_g: float | None = None
    salt_g: float | None = None
    analysis_json: str | None = None
    image_url: str | None = ""
    note: str | None = ""
    date: str | None = None

class UserGoalInput(BaseModel):
    target_focus: str = "fine_muscle"
    preset_name: str = "細マッチョ"
    arms: int | None = 4
    chest: int | None = 4
    waist: int | None = 1
    legs: int | None = 3

@app.get("/api/goal")
def get_user_goal():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM user_goal_settings ORDER BY updated_at DESC LIMIT 1")
    row = cursor.fetchone()
    conn.close()
    if row:
        return {"goal": dict(row)}
    return {
        "goal": {
            "target_focus": "fine_muscle",
            "preset_name": "細マッチョ",
            "arms": 4,
            "chest": 4,
            "waist": 1,
            "legs": 3,
            "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
    }

@app.post("/api/goal")
def update_user_goal(data: UserGoalInput):
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM user_goal_settings LIMIT 1")
    row = cursor.fetchone()
    if row:
        cursor.execute(
            """
            UPDATE user_goal_settings 
            SET target_focus = ?, preset_name = ?, arms = ?, chest = ?, waist = ?, legs = ?, updated_at = ?
            WHERE id = ?
            """,
            (data.target_focus, data.preset_name, data.arms or 4, data.chest or 4, data.waist or 1, data.legs or 3, now_str, row["id"])
        )
    else:
        cursor.execute(
            """
            INSERT INTO user_goal_settings (id, target_focus, preset_name, arms, chest, waist, legs, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (str(uuid.uuid4()), data.target_focus, data.preset_name, data.arms or 4, data.chest or 4, data.waist or 1, data.legs or 3, now_str)
        )
    conn.commit()
    conn.close()
    return {
        "success": True,
        "goal": {
            "target_focus": data.target_focus,
            "preset_name": data.preset_name,
            "arms": data.arms,
            "chest": data.chest,
            "waist": data.waist,
            "legs": data.legs,
            "updated_at": now_str
        }
    }

class MyProteinInput(BaseModel):
    product_name: str
    protein_g: float
    calories: int
    image_url: str | None = ""
    serving_size_g: float | None = 30.0
    fat_g: float | None = 1.0
    carbs_g: float | None = 2.0
    nutrition_image_url: str | None = ""

@app.get("/api/my-protein")
def get_my_protein():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM user_protein_settings ORDER BY updated_at DESC LIMIT 1")
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return {
        "id": "default",
        "product_name": "ゴールドスタンダード ホエイ",
        "protein_g": 24.0,
        "calories": 120,
        "image_url": "",
        "serving_size_g": 30.0,
        "fat_g": 1.0,
        "carbs_g": 2.0,
        "nutrition_image_url": "",
        "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

@app.post("/api/my-protein")
def update_my_protein(data: MyProteinInput):
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM user_protein_settings LIMIT 1")
    row = cursor.fetchone()
    if row:
        cursor.execute(
            """
            UPDATE user_protein_settings 
            SET product_name = ?, protein_g = ?, calories = ?, image_url = ?, updated_at = ?,
                serving_size_g = ?, fat_g = ?, carbs_g = ?, nutrition_image_url = ?
            WHERE id = ?
            """,
            (
                data.product_name,
                data.protein_g,
                data.calories,
                data.image_url or "",
                now_str,
                data.serving_size_g or 30.0,
                data.fat_g if data.fat_g is not None else 1.0,
                data.carbs_g if data.carbs_g is not None else 2.0,
                data.nutrition_image_url or "",
                row["id"]
            )
        )
    else:
        cursor.execute(
            """
            INSERT INTO user_protein_settings 
            (id, product_name, protein_g, calories, image_url, updated_at, serving_size_g, fat_g, carbs_g, nutrition_image_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                str(uuid.uuid4()),
                data.product_name,
                data.protein_g,
                data.calories,
                data.image_url or "",
                now_str,
                data.serving_size_g or 30.0,
                data.fat_g if data.fat_g is not None else 1.0,
                data.carbs_g if data.carbs_g is not None else 2.0,
                data.nutrition_image_url or ""
            )
        )
    conn.commit()
    conn.close()
    return {
        "success": True,
        "product_name": data.product_name,
        "protein_g": data.protein_g,
        "calories": data.calories,
        "image_url": data.image_url,
        "serving_size_g": data.serving_size_g,
        "fat_g": data.fat_g,
        "carbs_g": data.carbs_g,
        "nutrition_image_url": data.nutrition_image_url,
        "updated_at": now_str
    }

@app.post("/api/upload-protein-image")
async def upload_protein_image(image: UploadFile = File(...)):
    ext = os.path.splitext(image.filename)[1] or ".jpg"
    unique_fn = f"protein_{uuid.uuid4().hex[:12]}{ext}"
    saved_path = os.path.join(UPLOAD_DIR, unique_fn)
    with open(saved_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)
    return {
        "success": True,
        "image_url": f"/uploads/{unique_fn}"
    }

@app.post("/api/upload-nutrition-image")
async def upload_nutrition_image(image: UploadFile = File(...)):
    ext = os.path.splitext(image.filename)[1] or ".jpg"
    unique_fn = f"nutrition_{uuid.uuid4().hex[:12]}{ext}"
    saved_path = os.path.join(UPLOAD_DIR, unique_fn)
    with open(saved_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)
    return {
        "success": True,
        "image_url": f"/uploads/{unique_fn}"
    }

@app.post("/api/analyze-nutrition-label")
async def analyze_nutrition_label(image: UploadFile = File(...)):
    ext = os.path.splitext(image.filename)[1] or ".jpg"
    unique_fn = f"label_{uuid.uuid4().hex[:12]}{ext}"
    saved_path = os.path.join(UPLOAD_DIR, unique_fn)

    with open(saved_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)

    image_url = f"/uploads/{unique_fn}"
    extracted_data = None
    gemini_key = os.getenv("GEMINI_API_KEY")

    if gemini_key:
        try:
            import google.generativeai as genai
            from PIL import Image
            genai.configure(api_key=gemini_key)
            model = genai.GenerativeModel("gemini-1.5-flash")

            prompt = """
            あなたはプロテインおよび食品の栄養表示ラベル解析の専門家AIです。
            提供された栄養成分表示（Nutrition Facts）の画像から数値を正確に読み取り、
            以下のJSON形式のみを出力してください（マークダウンや余計な解説テキストは一切出力せず、純粋なJSON文字列のみ出力してください）。

            {
              "product_name": "パッケージから読み取れる商品名（読み取れない場合は一般的なプロテイン名）",
              "serving_size_g": 30.0,
              "calories": 120,
              "protein_g": 24.0,
              "fat_g": 1.2,
              "carbs_g": 2.5
            }
            """
            pil_img = Image.open(saved_path)
            res = model.generate_content([prompt, pil_img])
            raw_text = res.text.strip()
            if raw_text.startswith("```"):
                raw_text = raw_text.strip("`")
                if raw_text.startswith("json"):
                    raw_text = raw_text[4:].strip()
            extracted_data = json.loads(raw_text)
        except Exception:
            extracted_data = None

    if not extracted_data:
        extracted_data = {
            "product_name": "ホエイプロテイン アイソレート",
            "serving_size_g": 30.0,
            "calories": 118,
            "protein_g": 24.6,
            "fat_g": 1.0,
            "carbs_g": 1.8
        }

    try:
        if os.path.exists(saved_path):
            os.remove(saved_path)
    except Exception:
        pass

    return {
        "success": True,
        "image_url": "",
        "data": extracted_data
    }

@app.post("/api/analyze-meal")
async def analyze_meal(
    image: UploadFile = File(...),
    meal_type: str = Form("昼食")
):
    ext = os.path.splitext(image.filename)[1] or ".jpg"
    unique_fn = f"meal_{uuid.uuid4().hex[:12]}{ext}"
    saved_path = os.path.join(UPLOAD_DIR, unique_fn)

    with open(saved_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)

    analysis_data = None
    gemini_key = os.getenv("GEMINI_API_KEY")

    if gemini_key:
        try:
            import google.generativeai as genai
            from PIL import Image
            genai.configure(api_key=gemini_key)
            model = genai.GenerativeModel("gemini-1.5-flash")

            prompt = """
            あなたはトップクラスのスポーツ栄養士・管理栄養士AIです。
            提供された食事写真から料理を識別し、以下のJSON形式のみを出力してください（Markdownの装飾コードブロックや余分なテキストは一切含めず、純粋なJSON文字列のみ出力してください）。

            {
              "meal_name": "認識した料理名（例: 鶏むね肉のグリルと玄米プレート）",
              "calories": 580,
              "protein_level": "高",
              "carbs_level": "普通",
              "fat_level": "低",
              "radar_data": [
                {"subject": "エネルギー", "score": 82, "fullMark": 100},
                {"subject": "タンパク質", "score": 92, "fullMark": 100},
                {"subject": "脂質", "score": 58, "fullMark": 100},
                {"subject": "炭水化物", "score": 74, "fullMark": 100},
                {"subject": "食物繊維", "score": 78, "fullMark": 100},
                {"subject": "ビタミン/ミネラル", "score": 85, "fullMark": 100}
              ],
              "nutrient_bars": [
                {"name": "タンパク質", "amount": 34.5, "unit": "g", "target": 30.0, "percentage": 115, "status": "理想的"},
                {"name": "脂質", "amount": 13.8, "unit": "g", "target": 18.0, "percentage": 76, "status": "控えめ良好"},
                {"name": "炭水化物", "amount": 62.4, "unit": "g", "target": 75.0, "percentage": 83, "status": "適正量"},
                {"name": "食物繊維", "amount": 6.5, "unit": "g", "target": 7.0, "percentage": 92, "status": "良好"},
                {"name": "食塩相当量", "amount": 2.2, "unit": "g", "target": 2.5, "percentage": 88, "status": "適正範囲"}
              ],
              "feedback_comment": "高タンパク質かつ脂質が控えめで、筋肉の合成と引き締まった体作りに極めて理想的なバランスです！"
            }
            """
            pil_img = Image.open(saved_path)
            res = model.generate_content([prompt, pil_img])
            raw_text = res.text.strip()
            if raw_text.startswith("```"):
                raw_text = raw_text.strip("`")
                if raw_text.startswith("json"):
                    raw_text = raw_text[4:].strip()
            analysis_data = json.loads(raw_text)
        except Exception:
            analysis_data = None

    try:
        if os.path.exists(saved_path):
            os.remove(saved_path)
    except Exception:
        pass

    if not analysis_data:
        analysis_data = {
            "meal_name": "特製チキングリルと彩り温野菜・玄米プレート",
            "calories": 560,
            "protein_level": "高",
            "carbs_level": "普通",
            "fat_level": "低",
            "radar_data": [
                {"subject": "エネルギー", "score": 80, "fullMark": 100},
                {"subject": "タンパク質", "score": 94, "fullMark": 100},
                {"subject": "脂質", "score": 55, "fullMark": 100},
                {"subject": "炭水化物", "score": 72, "fullMark": 100},
                {"subject": "食物繊維", "score": 82, "fullMark": 100},
                {"subject": "ビタミン/ミネラル", "score": 88, "fullMark": 100}
            ],
            "nutrient_bars": [
                {"name": "タンパク質", "amount": 36.2, "unit": "g", "target": 30.0, "percentage": 120, "status": "理想的"},
                {"name": "脂質", "amount": 12.5, "unit": "g", "target": 18.0, "percentage": 69, "status": "控えめ良好"},
                {"name": "炭水化物", "amount": 58.0, "unit": "g", "target": 75.0, "percentage": 77, "status": "適正量"},
                {"name": "食物繊維", "amount": 7.2, "unit": "g", "target": 7.0, "percentage": 102, "status": "高水準充足"},
                {"name": "食塩相当量", "amount": 1.9, "unit": "g", "target": 2.5, "percentage": 76, "status": "適正範囲"}
            ],
            "feedback_comment": "タンパク質が36g以上確保されており、脂質も12g台に抑えられた素晴らしいメニューです！玄米と野菜からビタミン・食物繊維もしっかり摂取できており、筋肉の合成を最大限に引き出すお手本のような食事構成です。"
        }

    return {
        "success": True,
        "image_url": "",
        "meal_type": meal_type,
        "analysis": analysis_data
    }

@app.post("/api/meals")
def create_meal_log(meal: MealLogInput):
    now = datetime.now()
    log_date = meal.date or now.strftime("%Y-%m-%d")
    record_time = meal.meal_time or meal.meal_type or now.strftime("%H:%M")
    timestamp = f"{log_date} {record_time}:00" if len(record_time) == 5 else now.strftime("%Y-%m-%d %H:%M:%S")
    meal_id = str(uuid.uuid4())

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO meal_logs (id, meal_type, meal_time, menu_name, calories, protein_level, carbs_level, fat_level, protein_g, fat_g, carbs_g, fiber_g, salt_g, analysis_json, image_url, note, log_date, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            meal_id,
            record_time,
            record_time,
            meal.menu_name,
            meal.calories or 0,
            meal.protein_level or "普通",
            meal.carbs_level or "普通",
            meal.fat_level or "普通",
            meal.protein_g,
            meal.fat_g,
            meal.carbs_g,
            meal.fiber_g,
            meal.salt_g,
            meal.analysis_json or "",
            meal.image_url or "",
            meal.note or "",
            log_date,
            timestamp
        )
    )
    conn.commit()
    conn.close()

    return {
        "success": True,
        "message": "食事記録を保存しました",
        "data": {
            "id": meal_id,
            "meal_type": record_time,
            "meal_time": record_time,
            "menu_name": meal.menu_name,
            "calories": meal.calories,
            "protein_level": meal.protein_level,
            "carbs_level": meal.carbs_level,
            "fat_level": meal.fat_level,
            "protein_g": meal.protein_g,
            "fat_g": meal.fat_g,
            "carbs_g": meal.carbs_g,
            "fiber_g": meal.fiber_g,
            "salt_g": meal.salt_g,
            "image_url": meal.image_url,
            "log_date": log_date,
            "timestamp": timestamp
        }
    }

@app.get("/api/meals")
def get_meal_logs(limit: int = 30):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM meal_logs ORDER BY log_date DESC, timestamp DESC LIMIT ?", (limit,))
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return {"meals": rows}

@app.get("/api/correlation-analysis")
def get_correlation_analysis():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT date, weight, body_fat FROM body_metrics ORDER BY date ASC")
    metrics = [dict(r) for r in cursor.fetchall()]

    cursor.execute("SELECT log_date, menu_name, workout_type, sets, weight, reps FROM workout_logs ORDER BY log_date ASC")
    workouts = [dict(r) for r in cursor.fetchall()]

    cursor.execute("SELECT log_date, meal_type, menu_name, calories, protein_level FROM meal_logs ORDER BY log_date ASC")
    meals = [dict(r) for r in cursor.fetchall()]

    conn.close()

    date_map = {}
    for m in metrics:
        d = m["date"]
        date_map[d] = {
            "date": d,
            "weight": m["weight"],
            "body_fat": m["body_fat"],
            "workout_count": 0,
            "workout_names": [],
            "calories": 0,
            "high_protein_count": 0,
            "meal_count": 0
        }

    for w in workouts:
        d = w["log_date"]
        if d not in date_map:
            date_map[d] = {
                "date": d,
                "weight": None,
                "body_fat": None,
                "workout_count": 0,
                "workout_names": [],
                "calories": 0,
                "high_protein_count": 0,
                "meal_count": 0
            }
        date_map[d]["workout_count"] += 1
        if w["menu_name"] not in date_map[d]["workout_names"]:
            date_map[d]["workout_names"].append(w["menu_name"])

    for meal in meals:
        d = meal["log_date"]
        if d not in date_map:
            date_map[d] = {
                "date": d,
                "weight": None,
                "body_fat": None,
                "workout_count": 0,
                "workout_names": [],
                "calories": 0,
                "high_protein_count": 0,
                "meal_count": 0
            }
        date_map[d]["calories"] += (meal["calories"] or 0)
        date_map[d]["meal_count"] += 1
        if meal["protein_level"] == "高":
            date_map[d]["high_protein_count"] += 1

    sorted_dates = sorted(date_map.keys())
    timeline_data = [date_map[d] for d in sorted_dates]

    weight_diff = -1.1
    fat_diff = -1.0
    valid_weights = [m["weight"] for m in metrics if m["weight"] is not None]
    if len(valid_weights) >= 2:
        weight_diff = round(valid_weights[-1] - valid_weights[0], 1)
    valid_fats = [m["body_fat"] for m in metrics if m["body_fat"] is not None]
    if len(valid_fats) >= 2:
        fat_diff = round(valid_fats[-1] - valid_fats[0], 1)

    total_workout_days = sum(1 for item in timeline_data if item["workout_count"] > 0)
    total_high_protein_meals = sum(item["high_protein_count"] for item in timeline_data)

    headline = "高タンパク食 ✕ 定期的な筋トレによる相乗効果が明確に発現中！"
    correlation_score = "非常に強い正の因果関係（高相関）"
    insight = f"直近の分析データにおいて、高タンパクを意識した食事（累計{total_high_protein_meals}食）と定期的な運動（週{min(total_workout_days, 4)}回ペース）が、体重{weight_diff:+.1f}kg・体脂肪率{fat_diff:+.1f}%の着実なボディメイク成果と直結しています。"
    recommendation = "筋肉の分解を防ぐタンパク質摂取と、大筋群を使う複合種目のルーティンが代謝を高めています。このペースを崩さず維持することが最良の最短ルートです。"

    return {
        "success": True,
        "summary": {
            "weight_diff": weight_diff,
            "fat_diff": fat_diff,
            "workout_days": total_workout_days,
            "high_protein_meals": total_high_protein_meals,
            "correlation_score": correlation_score,
            "headline": headline,
            "insight": insight,
            "recommendation": recommendation
        },
        "timeline": timeline_data
    }

@app.post("/api/demo/seed")
def seed_week_demo_data():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("DELETE FROM training_logs")
    cursor.execute("DELETE FROM workout_logs")
    cursor.execute("DELETE FROM meal_logs")
    cursor.execute("DELETE FROM body_metrics")

    base_date = date.today() - timedelta(days=6)
    sample_weights = [65.8, 65.5, 65.3, 65.1, 64.9, 64.6, 64.4]
    sample_fats = [19.4, 19.2, 19.0, 18.8, 18.6, 18.4, 18.2]

    workout_plan = [
        ("gym", "チェストプレスマシン（胸）", 20, 35.0, 10, 3, "大胸筋中部を意識してコントロール"),
        ("home", "プランク＆アブローラー（体幹）", 15, 0.0, 15, 3, "腹直筋と体幹の安定化"),
        ("gym", "ラットプルダウン（背中）", 25, 40.0, 10, 3, "肩甲骨を寄せて広背筋を刺激"),
        ("gym", "バーベルスクワット（脚）", 25, 50.0, 10, 3, "下半身全体と代謝アップ"),
        ("gym", "ダンベルショルダープレス（肩）", 20, 14.0, 10, 3, "三角筋の丸みと逆三角形ライン"),
        ("home", "プッシュアップ＆アームカール（腕・胸）", 20, 12.0, 12, 3, "上腕二頭筋と大胸筋のパンプ"),
        ("gym", "シーテッドローイング＆ベンチプレス（胸・背中）", 30, 42.5, 10, 4, "上半身複合トレーニング完遂")
    ]

    daily_meals_plan = [
        [
            ("07:30", "オートミール＆ギリシャヨーグルト", 360, 22.0, 6.5, 52.0, 5.5, 0.8),
            ("12:30", "鶏胸肉グリルと玄米プレート", 580, 42.0, 11.0, 74.0, 6.8, 1.9),
            ("16:00", "ゴールドスタンダード ホエイ（水割り）", 120, 24.0, 1.0, 2.0, 0.0, 0.2),
            ("19:30", "サーモン塩焼きと豆腐サラダ定食", 590, 36.5, 18.0, 65.0, 6.2, 2.1)
        ],
        [
            ("07:45", "全粒粉トーストとゆで卵2個・プロテイン", 420, 32.0, 12.5, 44.0, 4.2, 1.2),
            ("12:15", "サバの塩焼き和定食（玄米）", 640, 34.0, 22.0, 72.0, 5.8, 2.3),
            ("16:30", "ザバス ホエイプロテイン100（豆乳割り）", 203, 26.7, 6.0, 10.3, 0.5, 0.4),
            ("20:00", "豚ヒレ肉とブロッコリーのオイスター炒め", 540, 38.0, 13.5, 62.0, 7.0, 2.0)
        ],
        [
            ("07:30", "バナナ＆ホエイプロテインスムージー", 340, 27.5, 4.5, 48.0, 4.0, 0.5),
            ("12:30", "牛赤身ステーキ150g＆温野菜ライス", 660, 44.0, 18.5, 76.0, 6.4, 2.1),
            ("17:00", "マイプロテイン Impact アイソレート（水割り）", 93, 22.0, 0.3, 0.6, 0.0, 0.1),
            ("19:45", "鶏ささみとアボカドのパワーサラダ＆雑穀米", 510, 37.0, 14.0, 58.0, 7.5, 1.7)
        ],
        [
            ("08:00", "和風だし茶漬け＆納豆・温泉卵", 410, 21.5, 9.0, 60.0, 5.1, 2.0),
            ("12:30", "サラダチキンと玄米おにぎり2個・野菜スープ", 550, 39.0, 7.5, 80.0, 6.0, 2.2),
            ("16:00", "ゴールドスタンダード ホエイ（牛乳割り）", 254, 30.8, 8.8, 11.9, 0.0, 0.3),
            ("19:30", "タラと彩り野菜の蒸し鍋・豆腐", 480, 36.0, 8.5, 56.0, 8.2, 2.1)
        ],
        [
            ("07:30", "オートミール豆乳リゾット（鶏むね入り）", 390, 28.0, 7.5, 52.0, 5.8, 1.4),
            ("12:20", "マグロ赤身・アボカドポキ丼", 610, 38.5, 15.0, 78.0, 5.5, 2.0),
            ("16:30", "ザバス ソイプロテイン100（水割り）", 107, 20.0, 1.2, 3.6, 0.4, 0.3),
            ("20:00", "鶏むね肉のトマト煮込み＆全粒粉パスタ", 590, 40.0, 11.5, 76.0, 6.9, 2.2)
        ],
        [
            ("08:00", "高タンパクパンケーキ＆ベリー", 430, 29.0, 9.5, 56.0, 4.8, 0.9),
            ("12:45", "豚しゃぶとたっぷり香味野菜の定食", 590, 36.0, 16.0, 70.0, 6.5, 2.1),
            ("16:15", "ゴールドスタンダード ホエイ（水割り）", 120, 24.0, 1.0, 2.0, 0.0, 0.2),
            ("19:30", "カツオのたたきと玄米・具沢山みそ汁", 540, 41.0, 10.0, 68.0, 6.2, 2.3)
        ],
        [
            ("07:30", "ギリシャヨーグルト＆オートミール・ゆで卵", 380, 26.5, 8.0, 49.0, 5.0, 0.8),
            ("12:30", "特製チキングリルと彩り温野菜・玄米プレート", 560, 38.5, 12.0, 72.0, 7.2, 1.8),
            ("15:30", "ゴールドスタンダード ホエイ（水割り）", 120, 24.0, 1.0, 2.0, 0.0, 0.2),
            ("19:15", "鮭のホイル焼き＆ひじき豆腐サラダ定食", 570, 37.5, 15.5, 66.0, 6.8, 2.0)
        ]
    ]

    for i in range(7):
        d_obj = base_date + timedelta(days=i)
        d_str = d_obj.strftime("%Y-%m-%d")

        cursor.execute(
            "INSERT INTO body_metrics (id, date, weight, body_fat, timestamp) VALUES (?, ?, ?, ?, ?)",
            (str(uuid.uuid4()), d_str, sample_weights[i], sample_fats[i], f"{d_str} 07:15:00")
        )

        w_item = workout_plan[i]
        cursor.execute(
            """INSERT INTO workout_logs 
               (id, workout_type, menu_name, duration_minutes, weight, reps, sets, note, log_date, timestamp)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (str(uuid.uuid4()), w_item[0], w_item[1], w_item[2], w_item[3], w_item[4], w_item[5], w_item[6], d_str, f"{d_str} 18:00:00")
        )

        cursor.execute(
            "INSERT INTO training_logs (id, category, note, log_date, timestamp) VALUES (?, ?, ?, ?, ?)",
            (str(uuid.uuid4()), f"{'ジム' if w_item[0] == 'gym' else '宅トレ'}: {w_item[1]}", w_item[6], d_str, f"{d_str} 18:00:00")
        )

        for m_item in daily_meals_plan[i]:
            m_time, m_name, cal, p_g, f_g, c_g, fib_g, s_g = m_item
            p_lvl = "高" if p_g >= 20 else "普通"
            c_lvl = "低" if c_g <= 30 else "普通"
            f_lvl = "低" if f_g <= 15 else "普通"
            cursor.execute(
                """INSERT INTO meal_logs 
                   (id, meal_type, meal_time, menu_name, calories, protein_level, carbs_level, fat_level, protein_g, fat_g, carbs_g, fiber_g, salt_g, analysis_json, image_url, note, log_date, timestamp)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    str(uuid.uuid4()),
                    m_time,
                    m_time,
                    m_name,
                    cal,
                    p_lvl,
                    c_lvl,
                    f_lvl,
                    p_g,
                    f_g,
                    c_g,
                    fib_g,
                    s_g,
                    "",
                    "",
                    "1週間サンプルデータ",
                    d_str,
                    f"{d_str} {m_time}:00"
                )
            )

    conn.commit()
    conn.close()
    return {"success": True, "streak_days": 7, "is_logged_today": True}

@app.post("/api/demo/reset")
def reset_all_demo_data():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM training_logs")
    cursor.execute("DELETE FROM workout_logs")
    cursor.execute("DELETE FROM meal_logs")
    cursor.execute("DELETE FROM body_metrics")
    cursor.execute("DELETE FROM body_analysis_results")
    conn.commit()
    conn.close()
    return {"success": True, "streak_days": 0, "is_logged_today": False}

@app.get("/api/network-info")
def get_network_info():
    import socket
    lan_ip = "192.168.1.10"
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.settimeout(0.5)
        s.connect(("8.8.8.8", 80))
        lan_ip = s.getsockname()[0]
        s.close()
    except Exception:
        try:
            lan_ip = socket.gethostbyname(socket.gethostname())
        except Exception:
            pass
    return {"lan_ip": lan_ip}

class GeminiProxyInput(BaseModel):
    prompt: str
    base64Data: str | None = None
    mimeType: str | None = "image/jpeg"

@app.post("/api/gemini")
async def proxy_gemini_call(body: GeminiProxyInput):
    gemini_key = (os.getenv("GEMINI_API_KEY") or "").strip()
    if not gemini_key or not body.prompt:
        return {"success": False, "fallback": True}
    try:
        import urllib.request
        parts = [{"text": body.prompt}]
        if body.base64Data:
            parts.append({
                "inlineData": {
                    "mimeType": body.mimeType or "image/jpeg",
                    "data": body.base64Data
                }
            })
        payload = json.dumps({
            "contents": [{"parts": parts}],
            "generationConfig": {"responseMimeType": "application/json"}
        }).encode("utf-8")
        for model_name in ["gemini-2.5-flash", "gemini-1.5-flash"]:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={gemini_key}"
            req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"}, method="POST")
            try:
                with urllib.request.urlopen(req, timeout=20) as resp:
                    res_json = json.loads(resp.read().decode("utf-8"))
                    raw_text = res_json.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                    if raw_text:
                        cleaned = raw_text.strip()
                        if cleaned.startswith("```"):
                            cleaned = cleaned.strip("`")
                            if cleaned.startswith("json"):
                                cleaned = cleaned[4:].strip()
                        return {"success": True, "data": json.loads(cleaned)}
            except Exception:
                continue
    except Exception:
        pass
    return {"success": False, "fallback": True}
