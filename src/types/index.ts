/**
 * 型定義
 */

export interface Review {
  author_name: string;
  rating: number;
  text: string;
  time: number;
  placeName?: string;
  placeTypes?: string[];
  placeLocation?: google.maps.LatLng;
}
