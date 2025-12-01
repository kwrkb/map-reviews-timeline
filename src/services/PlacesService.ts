import type { PlaceDetailsResult, Review } from '../types';

/**
 * PlacesService
 * Google Places API (New) の呼び出しを担当
 */
export class PlacesService {
  /**
   * 指定範囲内の近隣スポットを検索
   * @param bounds - 検索範囲
   * @returns スポットの配列
   */
  async searchNearbyPlaces(bounds: google.maps.LatLngBounds): Promise<google.maps.places.Place[]> {
    // New Places API: searchNearby
    // boundsをlocationRestriction（円形）に変換
    const center = bounds.getCenter();
    const radius = this.calculateRadius(bounds);

    const request = {
      // FIXED: fields must be specified in the request
      fields: ['id', 'displayName', 'formattedAddress', 'location', 'types'],
      locationRestriction: {
        center: { lat: center.lat(), lng: center.lng() },
        radius: radius,
      },
    };

    try {
      // FIXED: Correct method call
      const { places } = await google.maps.places.Place.searchNearby(request);
      return places || [];
    } catch (error) {
      console.error('Places Search error:', error);
      return [];
    }
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

  /**
   * スポットの詳細情報を取得
   * @param placeId - スポットID
   * @returns スポットの詳細情報、またはnull
   */
  async getPlaceDetails(placeId: string): Promise<PlaceDetailsResult | null> {
    try {
      const place = new google.maps.places.Place({ id: placeId });
      // FIXED: Correct field names for New Places API
      await place.fetchFields({
        fields: ['displayName', 'reviews', 'types', 'location'],
      });

      // FIXED: Correct property access for New Places API
      return {
        name: place.displayName || '',
        reviews: place.reviews || [],
        types: place.types || [],
        // biome-ignore lint/suspicious/noExplicitAny: New Places API geometry adaptation
        geometry: { location: place.location } as any,
      };
    } catch (error) {
      console.error('Place Details error:', error);
      return null;
    }
  }

  /**
   * 複数スポットの詳細情報を並列取得
   * @param places - スポットの配列
   * @param maxPlaces - 最大取得数
   * @returns 口コミ付きスポット情報の配列
   */
  async fetchPlaceDetailsInParallel(
    places: google.maps.places.Place[],
    maxPlaces: number = 20
  ): Promise<Review[]> {
    const totalPlaces = Math.min(places.length, maxPlaces);

    const placeDetailsPromises = places
      .slice(0, totalPlaces)
      .filter((place) => place.id)
      .map((place) => this.getPlaceDetails(place.id as string));

    const results = await Promise.allSettled(placeDetailsPromises);

    // 成功したリクエストから口コミを抽出
    const reviews: Review[] = [];
    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        const placeDetails = result.value;

        if (placeDetails.reviews && placeDetails.reviews.length > 0) {
          // biome-ignore lint/suspicious/noExplicitAny: New Places API review structure
          placeDetails.reviews.forEach((review: any) => {
            // FIXED: Correct field access for New Places API Review
            reviews.push({
              author_name: review.authorAttribution?.displayName || '匿名',
              profile_photo_url: review.authorAttribution?.photoUri,
              rating: review.rating || 0,
              // FIXED: Use 'text' property (not 'originalText')
              text: review.text?.text || review.text || '',
              // FIXED: publishTime is an object with 'seconds' property in New API
              time: review.publishTime?.seconds || Math.floor(Date.now() / 1000),
              placeName: placeDetails.name,
              placeTypes: placeDetails.types || [],
              placeLocation: placeDetails.geometry?.location,
            });
          });
        }
      }
    });

    return reviews;
  }

  /**
   * 地名から位置情報を検索（Text Search）
   * @param query - 地名または住所
   * @returns 位置情報、または null
   */
  async searchPlaceByText(query: string): Promise<google.maps.LatLng | null> {
    try {
      const request = {
        textQuery: query,
        // FIXED: fields must be specified as an array
        fields: ['location'],
      };
      const { places } = await google.maps.places.Place.searchByText(request);

      if (places && places.length > 0 && places[0].location) {
        return places[0].location;
      }
      return null;
    } catch (error) {
      console.error('Text Search error:', error);
      return null;
    }
  }
}
