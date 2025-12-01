/**
 * 型定義
 */

export interface Review {
  author_name: string;
  profile_photo_url?: string;
  rating: number;
  text: string;
  time: number;
  placeName?: string;
  placeTypes?: string[];
  placeLocation?: google.maps.LatLng;
}

export interface PlaceDetailsResult {
  name: string;
  reviews?: google.maps.places.PlaceReview[];
  types?: string[];
  geometry?: google.maps.places.PlaceGeometry;
}
