# Map Reviews Timeline

[English](#english) | [日本語](#日本語)

---

## 日本語

Google Mapsで表示している範囲内のスポットの口コミを、X（旧Twitter）風のタイムラインUIで一覧表示するWebアプリケーションです。

## 特徴

- 🗺️ **インタラクティブな地図**: Google Maps上で自由に範囲を選択
- ⚡ **高速な口コミ取得**: Promise.allSettledによる並列処理で最大20スポットを高速取得
- 📝 **タイムライン表示**: X風のUIで口コミを見やすく表示
- 🌓 **ライト/ダークモード**: ワンクリックでテーマを切り替え可能
- 📱 **完全レスポンシブ対応**: スマートフォン・タブレット・PCで最適表示
- 🔄 **柔軟なソート**: 新しい順/古い順/高評価順/低評価順で並び替え
- 🔍 **地名検索**: 地名や住所で素早く目的地にジャンプ
- 📍 **マーカー連携**: 地図上のマーカーをクリックして該当の口コミにジャンプ
- 🏗️ **モダンなアーキテクチャ**: TypeScript + Viteによる高速開発環境
- 🦀 **高速リント**: Biome（Rust製）による爆速コード品質チェック

## 技術スタック

### コア技術
- **TypeScript 5.3+**: 型安全な開発
- **Vite 8**: 高速ビルドツール（HMR対応）— Node.js `^20.19.0 || >=22.12.0` が必要
- **Google Maps JavaScript API**: 地図表示・操作
- **Google Places API (New)**: スポット情報・口コミ取得

### 開発ツール
- **Biome**: Rust製リンター/フォーマッター（ESLint + Prettier代替）

### アーキテクチャ

```
src/
├── app.ts                     # メインアプリケーション（UI・Places API・描画）
├── services/
│   └── MarkerService.ts       # Advanced Marker + クラスタリング
└── types/
    └── index.ts               # 型定義
```

## セットアップ

### 1. リポジトリのクローン

```bash
git clone https://github.com/kwrkb/map-reviews-timeline.git
cd map-reviews-timeline
```

### 2. 依存関係のインストール

**前提: Node.js `^20.19.0 || >=22.12.0`**（Vite 8 の要求バージョン）。
これより古い Node では `npm install` の時点で警告が出て、ビルドが失敗します。

```bash
node -v          # バージョンを確認
npm install
```

### 3. Google Cloud Platformの設定

#### 3-1. プロジェクトを作成

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新しいプロジェクトを作成

#### 3-2. 必要なAPIを有効化

以下のAPIを**必ず**有効化してください：

- ✅ **Maps JavaScript API** - 地図表示・操作
- ✅ **Places API (New)** - スポット検索・クチコミ取得（Legacy版ではなくNew版）

**注意:** Geometry Library（距離計算）は Maps JavaScript API に自動的に含まれているため、個別の有効化は不要です。

有効化手順：
1. Google Cloud Consoleで「APIとサービス」>「ライブラリ」を開く
2. 上記2つのAPIを検索して有効化

#### 3-3. APIキーを作成

1. 「APIとサービス」>「認証情報」を開く
2. 「認証情報を作成」>「APIキー」を選択
3. 作成されたAPIキーをコピー

**セキュリティのため、APIキーに制限を設定することを推奨：**
- **アプリケーションの制限**: HTTPリファラー（Webサイト）
- **APIの制限**: Maps JavaScript API、Places API (New)
  - 注意: Geometry Library は Maps JavaScript API に含まれているため、個別の制限設定は不要

### 4. 環境変数の設定

環境変数 `VITE_GOOGLE_MAPS_API_KEY` にAPIキーを設定してください。

#### 開発環境での設定例

```bash
# 起動時に環境変数を指定
VITE_GOOGLE_MAPS_API_KEY="your_api_key_here" npm run dev
```

または、シェルの設定ファイル（`.bashrc`, `.zshrc`など）に追加：

```bash
export VITE_GOOGLE_MAPS_API_KEY="your_api_key_here"
```

## 使い方

### 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:8000/` を開いてください。

### 本番ビルド

```bash
# TypeScriptコンパイル + Viteビルド
npm run build

# ビルド結果をプレビュー
npm run preview
```

ビルド結果は `dist/` ディレクトリに出力されます。

### コード品質管理

```bash
# リントチェック
npm run lint

# フォーマット適用
npm run format

# リント + フォーマット一括チェック
npm run check

# 自動修正
npm run check:fix
```

## アプリの使い方

### 1. 地図を操作
マウスやタッチで地図を移動・ズームして、口コミを取得したい範囲を表示

### 2. 地名検索（オプション）
検索ボックスに地名や住所を入力して、素早く目的地にジャンプ

### 3. 口コミを取得
「この範囲の口コミを取得」ボタンをクリック

**処理の流れ:**
1. 表示範囲内のスポットを検索（最大20件）
2. 各スポットの詳細を**並列取得**（Promise.allSettled）
3. 全スポットの口コミを統合してタイムライン表示

### 4. タイムラインで閲覧
右側のタイムラインに口コミが表示されます

### 5. ソート
タイムライン上部のドロップダウンで並び順を変更できます：
- 新しい順
- 古い順
- 高評価順
- 低評価順

## API制限と料金について

### 無料枠

Google Maps Platformには月額 **$200の無料枠**があります：
- Maps JavaScript API: 28,000回/月まで無料
- Places API (New): 取得するフィールドによって課金が異なります

### このアプリの利用料金目安

- 1回の検索で最大20スポット取得
- 各スポットの詳細取得（displayName、reviews、types、location）

**重要:** APIの使用量と料金は [Google Cloud Console](https://console.cloud.google.com/) で確認できます。予算アラートの設定を推奨します。

### 料金を抑えるコツ

- 検索範囲を狭くする
- 頻繁に検索しすぎない
- 使わないときはタブを閉じる

## API制限

- **口コミ取得制限**: Places API (New)の仕様により、1スポットあたり最大5件の口コミのみ取得可能
- **検索スポット数**: 負荷軽減のため、1回の検索で最大20スポットに制限
- **検索半径**: Places APIの上限により最大5,000mまで

## トラブルシューティング

### 地図が表示されない

- 環境変数 `VITE_GOOGLE_MAPS_API_KEY` が設定されているか確認
- Maps JavaScript APIが有効化されているか確認
- ブラウザのコンソールでエラーメッセージを確認

### 口コミが取得できない

- **Places API (New)** が有効化されているか確認（Legacy版ではなくNew版）
- APIキーの制限設定を確認
- 選択範囲にスポットが存在するか確認
- ブラウザのコンソールで `PERMISSION_DENIED` エラーが出ていないか確認

### "API制限超過" エラー

- 無料枠を超えた可能性があります
- Google Cloud Consoleで使用量を確認
- しばらく時間を置いてから再試行

## 開発に貢献する

### プルリクエスト前のチェックリスト

```bash
# 型チェック
npx tsc --noEmit

# コード品質チェック
npm run check

# ビルド確認
npm run build
```

## ライセンス

MIT License

## 注意事項

- このアプリはGoogle Maps Platform APIを使用します。利用規約を遵守してください
- APIキーは第三者に共有しないでください
- 商用利用する場合はGoogle Maps Platformの利用規約を確認してください

---

## English

A web application that displays reviews of spots within the visible Google Maps area in an X (formerly Twitter)-style timeline UI.

### Features

- 🗺️ **Interactive Map**: Freely select areas on Google Maps
- ⚡ **Fast Review Fetching**: High-speed parallel processing with Promise.allSettled for up to 20 spots
- 📝 **Timeline Display**: Easy-to-read reviews in X-style UI
- 🌓 **Light/Dark Mode**: Toggle theme with one click
- 📱 **Fully Responsive**: Optimized display for smartphones, tablets, and PCs
- 🔄 **Flexible Sorting**: Sort by newest/oldest/highest rating/lowest rating
- 🔍 **Place Search**: Quickly jump to destinations by place name or address
- 📍 **Marker Integration**: Click map markers to jump to corresponding reviews
- 🏗️ **Modern Architecture**: Fast development environment with TypeScript + Vite
- 🦀 **Fast Linting**: Lightning-fast code quality checks with Biome (Rust-based)

### Tech Stack

#### Core Technologies
- **TypeScript 5.3+**: Type-safe development
- **Vite 8**: Fast build tool (with HMR support) — requires Node.js `^20.19.0 || >=22.12.0`
- **Google Maps JavaScript API**: Map display and manipulation
- **Google Places API (New)**: Spot information and review fetching

#### Development Tools
- **Biome**: Rust-based linter/formatter (ESLint + Prettier alternative)

#### Architecture

```
src/
├── app.ts                     # Main application (UI, Places API, rendering)
├── services/
│   └── MarkerService.ts       # Advanced Markers + clustering
└── types/
    └── index.ts               # Type definitions
```

### Setup

#### 1. Clone the Repository

```bash
git clone https://github.com/kwrkb/map-reviews-timeline.git
cd map-reviews-timeline
```

#### 2. Install Dependencies

**Prerequisite: Node.js `^20.19.0 || >=22.12.0`** (required by Vite 8).
Older versions will warn during `npm install` and fail to build.

```bash
node -v          # check your version
npm install
```

#### 3. Google Cloud Platform Configuration

##### 3-1. Create a Project

1. Access [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project

##### 3-2. Enable Required APIs

**Must** enable the following APIs:

- ✅ **Maps JavaScript API** - Map display and manipulation
- ✅ **Places API (New)** - Place search and reviews (NOT the legacy Places API)

**Note:** Geometry Library is automatically included in the Maps JavaScript API - no separate activation required.

Enabling steps:
1. Open "APIs & Services" > "Library" in Google Cloud Console
2. Search for and enable the above 2 APIs

##### 3-3. Create an API Key

1. Open "APIs & Services" > "Credentials"
2. Select "Create Credentials" > "API Key"
3. Copy the created API key

**Recommended to set restrictions on the API key for security:**
- **Application restrictions**: HTTP referrers (websites)
- **API restrictions**: Maps JavaScript API, Places API (New)
  - Note: Geometry Library is included in Maps JavaScript API - no separate restriction needed

#### 4. Environment Variable Configuration

Set your API key in the `VITE_GOOGLE_MAPS_API_KEY` environment variable.

##### Development Environment Setup Example

```bash
# Specify environment variable at startup
VITE_GOOGLE_MAPS_API_KEY="your_api_key_here" npm run dev
```

Or add to your shell configuration file (`.bashrc`, `.zshrc`, etc.):

```bash
export VITE_GOOGLE_MAPS_API_KEY="your_api_key_here"
```

### Usage

#### Start Development Server

```bash
npm run dev
```

Open `http://localhost:8000/` in your browser.

#### Production Build

```bash
# TypeScript compile + Vite build
npm run build

# Preview build result
npm run preview
```

Build output is generated in the `dist/` directory.

#### Code Quality Management

```bash
# Lint check
npm run lint

# Apply formatting
npm run format

# Lint + format batch check
npm run check

# Auto-fix
npm run check:fix
```

### How to Use the App

#### 1. Manipulate the Map
Move and zoom the map with mouse or touch to display the area where you want to fetch reviews

#### 2. Place Search (Optional)
Enter a place name or address in the search box to quickly jump to your destination

#### 3. Fetch Reviews
Click the "Get reviews in this area" button

**Process flow:**
1. Search for spots within the visible area (up to 20)
2. **Parallel fetch** details for each spot (Promise.allSettled)
3. Integrate reviews from all spots and display in timeline

#### 4. Browse Timeline
Reviews are displayed in the timeline on the right side

#### 5. Sort
Change the sort order with the dropdown at the top of the timeline:
- Newest first
- Oldest first
- Highest rating
- Lowest rating

### API Limits and Pricing

#### Free Tier

Google Maps Platform has a **$200 monthly free tier**:
- Maps JavaScript API: Up to 28,000 requests/month free
- Places API (New): Pricing varies by fields fetched

#### Estimated Usage Cost for This App

- Up to 20 spots per search
- Detail fetch for each spot (displayName, reviews, types, location)

**Important:** API usage and pricing can be checked in [Google Cloud Console](https://console.cloud.google.com/). Budget alerts are recommended.

#### Tips to Reduce Costs

- Narrow the search area
- Don't search too frequently
- Close the tab when not in use

### API Limitations

- **Review fetch limit**: Due to Places API (New) specifications, maximum 5 reviews per spot
- **Search spot count**: Limited to maximum 20 spots per search to reduce load
- **Search radius**: Maximum 5,000m due to Places API limits

### Troubleshooting

#### Map Not Displaying

- Verify that `VITE_GOOGLE_MAPS_API_KEY` environment variable is set
- Verify that Maps JavaScript API is enabled
- Check error messages in browser console

#### Can't Fetch Reviews

- Verify that **Places API (New)** is enabled (not Legacy version)
- Check API key restriction settings
- Verify that spots exist in the selected area
- Check browser console for `PERMISSION_DENIED` errors

#### "API Limit Exceeded" Error

- You may have exceeded the free tier
- Check usage in Google Cloud Console
- Wait a while and try again

### Contributing to Development

#### Pre-Pull Request Checklist

```bash
# Type check
npx tsc --noEmit

# Code quality check
npm run check

# Build verification
npm run build
```

### License

MIT License

### Notices

- This app uses Google Maps Platform API. Please comply with the terms of service
- Do not share your API key with third parties
- If using commercially, verify Google Maps Platform terms of service
