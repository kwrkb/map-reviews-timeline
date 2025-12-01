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
  // biome-ignore lint/suspicious/noExplicitAny: New Places API review type is not yet fully typed
  reviews?: any[];
  types?: string[];
  geometry?: { location: google.maps.LatLng };
}
