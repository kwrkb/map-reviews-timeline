import type { PlaceDetailsResult, Review } from '../types';

/**
 * PlacesService
 * Google Places API の呼び出しを担当
 */
export class PlacesService {
  private placesService: google.maps.places.PlacesService;

  constructor(map: google.maps.Map) {
    this.placesService = new google.maps.places.PlacesService(map);
  }

  /**
   * 指定範囲内の近隣スポットを検索
   * @param bounds - 検索範囲
   * @returns スポットの配列
   */
  searchNearbyPlaces(bounds: google.maps.LatLngBounds): Promise<google.maps.places.PlaceResult[]> {
    return new Promise((resolve, reject) => {
      const center = bounds.getCenter();
      const radius = this.calculateRadius(bounds);

      const request: google.maps.places.PlaceSearchRequest = {
        location: center,
        radius: radius,
      };

      this.placesService.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          resolve(results);
        } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          resolve([]);
        } else {
          reject(new Error(`Places API error: ${status}`));
        }
      });
    });
  }

  /**
   * スポットの詳細情報を取得
   * @param placeId - スポットID
   * @returns スポットの詳細情報、またはnull
   */
  getPlaceDetails(placeId: string): Promise<PlaceDetailsResult | null> {
    return new Promise((resolve, reject) => {
      const request: google.maps.places.PlaceDetailsRequest = {
        placeId: placeId,
        fields: ['name', 'reviews', 'types', 'geometry'],
      };

      this.placesService.getDetails(request, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          resolve({
            name: place.name || '',
            reviews: place.reviews,
            types: place.types,
            geometry: place.geometry,
          });
        } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          resolve(null);
        } else {
          reject(new Error(`Place Details API error: ${status}`));
        }
      });
    });
  }

  /**
   * 複数スポットの詳細情報を並列取得
   * @param places - スポットの配列
   * @param maxPlaces - 最大取得数
   * @returns 口コミ付きスポット情報の配列
   */
  async fetchPlaceDetailsInParallel(
    places: google.maps.places.PlaceResult[],
    maxPlaces: number = 20
  ): Promise<Review[]> {
    const totalPlaces = Math.min(places.length, maxPlaces);

    const placeDetailsPromises = places.slice(0, totalPlaces).map((place) =>
      this.getPlaceDetails(place.place_id!)
    );

    const results = await Promise.allSettled(placeDetailsPromises);

    // 成功したリクエストから口コミを抽出
    const reviews: Review[] = [];
    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        const placeDetails = result.value;

        if (placeDetails.reviews && placeDetails.reviews.length > 0) {
          placeDetails.reviews.forEach((review) => {
            reviews.push({
              author_name: review.author_name || '匿名',
              profile_photo_url: review.profile_photo_url,
              rating: review.rating || 0,
              text: review.text || '',
              time: review.time || 0,
              placeName: placeDetails.name,
              placeTypes: placeDetails.types || [],
              placeLocation: placeDetails.geometry?.location,
            });
          });
        }
      } else if (result.status === 'rejected') {
        console.error('Place details error:', result.reason);
      }
    });

    return reviews;
  }

  /**
   * 地図の境界から検索半径を計算
   * @param bounds - 地図の境界
   * @returns 半径（メートル）
   */
  private calculateRadius(bounds: google.maps.LatLngBounds): number {
    const ne = bounds.getNorthEast();
    const center = bounds.getCenter();

    // 中心から北東角までの距離を計算
    const distance = google.maps.geometry.spherical.computeDistanceBetween(center, ne);

    // 最大5000mに制限（Places API の制限）
    return Math.min(distance, 5000);
  }
}
