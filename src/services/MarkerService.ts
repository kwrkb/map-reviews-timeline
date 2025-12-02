import { MarkerClusterer } from '@googlemaps/markerclusterer';
import type { Review } from '../types';

/**
 * MarkerService
 * Advanced Marker の作成とクラスタリング管理を担当
 */
export class MarkerService {
  private map: google.maps.Map | null = null;
  private markers: google.maps.marker.AdvancedMarkerElement[] = [];
  private markerClusterer: MarkerClusterer | null = null;
  private markerToReviewMap: Map<google.maps.marker.AdvancedMarkerElement, Review> = new Map();

  /**
   * マップインスタンスを設定
   * @param map - Google Maps インスタンス
   */
  setMap(map: google.maps.Map): void {
    this.map = map;
  }

  /**
   * クチコミからマーカーを作成
   * @param reviews - クチコミの配列
   * @param onMarkerClick - マーカークリック時のコールバック
   */
  async createMarkersFromReviews(
    reviews: Review[],
    onMarkerClick?: (review: Review) => void
  ): Promise<void> {
    if (!this.map) {
      console.error('Map is not initialized');
      return;
    }

    // 既存のマーカーをクリア
    this.clearMarkers();

    // 位置情報のあるクチコミのみフィルタリング
    const reviewsWithLocation = reviews.filter((review) => review.placeLocation);

    // マーカーを作成
    const markerPromises = reviewsWithLocation.map((review) =>
      this.createMarker(review, onMarkerClick)
    );

    this.markers = (await Promise.all(markerPromises)).filter(
      (marker): marker is google.maps.marker.AdvancedMarkerElement => marker !== null
    );

    // クラスタリングを適用
    this.applyClusterer();
  }

  /**
   * 単一のマーカーを作成
   * @param review - クチコミオブジェクト
   * @param onMarkerClick - クリック時のコールバック
   * @returns Advanced Marker または null
   */
  private async createMarker(
    review: Review,
    onMarkerClick?: (review: Review) => void
  ): Promise<google.maps.marker.AdvancedMarkerElement | null> {
    if (!this.map || !review.placeLocation) return null;

    // 評価に基づいた色を決定
    const color = this.getColorByRating(review.rating);

    // カスタムマーカー要素を作成
    const pinElement = new google.maps.marker.PinElement({
      background: color,
      borderColor: '#ffffff',
      glyphColor: '#ffffff',
      scale: 1.2,
    });

    // Advanced Marker を作成
    const marker = new google.maps.marker.AdvancedMarkerElement({
      map: this.map,
      position: review.placeLocation,
      content: pinElement.element,
      title: `${review.placeName} - ${review.rating}★`,
    });

    // マーカーとレビューの関連付け
    this.markerToReviewMap.set(marker, review);

    // クリックイベント
    if (onMarkerClick) {
      marker.addListener('click', () => {
        onMarkerClick(review);
      });
    }

    return marker;
  }

  /**
   * 評価に基づいた色を取得
   * @param rating - 評価（1-5）
   * @returns 色コード
   */
  private getColorByRating(rating: number): string {
    if (rating >= 4) return '#10b981'; // 緑（高評価）
    if (rating >= 3) return '#f59e0b'; // 黄色（中評価）
    return '#ef4444'; // 赤（低評価）
  }

  /**
   * マーカークラスタリングを適用
   */
  private applyClusterer(): void {
    if (!this.map || this.markers.length === 0) return;

    // 既存のクラスタラーをクリア
    if (this.markerClusterer) {
      this.markerClusterer.clearMarkers();
    }

    // 新しいクラスタラーを作成
    this.markerClusterer = new MarkerClusterer({
      map: this.map,
      markers: this.markers,
    });
  }

  /**
   * すべてのマーカーをクリア
   */
  clearMarkers(): void {
    // マーカーを地図から削除
    this.markers.forEach((marker) => {
      marker.map = null;
    });

    // クラスタラーをクリア
    if (this.markerClusterer) {
      this.markerClusterer.clearMarkers();
      this.markerClusterer = null;
    }

    // 配列とマップをクリア
    this.markers = [];
    this.markerToReviewMap.clear();
  }

  /**
   * 特定のマーカーをハイライト
   * @param review - ハイライトするクチコミ
   */
  highlightMarker(review: Review): void {
    const marker = Array.from(this.markerToReviewMap.entries()).find(([_, r]) => r === review)?.[0];

    if (marker && marker.content instanceof HTMLElement) {
      // バウンスアニメーション
      marker.content.style.animation = 'bounce 0.5s';

      setTimeout(() => {
        if (marker.content instanceof HTMLElement) {
          marker.content.style.animation = '';
        }
      }, 500);
    }
  }

  /**
   * マーカーの数を取得
   * @returns マーカーの数
   */
  getMarkerCount(): number {
    return this.markers.length;
  }
}
