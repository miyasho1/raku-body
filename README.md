# らくボディ (Raku Body)

習慣化ボディメイク支援Webアプリケーション

## ディレクトリ構成
```text
raku-body/
├── .vscode/          # VS Code用デバッグ・タスク設定
├── backend/          # FastAPI バックエンドサーバー
│   ├── main.py
│   └── requirements.txt
└── frontend/         # React + Vite + Tailwind CSS フロントエンド
    ├── src/
    ├── index.html
    ├── package.json
    └── vite.config.js
```

## VS Codeでの起動手順

### 1. ワークスペースを開く
VS Codeの「ファイル」>「フォルダーを開く」から、このプロジェクトフォルダ（`raku-body`）を開きます。

### 2. ライブラリのインストール

#### バックエンド
ターミナルを開き、以下のコマンドを実行します。
```bash
cd backend
python -m venv .venv
# Windowsの場合
.venv\Scripts\activate
pip install -r requirements.txt
```

#### フロントエンド
新しいターミナルを開き、以下のコマンドを実行します。
```bash
cd frontend
npm install
```

### 3. アプリケーションの実行

#### 方法A: VS Codeのデバッグ機能を使用（推奨）
1. 左側の「実行とデバッグ」アイコンをクリックします。
2. 上部のドロップダウンから「フルスタック同時起動」を選択し、再生ボタン（F5）を押します。

#### 方法B: タスク機能を使用
1. メニューから「ターミナル」>「タスクの実行...」を選択します。
2. 「全サーバー並行起動」を選択します。

### 4. 画面へのアクセス
ブラウザで以下のURLを開いてください。
- フロントエンド: http://localhost:3000
- バックエンドAPI仕様書: http://localhost:8000/docs
