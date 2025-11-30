# Map Reviews Timeline

Google Mapsで表示している範囲内のスポットの口コミを、X（旧Twitter）風のタイムラインUIで一覧表示するWebアプリケーションです。

## 特徴

- 🗺️ Google Maps上で自由に範囲を選択
- 📝 選択範囲内のスポットの口コミを一括取得
- 🌙 X風のダークテーマUI
- 🔄 新しい順/古い順/高評価順/低評価順でソート可能
- 🔒 APIキーはブラウザのlocalStorageに安全に保存

## 必要なもの

- Google Maps Platform APIキー（無料枠あり）
- モダンなWebブラウザ

## セットアップ手順

### 1. Google Cloud Platformでプロジェクトを作成

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成

### 2. 必要なAPIを有効化

以下のAPIを有効化してください：

- **Maps JavaScript API**
- **Places API (New)**

有効化手順：
1. Google Cloud Consoleで「APIとサービス」>「ライブラリ」を開く
2. 上記のAPIを検索して有効化

### 3. APIキーを作成

1. 「APIとサービス」>「認証情報」を開く
2. 「認証情報を作成」>「APIキー」を選択
3. 作成されたAPIキーをコピー

**セキュリティのため、APIキーに制限を設定することを推奨：**
- アプリケーションの制限: HTTPリファラー（Webサイト）
- APIの制限: Maps JavaScript API、Places API

### 4. アプリケーションの起動

#### ローカルサーバーで実行（推奨）

Google Maps APIはHTTPSまたはlocalhostからのリクエストのみ許可するため、ローカルサーバーを使用してください。

```bash
# Pythonを使用する場合
python -m http.server 8000

# Node.jsのhttp-serverを使用する場合
npx http-server -p 8000
```

ブラウザで `http://localhost:8000` を開く

#### VS Code Live Serverを使用

1. VS Codeで「Live Server」拡張機能をインストール
2. `index.html`を右クリック > 「Open with Live Server」

### 5. APIキーの設定

1. アプリケーションを開くと、APIキー入力モーダルが表示されます
2. 取得したAPIキーを入力して「保存」をクリック
3. APIキーはlocalStorageに保存され、次回以降は自動で読み込まれます

## 使い方

1. **地図を操作**
   マウスやタッチで地図を移動・ズームして、口コミを取得したい範囲を表示

2. **口コミを取得**
   「この範囲の口コミを取得」ボタンをクリック

3. **タイムラインで閲覧**
   右側のタイムラインに口コミが表示されます

4. **ソート**
   タイムライン上部のドロップダウンで並び順を変更できます
   - 新しい順
   - 古い順
   - 高評価順
   - 低評価順

## API制限と料金について

### 無料枠

Google Maps Platformには月額$200の無料枠があります：
- Maps JavaScript API: 28,000回/月まで無料
- Places API: 取得するフィールドによって課金が異なります

### このアプリの利用料金目安

- 1回の検索で最大20スポット取得
- 各スポットの詳細取得（reviews、name、types、geometry）

**重要:** APIの使用量と料金は[Google Cloud Console](https://console.cloud.google.com/)で確認できます。予算アラートを設定することをお勧めします。

### 料金を抑えるコツ

- 検索範囲を狭くする
- 頻繁に検索しすぎない
- 使わないときはタブを閉じる

## 技術仕様

### 使用技術

- HTML5
- CSS3（X風ダークテーマ）
- Vanilla JavaScript（フレームワーク不使用）
- Google Maps JavaScript API
- Google Places API (New)

### 対応ブラウザ

- Google Chrome（最新版）
- Firefox（最新版）
- Safari（最新版）
- Edge（最新版）

### API制限

- **口コミ取得制限**: Places APIの仕様により、1スポットあたり最大5件の口コミのみ取得可能
- **検索スポット数**: 負荷軽減のため、1回の検索で最大20スポットに制限
- **検索半径**: Places API の上限により最大5,000mまで

## トラブルシューティング

### 地図が表示されない

- APIキーが正しく設定されているか確認
- Maps JavaScript APIが有効化されているか確認
- ブラウザのコンソールでエラーメッセージを確認

### 口コミが取得できない

- Places APIが有効化されているか確認
- APIキーの制限設定を確認（制限が厳しすぎる可能性）
- 選択範囲にスポットが存在するか確認

### "API制限超過" エラー

- 無料枠を超えた可能性があります
- Google Cloud Consoleで使用量を確認
- しばらく時間を置いてから再試行

## ライセンス

MIT License

## 注意事項

- このアプリはGoogle Maps Platform APIを使用します。利用規約を遵守してください
- APIキーは第三者に共有しないでください
- 本アプリはデモ目的で作成されています。商用利用する場合はGoogle Maps Platformの利用規約を確認してください
