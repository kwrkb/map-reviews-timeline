# Map Reviews Timeline

Google Mapsで表示している範囲内のスポットの口コミを、X（旧Twitter）風のタイムラインUIで一覧表示するWebアプリケーションです。

## 特徴

- 🗺️ **インタラクティブな地図**: Google Maps上で自由に範囲を選択
- ⚡ **高速な口コミ取得**: Promise.allSettledによる並列処理で最大20スポットを高速取得
- 📝 **タイムライン表示**: X風のダークテーマUIで口コミを見やすく表示
- 🔄 **柔軟なソート**: 新しい順/古い順/高評価順/低評価順で並び替え
- 🔍 **地名検索**: 地名や住所で素早く目的地にジャンプ
- 🏗️ **モダンなアーキテクチャ**: TypeScript + Viteによる高速開発環境
- 🦀 **高速リント**: Biome（Rust製）による爆速コード品質チェック

## 技術スタック

### コア技術
- **TypeScript 5.3+**: 型安全な開発
- **Vite 5.0+**: 高速ビルドツール（HMR対応）
- **Google Maps JavaScript API**: 地図表示・操作
- **Google Places API (New)**: スポット情報・口コミ取得

### 開発ツール
- **Biome**: Rust製リンター/フォーマッター（ESLint + Prettier代替）

### アーキテクチャ

```
src/
├── app.ts                 # メインアプリケーション
├── types/
│   └── index.ts           # 型定義
├── services/
│   ├── MapService.ts      # Google Maps操作
│   ├── PlacesService.ts   # Places API (New) + 並列処理
│   └── StorageService.ts  # ユーティリティ
├── managers/
│   ├── UIManager.ts       # DOM操作・イベント管理
│   └── ReviewManager.ts   # レビュー表示・ソート
└── utils/
    └── helpers.ts         # ヘルパー関数
```

## セットアップ

### 1. リポジトリのクローン

```bash
git clone https://github.com/kwrkb/map-reviews-timeline.git
cd map-reviews-timeline
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. Google Cloud Platformの設定

#### 3-1. プロジェクトを作成

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新しいプロジェクトを作成

#### 3-2. 必要なAPIを有効化

以下の2つのAPIを**必ず**有効化してください：

- ✅ **Maps JavaScript API**
- ✅ **Places API (New)**

有効化手順：
1. Google Cloud Consoleで「APIとサービス」>「ライブラリ」を開く
2. 上記のAPIを検索して有効化

#### 3-3. APIキーを作成

1. 「APIとサービス」>「認証情報」を開く
2. 「認証情報を作成」>「APIキー」を選択
3. 作成されたAPIキーをコピー

**セキュリティのため、APIキーに制限を設定することを推奨：**
- **アプリケーションの制限**: HTTPリファラー（Webサイト）
- **APIの制限**: Maps JavaScript API、Places API (New)

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
