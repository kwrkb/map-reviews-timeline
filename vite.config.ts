import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  // import.meta.env.VITE_* はビルド時に静的置換されるため、キーが無いと
  // 起動直後の early return が定数 true になり、アプリ本体が丸ごと
  // デッドコード除去される（バンドルが 31kB → 1.6kB になる）。
  // ビルドが成功したまま空のアプリを出荷しないよう、ここで落とす。
  if (command === 'build' && !env.VITE_GOOGLE_MAPS_API_KEY) {
    throw new Error(
      'VITE_GOOGLE_MAPS_API_KEY が設定されていません。設定せずにビルドすると、アプリ本体が除去された成果物が生成されます。README.md を参照してください。'
    );
  }

  return {
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
  };
});
