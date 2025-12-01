/**
 * MapService
 * Google Maps の初期化と管理を担当
 */
export class MapService {
  private map: google.maps.Map | null = null;
  private isDarkMode: boolean = false;

  /**
   * Google Maps を初期化
   * @param element - 地図を表示する要素
   * @param options - 地図のオプション（center, zoom等）
   */
  initMap(element: HTMLElement, options?: Partial<google.maps.MapOptions>): google.maps.Map {
    const defaultOptions: google.maps.MapOptions = {
      center: { lat: 35.6812, lng: 139.7671 }, // 東京駅
      zoom: 15,
      styles: [], // デフォルトはライトモード
    };

    this.map = new google.maps.Map(element, {
      ...defaultOptions,
      ...options,
    });

    return this.map;
  }

  /**
   * 地図のテーマを切り替え
   */
  toggleTheme(): void {
    if (!this.map) return;

    this.isDarkMode = !this.isDarkMode;
    this.map.setOptions({
      styles: this.isDarkMode ? this.getDarkThemeStyles() : [],
    });
  }

  /**
   * 現在のテーマモードを取得
   */
  getIsDarkMode(): boolean {
    return this.isDarkMode;
  }

  /**
   * ダークテーマのスタイルを取得
   * @returns Google Maps のスタイル配列
   */
  private getDarkThemeStyles(): google.maps.MapTypeStyle[] {
    return [
      {
        featureType: 'all',
        elementType: 'geometry',
        stylers: [{ color: '#242f3e' }],
      },
      {
        featureType: 'all',
        elementType: 'labels.text.stroke',
        stylers: [{ color: '#242f3e' }],
      },
      {
        featureType: 'all',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#746855' }],
      },
      {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [{ color: '#17263c' }],
      },
    ];
  }

  /**
   * 地図の範囲を取得
   * @returns 地図の範囲、またはundefined
   */
  getBounds(): google.maps.LatLngBounds | undefined {
    return this.map?.getBounds();
  }

  /**
   * 地図のインスタンスを取得
   * @returns 地図のインスタンス、またはnull
   */
  getMap(): google.maps.Map | null {
    return this.map;
  }

  /**
   * 地図が初期化されているか確認
   * @returns 初期化されているか
   */
  isInitialized(): boolean {
    return this.map !== null;
  }

  /**
   * 指定した位置に地図の中心を移動
   * @param location - 移動先の緯度経度
   * @param zoom - ズームレベル（オプション）
   */
  panTo(location: google.maps.LatLngLiteral, zoom?: number): void {
    if (!this.map) return;

    this.map.panTo(location);
    if (zoom !== undefined) {
      this.map.setZoom(zoom);
    }
  }
}
