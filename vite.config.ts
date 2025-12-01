import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
  },
  server: {
    port: 8000,
    // WSL2 最適化: すべてのネットワークインターフェースでリッスン
    // Windows側のブラウザから localhost でアクセス可能に
    host: true,
    // WSL2 最適化: ポートが使用中の場合に別ポートを試す
    strictPort: false,
    // WSL2 ではブラウザ自動起動をオフ（Windows側で手動起動）
    open: false,
    // WSL2 最適化: ファイル変更検知（HMR）の設定
    watch: {
      // ポーリングベースの監視を使用（WSL2でのファイル変更検知を確実に）
      usePolling: true,
      // ポーリング間隔（ミリ秒）
      interval: 100,
    },
    // HMR エラーオーバーレイを表示
    hmr: {
      overlay: true,
    },
  },
});
