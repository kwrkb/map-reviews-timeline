import { ReviewManager } from './managers/ReviewManager';
import { UIManager } from './managers/UIManager';
import { MapService } from './services/MapService';
import { PlacesService } from './services/PlacesService';
import { getElement } from './utils/helpers';

/**
 * アプリケーションのメインクラス
 */
class App {
  private mapService: MapService;
  private uiManager: UIManager;
  private reviewManager: ReviewManager;
  private placesService: PlacesService | null = null;
  private apiKey: string = '';

  constructor() {
    this.mapService = new MapService();
    this.uiManager = new UIManager();
    this.reviewManager = new ReviewManager();
  }

  /**
   * アプリケーションを初期化
   */
  async init(): Promise<void> {
    // 環境変数からAPIキーを取得(必須)
    const envApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (envApiKey) {
      this.apiKey = envApiKey;
      // 環境変数がある場合は設定ボタンを非表示
      this.uiManager.hideSettingsButton();
      await this.loadGoogleMapsScript(this.apiKey);
    } else {
      // 環境変数が設定されていない場合はエラー表示
      this.uiManager.showError(
        'APIキーが設定されていません。環境変数 VITE_GOOGLE_MAPS_API_KEY を設定してください。'
      );
      return;
    }

    // イベントリスナーの設定
    this.setupEventListeners();
  }

  /**
   * イベントリスナーを設定
   */
  private setupEventListeners(): void {
    this.uiManager.setupEventListeners({
      onSaveApiKey: () => this.handleSaveApiKey(),
      onShowSettings: () => this.handleShowSettings(),
      onSearchReviews: () => this.handleSearchReviews(),
      onSortChange: () => this.handleSortChange(),
      onPlaceSearch: () => this.handlePlaceSearch(),
      onThemeToggle: () => this.handleThemeToggle(),
    });
  }

  /**
   * Google Maps スクリプトを読み込み
   * @param apiKey - APIキー
   */
  private loadGoogleMapsScript(apiKey: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&language=ja`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        this.initMap();
        resolve();
      };

      script.onerror = () => {
        this.uiManager.showError(
          'Google Maps APIの読み込みに失敗しました。APIキーを確認してください。'
        );
        this.uiManager.showApiKeyModal(apiKey);
        reject(new Error('Failed to load Google Maps API'));
      };

      document.head.appendChild(script);
    });
  }

  /**
   * 地図を初期化
   */
  private initMap(): void {
    const mapElement = getElement<HTMLDivElement>('map');
    this.mapService.initMap(mapElement);

    // PlacesService を初期化
    this.placesService = new PlacesService();
  }

  /**
   * APIキー保存処理(無効化)
   */
  private async handleSaveApiKey(): Promise<void> {
    this.uiManager.showError(
      'APIキーの保存は無効化されています。環境変数 VITE_GOOGLE_MAPS_API_KEY を設定してください。'
    );
  }

  /**
   * 設定表示処理(無効化)
   */
  private handleShowSettings(): void {
    this.uiManager.showError(
      '設定は無効化されています。環境変数 VITE_GOOGLE_MAPS_API_KEY を設定してください。'
    );
  }

  /**
   * 口コミ検索処理
   */
  private async handleSearchReviews(): Promise<void> {
    if (!this.mapService.isInitialized()) {
      this.uiManager.showError('地図が初期化されていません');
      return;
    }

    if (!this.placesService) {
      this.uiManager.showError('PlacesServiceが初期化されていません');
      return;
    }

    const bounds = this.mapService.getBounds();
    if (!bounds) {
      this.uiManager.showError('地図の範囲を取得できませんでした');
      return;
    }

    // ローディング表示
    this.uiManager.setLoading(true);
    this.reviewManager.clearReviews();
    this.uiManager.clearTimeline();

    try {
      // Nearby Searchで範囲内のスポットを取得
      const places = await this.placesService.searchNearbyPlaces(bounds);

      if (places.length === 0) {
        this.uiManager.showError('この範囲にスポットが見つかりませんでした');
        this.uiManager.setLoading(false);
        return;
      }

      // 各スポットの詳細（口コミ含む）を並列取得
      const totalPlaces = Math.min(places.length, 20);
      this.uiManager.updateLoadingText(`口コミを取得中... (${totalPlaces}スポット)`);

      const reviews = await this.placesService.fetchPlaceDetailsInParallel(places, 20);

      if (reviews.length === 0) {
        this.uiManager.showError('口コミが見つかりませんでした');
      } else {
        this.reviewManager.setReviews(reviews);
        this.displaySortedReviews();
      }
    } catch (error) {
      console.error('Search error:', error);
      this.uiManager.showError('口コミの取得中にエラーが発生しました');
    } finally {
      this.uiManager.setLoading(false);
    }
  }

  /**
   * ソート変更処理
   */
  private handleSortChange(): void {
    this.displaySortedReviews();
  }

  /**
   * ソートされた口コミを表示
   */
  private displaySortedReviews(): void {
    const sortType = this.uiManager.getSortType();
    const sortedReviews = this.reviewManager.sortReviews(sortType);
    const reviewCards = sortedReviews.map((review) => this.reviewManager.createReviewCard(review));
    this.uiManager.displayReviews(reviewCards);
  }

  /**
   * 地名検索処理
   */
  private async handlePlaceSearch(): Promise<void> {
    const searchQuery = this.uiManager.getPlaceSearchInput();

    if (!searchQuery) {
      this.uiManager.showError('検索する地名を入力してください');
      return;
    }

    if (!this.placesService) {
      this.uiManager.showError('PlacesServiceが初期化されていません');
      return;
    }

    try {
      const location = await this.placesService.searchPlaceByText(searchQuery);

      if (location) {
        this.mapService.panTo({ lat: location.lat(), lng: location.lng() }, 15);
      } else {
        this.uiManager.showError(`「${searchQuery}」が見つかりませんでした`);
      }
    } catch (error) {
      console.error('Place Search error:', error);
      this.uiManager.showError('地名検索中にエラーが発生しました');
    }
  }

  /**
   * テーマ切り替え処理
   */
  private handleThemeToggle(): void {
    this.mapService.toggleTheme();
    const isDarkMode = this.mapService.getIsDarkMode();
    this.uiManager.updateThemeToggleIcon(isDarkMode);
  }
}

// アプリケーション起動
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
