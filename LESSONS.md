# LESSONS

判断の記録。追記専用（過去エントリは編集・削除しない）。

## 2026-08-07: VITE_ 環境変数の未設定をビルド時エラーにする

- **却下した案**:
  - 実行時チェックのみで済ませる（`app.ts` 冒頭の `if (!envApiKey) { showError(); return; }`）。既存の実装がこれだった
  - `vite.config.ts` の `define` でダミー値を注入してビルドを通す
- **決め手**: `import.meta.env.VITE_GOOGLE_MAPS_API_KEY` はビルド時に静的置換されるため、未設定だと early return が定数 true になり、Rollup が以降の処理を全てデッドコード除去する。実測で `dist/assets/index.js` が **31.61 kB → 1.58 kB**、バンドル内の "クチコミ" 文字列が 2 件 → 0 件になり、`npm run build` は exit 0 のまま成功する。実行時チェックは「除去されたバンドル」が出荷されるのを一切防げない
- **覆す条件**: キーの供給がビルド時注入でなくなったとき（実行時 fetch や `/config.json` 読み込みに変えた場合）。その場合は静的置換が起きないのでデッドコード除去も起きない

## 2026-08-07: 未使用の service/manager レイヤ（約500行）を削除

- **却下した案**: 「将来の統合先」として残す（CLAUDE.md にそう明記されていた）。`app.ts` のロジックをこれらへ移譲する方向でリファクタする
- **決め手**: `app.ts` の import は `MarkerService` と `types` のみ。`UIManager` は index.html に存在しない `apiKeyModal` を `getElement()`（見つからなければ throw する実装）で参照しており、**使った瞬間に例外になる**。`StorageService` は環境変数のみに移行した d30d6ba で廃止済みの localStorage キー管理。`ReviewManager` / `utils/helpers` は `app.ts` 内の実装と重複していて、Places API (New) 移行前の古い版。統合先として機能しないコードだった
- **覆す条件**: 2つ目の呼び出し元が実際に現れたとき。その時点で必要な分だけ抽出する（先に器だけ作らない）

## 2026-08-07: 常に非表示のアバター img は、エスケープ強化ではなく要素ごと削除

- **却下した案**: `<img src="${profilePhoto}">` に `escapeHtml()` と URL スキーム検証（`sanitizeImageUrl()`）を足して XSS 経路を塞ぐ。一度この実装を入れた
- **決め手**: `style.css` の `.avatar { display: none; }` により、この img は通常時もレスポンシブ時も**一度も表示されない**。CLAUDE.md の UI 仕様も「Compact review cards without avatars」で非表示が正。表示されない要素のために外部由来 URL を DOM に流す理由がなく、削除すれば XSS 経路・インライン `onerror`（CSP 阻害要因）・フォールバック処理が同時に消える
- **覆す条件**: アバター表示を UI 仕様として復活させるとき。その際は `img.src` への DOM 代入（innerHTML 補間ではなく）で実装する

## 2026-08-07: escapeHtml で引用符も明示的にエスケープする

- **却下した案**: `textContent` → `innerHTML` の変換だけに任せる（既存実装）
- **決め手**: この変換がエスケープするのは `& < >` のみで、`"` `'` は素通しになる。`alt="${escapeHtml(review.author_name)}"` のような**属性値**に使うと、値に `"` が含まれた時点で属性を脱出できる。テキストコンテキストと属性コンテキストで別関数を使い分けるより、片方に寄せるほうが誤用が起きない
- **覆す条件**: innerHTML 組み立てをやめて全て DOM API で構築するようになったとき（その場合エスケープ自体が不要になる）

## 2026-08-07: vite を 5 → 8 にメジャー更新

