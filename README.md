# Map Reviews Timeline

Google Mapsで表示している範囲内のスポットの口コミを、X（旧Twitter）風のタイムラインUIで一覧表示するWebアプリケーションです。

## 特徴

- 🗺️ **インタラクティブな地図**: Google Maps上で自由に範囲を選択
- ⚡ **高速な口コミ取得**: Promise.allSettled による並列処理で最大20スポットを高速取得
- 📝 **タイムライン表示**: X風のダークテーマUIで口コミを見やすく表示
- 🔄 **柔軟なソート**: 新しい順/古い順/高評価順/低評価順で並び替え
- 🔒 **セキュアなキー管理**: 環境変数またはlocalStorageでAPIキーを安全に保存
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
- **WSL2最適化**: ファイル変更検知とネットワークアクセスの最適化

### アーキテクチャ

```
src/
├── app.ts                 # メインアプリケーション
├── types/
│   └── index.ts           # 型定義
├── services/
│   ├── StorageService.ts  # localStorage管理
│   ├── MapService.ts      # Google Maps操作
│   └── PlacesService.ts   # Places API + 並列処理
├── managers/
│   ├── UIManager.ts       # DOM操作・イベント管理
│   └── ReviewManager.ts   # レビュー表示・ソート
└── utils/
    └── helpers.ts         # ユーティリティ関数
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

### 3. Google Cloud Platform の設定

#### 3-1. プロジェクトを作成

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新しいプロジェクトを作成

#### 3-2. 必要なAPIを有効化

以下のAPIを有効化してください：

- **Maps JavaScript API**
- **Places API (New)**

有効化手順：
1. Google Cloud Console で「APIとサービス」>「ライブラリ」を開く
2. 上記のAPIを検索して有効化

#### 3-3. APIキーを作成

1. 「APIとサービス」>「認証情報」を開く
2. 「認証情報を作成」>「APIキー」を選択
3. 作成されたAPIキーをコピー

**セキュリティのため、APIキーに制限を設定することを推奨：**
- アプリケーションの制限: HTTPリファラー（Webサイト）
- APIの制限: Maps JavaScript API、Places API

### 4. APIキーの設定（2つの方法）

#### 方法A: 環境変数を使用（推奨）

```bash
# .env ファイルを作成
cp .env.example .env

# .env を編集してAPIキーを設定
# VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
```

環境変数を使用すると、設定ボタンが自動的に非表示になります。

#### 方法B: ブラウザで手動設定

環境変数を設定しない場合、アプリ起動時にモーダルが表示されるので、そこでAPIキーを入力してください。
APIキーは localStorage に保存されます。

## 使い方

### 開発サーバーの起動

```bash
npm run dev
```

#### WSL2環境の場合

開発サーバーが以下のように複数のアドレスで起動します：

```
➜  Local:   http://localhost:8000/
➜  Network: http://192.168.0.100:8000/
➜  Network: http://100.118.52.120:8000/
```

Windows側のブラウザで任意のアドレスを開いてください。
HMR（Hot Module Replacement）が自動で動作し、ファイル変更が即座に反映されます。

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

### 2. 口コミを取得
「この範囲の口コミを取得」ボタンをクリック

**処理の流れ:**
1. 表示範囲内のスポットを検索（最大20件）
2. 各スポットの詳細を **並列取得**（Promise.allSettled）
3. 全スポットの口コミを統合してタイムライン表示

### 3. タイムラインで閲覧
右側のタイムラインに口コミが表示されます

### 4. ソート
タイムライン上部のドロップダウンで並び順を変更できます：
- 新しい順
- 古い順
- 高評価順
- 低評価順

## API制限と料金について

### 無料枠

Google Maps Platform には月額 $200 の無料枠があります：
- Maps JavaScript API: 28,000回/月まで無料
- Places API: 取得するフィールドによって課金が異なります

### このアプリの利用料金目安

- 1回の検索で最大20スポット取得
- 各スポットの詳細取得（reviews、name、types、geometry）

**重要:** APIの使用量と料金は [Google Cloud Console](https://console.cloud.google.com/) で確認できます。予算アラートを設定することをお勧めします。

### 料金を抑えるコツ

- 検索範囲を狭くする
- 頻繁に検索しすぎない
- 使わないときはタブを閉じる

## 開発環境

### 対応ブラウザ

- Google Chrome（最新版）
- Firefox（最新版）
- Safari（最新版）
- Edge（最新版）

**注意**: ES Modules をネイティブでサポートするモダンブラウザが必要です。

### WSL2環境での注意事項

このプロジェクトは WSL2 環境に最適化されています：

✅ **ファイル変更検知**: ポーリングベースの監視で確実にHMRが動作
✅ **ネットワークアクセス**: すべてのインターフェースでリッスンしWindows側からアクセス可能
✅ **高速ビルド**: Vite + Biome（Rust製）による高速開発体験

## API制限

- **口コミ取得制限**: Places APIの仕様により、1スポットあたり最大5件の口コミのみ取得可能
- **検索スポット数**: 負荷軽減のため、1回の検索で最大20スポットに制限
- **検索半径**: Places API の上限により最大5,000mまで

## トラブルシューティング

### 地図が表示されない

- APIキーが正しく設定されているか確認（`.env` または localStorage）
- Maps JavaScript API が有効化されているか確認
- ブラウザのコンソールでエラーメッセージを確認

### 口コミが取得できない

- Places API が有効化されているか確認
- APIキーの制限設定を確認（制限が厳しすぎる可能性）
- 選択範囲にスポットが存在するか確認

### HMRが動作しない（WSL2）

通常は自動で動作しますが、問題がある場合：

1. `vite.config.ts` で `server.watch.usePolling: true` が設定されているか確認
2. 開発サーバーを再起動

### "API制限超過" エラー

- 無料枠を超えた可能性があります
- Google Cloud Console で使用量を確認
- しばらく時間を置いてから再試行

## 開発に貢献する

### ブランチ戦略

- `main`: 本番環境
- `feature/*`: 新機能開発
- `fix/*`: バグ修正

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

- このアプリは Google Maps Platform API を使用します。利用規約を遵守してください
- APIキーは第三者に共有しないでください
- 本アプリはデモ目的で作成されています。商用利用する場合は Google Maps Platform の利用規約を確認してください