- **却下した案**: `npm audit fix`（非破壊）だけで止め、esbuild の勧告は別タスクにする
- **決め手**: `npm audit fix` 後も esbuild <=0.24.2 の GHSA-67mh-4wv8-2f99（任意のサイトが dev サーバーにリクエストしてレスポンスを読める）が残り、解消には vite 8 が必要。本プロジェクトは WSL2 向けに `server.host: true` で全インターフェースに bind しており、この勧告が直接刺さる構成。実際に更新したところ Node 24.18.0 上で `vite.config.ts` の変更なしにビルドが通り（31.41 kB、既存と同等）、脆弱性は 0 件になった
- **覆す条件**: vite 8 が要求する Node バージョンを満たさない環境でのビルドが必要になったとき

## 2026-08-07: window へのグローバル拡張は `as any` ではなく `declare global`

- **却下した案**: `(window as any).gm_authFailure = ...` を残し、biome の `noExplicitAny` warning を許容する（設定上は warn なのでビルドは通る）
- **決め手**: Google Maps API が要求するグローバルは `gm_authFailure` と `initMapCallback` の2つだけで、`declare global { interface Window { ... } }` 6行で型が付く。`as any` は代入先のタイポ（`initMapCallbak` 等）を型検査で捕まえられず、スクリプトの `callback=initMapCallback` と食い違っても実行時まで気付けない。この置換で biome の warning は 2件 → 0件になった
- **覆す条件**: 動的に決まる名前でグローバルを生やす必要が出たとき

## 2026-08-07: 依存のメジャー更新時は engines を明示する

- **却下した案**: vite 5 → 8 の更新だけ行い、Node バージョン要件は package.json に書かない（従来どおり engines なし）
- **決め手**: vite 8 の package.json は `engines: {"node": "^20.19.0 || >=22.12.0"}` を宣言しており、この制約が package-lock.json には入る一方、プロジェクト側には engines も README の Node 要件も無かった。Node 18 や 20.18 以下の環境では `npm install` は通るのにビルドだけ失敗する状態になっていた（Codex のレビュー指摘 P2 で発覚）
- **覆す条件**: 依存の中で最も要求の厳しい engines が緩和されたとき。その場合はプロジェクトの engines も追随して下げる

## 2026-08-07: Place Details の取得を逐次 await から Promise.allSettled に変更

- **却下した案**:
  - 逐次 for-await ループのまま維持する（変更前の実装）
  - 同時実行数を 6 程度に絞ってレート制限を避ける（PR レビュー時に「取得件数が減るなら追加する」と保留した案）
- **決め手**: 実 API キーで同一エリア・同一20スポットに対して両方式を直接計測した結果、**並列 299ms / 逐次 1981ms（6.6倍）**、取得クチコミは**両方式とも 100件で一致**、rejected は **0件**。並列を先に・逐次を後に実行してキャッシュ面で並列側が不利になる順序にしてもこの差だった。20件同時発行でレート制限に当たり取得件数が静かに減る懸念があったが、実測で否定されたため同時実行数の制限は入れない
- **覆す条件**: 1スポットあたりの取得上限（現在20件）を引き上げるとき。同時発行数が増えれば Places API 側の挙動は変わり得るので、その時点で再計測する

## 2026-08-07: APIキーのリファラー制限は localhost を明示的に許可する必要がある

- **却下した案**: キーが取得できていれば localhost の dev サーバーでも動くはずと考え、失敗をコード側の不具合として調査する
- **決め手**: dev サーバー起動後、コンソールに `RefererNotAllowedMapError / Your site URL to be authorized: http://localhost:8000/` が出た。キー自体は正しく読み込まれ `initMap()` も成功しており、Google Cloud 側の HTTP リファラー制限に localhost が含まれていないことが原因だった。Cloud Console で `http://localhost:8000/*` を追加後、反映まで**約5分**かかった（1分間隔でリロードし5回目で通過）
- **覆す条件**: キーのアプリケーション制限を「なし」に変更したとき（ただしキーはバンドルに埋め込まれるため、制限を外す運用は推奨しない）
