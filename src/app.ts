import { MarkerService } from './services/MarkerService';
import type { Review } from './types';

// ===== 型定義 =====
interface PlaceDetailsResult {
  name: string;
  reviews?: google.maps.places.PlaceReview[];
  types?: string[];
  geometry?: google.maps.places.PlaceGeometry;
}

// ===== グローバル変数 =====
let map: google.maps.Map | null = null;
let allReviews: Review[] = [];
let apiKey: string = '';
let currentMarker: google.maps.Marker | null = null;
let markerService: MarkerService | null = null;
let isDarkMode: boolean = true; // デフォルトはダークモード

// ===== DOM要素のヘルパー =====
function getElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Element with id "${id}" not found`);
  }
  return element as T;
}

// ===== 初期化 =====
document.addEventListener('DOMContentLoaded', () => {
  // テーマの初期化（localStorageから取得、デフォルトはダーク）
  const savedTheme = localStorage.getItem('theme');
  isDarkMode = savedTheme !== 'light';
  applyTheme();

  // 環境変数からAPIキーを取得（環境変数のみ使用）
  const envApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!envApiKey) {
    showError('環境変数 VITE_GOOGLE_MAPS_API_KEY が設定されていません。README.mdを参照してください。');
    return;
  }

  apiKey = envApiKey;

  // 環境変数がある場合は設定ボタンとモーダルを非表示
  const settingsBtn = document.getElementById('settingsBtn');
  const apiKeyModal = document.getElementById('apiKeyModal');
  if (settingsBtn) {
    settingsBtn.style.display = 'none';
  }
  if (apiKeyModal) {
    apiKeyModal.style.display = 'none';
  }

  loadGoogleMapsScript();

  // イベントリスナーの設定
  getElement<HTMLButtonElement>('searchReviewsBtn').addEventListener('click', searchReviews);
  getElement<HTMLSelectElement>('sortSelect').addEventListener('change', sortAndDisplayReviews);
  getElement<HTMLButtonElement>('placeSearchBtn').addEventListener('click', searchPlace);
  getElement<HTMLInputElement>('placeSearchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      searchPlace();
    }
  });
  getElement<HTMLButtonElement>('themeToggleBtn').addEventListener('click', toggleTheme);
});

// ===== Google Maps スクリプト読み込み =====
function loadGoogleMapsScript(): void {
  // Google Maps APIのエラーハンドラーを設定
  (window as any).gm_authFailure = () => {
    console.error('Google Maps API authentication failed');
    showError(
      'Google Maps APIの認証に失敗しました。環境変数 VITE_GOOGLE_MAPS_API_KEY を確認してください。'
    );
  };

  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry,marker&language=ja&callback=initMapCallback`;
  script.async = true;
  script.defer = true;
  script.onerror = () => {
    showError(
      'Google Maps APIのスクリプト読み込みに失敗しました。ネットワーク接続を確認してください。'
    );
  };

  // グローバルコールバック関数を設定
  (window as any).initMapCallback = () => {
    initMap();
  };

  document.head.appendChild(script);
}

// ===== 地図初期化 =====
function initMap(): void {
  try {
    // 東京駅を中心に初期化
    const defaultCenter = { lat: 35.6812, lng: 139.7671 };

    map = new google.maps.Map(getElement<HTMLDivElement>('map'), {
      center: defaultCenter,
      zoom: 15,
      mapId: 'DEMO_MAP_ID', // Advanced Markerに必要
      // mapIdを使用する場合、stylesはCloud Consoleで管理されるため削除
    });

    // MarkerServiceを初期化
    markerService = new MarkerService();
    markerService.setMap(map);

    // Autocompleteを初期化
    initAutocomplete();

    console.log('Google Maps initialized successfully');
  } catch (error) {
    console.error('Map initialization error:', error);
    showError('地図の初期化に失敗しました。環境変数 VITE_GOOGLE_MAPS_API_KEY の設定を確認してください。');
  }
}

// ===== Autocomplete初期化 =====
// ===== Autocomplete初期化 (廃止: テキスト検索のみ使用) =====
function initAutocomplete(): void {
  // テキスト検索のみを使用するため、Autocompleteの初期化は不要
  console.log('Using text-only search');
}

// ===== 場所検索 =====
async function searchPlace(): Promise<void> {
  if (!map) {
    showError('地図が初期化されていません');
    return;
  }

  const input = document.getElementById('placeSearchInput') as HTMLInputElement;
  const query = input?.value.trim();

  if (!query) {
    showError('検索する場所を入力してください');
    return;
  }

  try {
    // Text Search (New) を使用
    const { places } = await google.maps.places.Place.searchByText({
      textQuery: query,
      fields: ['displayName', 'formattedAddress', 'location'],
      maxResultCount: 1,
    });

    if (places && places.length > 0) {
      const place = places[0];
      const location = place.location;
      const placeName = place.displayName || place.formattedAddress || '';

      if (location) {
        // 地図を移動
        map.setCenter(location);
        map.setZoom(15);

        // マーカーを表示
        showPlaceMarker(location, placeName);
      } else {
        showError('場所の位置情報が見つかりませんでした');
      }
    } else {
      showError('場所が見つかりませんでした');
    }
  } catch (error) {
    console.error('Search error:', error);
    showError('場所の検索中にエラーが発生しました');
  }
}

// ===== クチコミ検索 =====
async function searchReviews(): Promise<void> {
  if (!map) {
    showError('地図が初期化されていません');
    return;
  }

  const bounds = map.getBounds();
  if (!bounds) {
    showError('地図の範囲を取得できませんでした');
    return;
  }

  // ローディング表示
  setLoading(true);
  allReviews = [];
  displayReviews([]);

  try {
    // Nearby Searchで範囲内のスポットを取得
    const places = await searchNearbyPlaces(bounds);

    if (places.length === 0) {
      showError('この範囲にスポットが見つかりませんでした');
      setLoading(false);
      return;
    }

    // 各スポットの詳細（クチコミ含む）を取得
    let fetchedCount = 0;
    const totalPlaces = Math.min(places.length, 20); // 最大20スポットに制限

    for (let i = 0; i < totalPlaces; i++) {
      try {
        const placeId = places[i].place_id;
        if (!placeId) continue;
        const placeDetails = await getPlaceDetails(placeId);

        if (placeDetails?.reviews && placeDetails.reviews.length > 0) {
          // クチコミをallReviewsに追加
          placeDetails.reviews.forEach((review) => {
            allReviews.push({
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

        fetchedCount++;

        // 進捗を表示
        updateLoadingText(`クチコミを取得中... (${fetchedCount}/${totalPlaces})`);
      } catch (error) {
        console.error('Place details error:', error);
      }
    }

    if (allReviews.length === 0) {
      showError('クチコミが見つかりませんでした');
    } else {
      sortAndDisplayReviews();

      // マーカーを作成
      if (markerService) {
        await markerService.createMarkersFromReviews(allReviews, (review) => {
          // マーカークリック時に該当するクチコミカードにスクロール
          scrollToReviewCard(review);
        });
      }
    }
  } catch (error) {
    console.error('Search error:', error);
    showError('クチコミの取得中にエラーが発生しました');
  } finally {
    setLoading(false);
  }
}

// ===== Nearby Places検索 =====
async function searchNearbyPlaces(
  bounds: google.maps.LatLngBounds
): Promise<google.maps.places.PlaceResult[]> {
  if (!map) {
    throw new Error('Map not initialized');
  }

  const center = bounds.getCenter();
  const radius = calculateRadius(bounds);

  const { places } = await google.maps.places.Place.searchNearby({
    locationRestriction: {
      center: { lat: center.lat(), lng: center.lng() },
      radius: radius,
    },
    maxResultCount: 20,
    fields: ['id', 'displayName'],
  });

  return places.map((place) => ({
    place_id: place.id,
    name: place.displayName,
  })) as google.maps.places.PlaceResult[];
}

// ===== 境界から半径を計算 =====
function calculateRadius(bounds: google.maps.LatLngBounds): number {
  const ne = bounds.getNorthEast();
  const center = bounds.getCenter();

  // 中心から北東角までの距離を計算
  const distance = google.maps.geometry.spherical.computeDistanceBetween(center, ne);

  // 最大5000mに制限（Places API の制限）
  return Math.min(distance, 5000);
}

// ===== Place Details取得 =====
async function getPlaceDetails(placeId: string): Promise<PlaceDetailsResult | null> {
  try {
    const place = new google.maps.places.Place({
      id: placeId,
    });

    await place.fetchFields({
      fields: ['displayName', 'reviews', 'types', 'location'],
    });

    // レビューをPlaceReview型に変換
    const reviews: google.maps.places.PlaceReview[] = (place.reviews || []).map((review) => ({
      author_name: review.authorAttribution?.displayName || '匿名',
      profile_photo_url: review.authorAttribution?.photoURI || '',
      rating: review.rating || 0,
      // biome-ignore lint/suspicious/noExplicitAny: New Places API review.text may be an object with text property
      text: (review.text as any)?.text || review.text || '',
      time: review.publishTime ? new Date(review.publishTime).getTime() / 1000 : 0,
      language: '',
      relative_time_description: '',
    }));

    return {
      name: place.displayName || '',
      reviews: reviews,
      types: place.types || [],
      geometry: {
        location: place.location,
      } as google.maps.places.PlaceGeometry,
    };
  } catch (error) {
    console.error('Error fetching place details:', error);
    return null;
  }
}

// ===== ソートと表示 =====
function sortAndDisplayReviews(): void {
  const sortType = getElement<HTMLSelectElement>('sortSelect').value;
  const sorted = [...allReviews];

  switch (sortType) {
    case 'newest':
      sorted.sort((a, b) => b.time - a.time);
      break;
    case 'oldest':
      sorted.sort((a, b) => a.time - b.time);
      break;
    case 'highest':
      sorted.sort((a, b) => b.rating - a.rating);
      break;
    case 'lowest':
      sorted.sort((a, b) => a.rating - b.rating);
      break;
  }

  displayReviews(sorted);
}

// ===== クチコミ表示 =====
function displayReviews(reviews: Review[]): void {
  const timeline = getElement<HTMLDivElement>('timeline');

  if (reviews.length === 0) {
    timeline.innerHTML = `
      <div class="empty-state">
        <p>「この範囲のクチコミを取得」ボタンを押して、<br>地図範囲内のスポットのクチコミを表示します。</p>
      </div>
    `;
    return;
  }

  timeline.innerHTML = '';

  reviews.forEach((review) => {
    const card = createReviewCard(review);
    timeline.appendChild(card);
  });
}

// ===== クチコミカード作成 =====
function createReviewCard(review: Review): HTMLElement {
  const article = document.createElement('article');
  article.className = 'review-card';
  // 一意のIDを生成（場所名 + 投稿時間のハッシュ）
  // 日本語対応のため、encodeURIComponent → btoa でエンコード
  const reviewId = `review-${btoa(encodeURIComponent(`${review.placeName}-${review.time}`)).replace(/=/g, '')}`;
  article.id = reviewId;
  article.dataset.reviewTime = review.time.toString();

  // 星評価の生成
  const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);

  // 相対時間の計算
  const relativeTime = getRelativeTime(review.time);

  // カテゴリの取得（最初のtype）
  const category = getCategoryName(review.placeTypes || []);

  // プロフィール画像（なければデフォルト）
  const defaultAvatar =
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48"%3E%3Crect fill="%232f3336" width="48" height="48"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%2371767b" font-size="20"%3E👤%3C/text%3E%3C/svg%3E';
  const profilePhoto = review.profile_photo_url || defaultAvatar;

  article.innerHTML = `
    <div class="review-header">
      <img src="${profilePhoto}" class="avatar" alt="${escapeHtml(review.author_name)}" onerror="this.src='${defaultAvatar}'">
      <div class="review-meta">
        <span class="author-name">${escapeHtml(review.author_name)}</span>
        <span class="post-time">${relativeTime}</span>
      </div>
    </div>
    <div class="review-body">
      <div class="place-info clickable">📍 ${escapeHtml(review.placeName || '')}${category ? ` · ${category}` : ''}</div>
      <div class="rating">${stars}</div>
      <p class="review-text">${escapeHtml(review.text)}</p>
    </div>
  `;

  // 場所名クリック時に地図を移動
  if (review.placeLocation) {
    const placeInfo = article.querySelector('.place-info');
    if (placeInfo) {
      placeInfo.addEventListener('click', () => {
        if (map && review.placeLocation) {
          map.panTo(review.placeLocation);
          map.setZoom(17);

          // マーカーを表示（既存のマーカーがあれば削除）
          showPlaceMarker(review.placeLocation, review.placeName || '');
        }
      });
    }
  }

  return article;
}

// ===== 場所のマーカーを表示 =====
function showPlaceMarker(location: google.maps.LatLng, placeName: string): void {
  // 既存のマーカーがあれば削除
  if (currentMarker) {
    currentMarker.setMap(null);
  }

  // 新しいマーカーを作成
  currentMarker = new google.maps.Marker({
    position: location,
    map: map,
    title: placeName,
    animation: google.maps.Animation.DROP,
  });

  // 情報ウィンドウを表示
  const infoWindow = new google.maps.InfoWindow({
    content: `<div style="color: #000; font-weight: bold;">${escapeHtml(placeName)}</div>`,
  });
  infoWindow.open(map, currentMarker);
}

// ===== クチコミカードにスクロール =====
function scrollToReviewCard(review: Review): void {
  // 日本語対応のため、encodeURIComponent → btoa でエンコード
  const reviewId = `review-${btoa(encodeURIComponent(`${review.placeName}-${review.time}`)).replace(/=/g, '')}`;
  const card = document.getElementById(reviewId);

  if (card) {
    // スムーズスクロール
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // ハイライト効果
    card.classList.add('highlight');
    setTimeout(() => {
      card.classList.remove('highlight');
    }, 2000);
  }
}

// ===== 相対時間の計算 =====
function getRelativeTime(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;

  if (diff < 60) return '今';
  if (diff < 3600) return `${Math.floor(diff / 60)}分前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}時間前`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}日前`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)}ヶ月前`;
  return `${Math.floor(diff / 31536000)}年前`;
}

// ===== カテゴリ名の取得 =====
function getCategoryName(types: string[]): string {
  if (!types || types.length === 0) return '';

  const categoryMap: Record<string, string> = {
    restaurant: 'レストラン',
    cafe: 'カフェ',
    bar: 'バー',
    store: '店舗',
    shopping_mall: 'ショッピングモール',
    park: '公園',
    museum: '美術館',
    tourist_attraction: '観光地',
    lodging: '宿泊施設',
    hospital: '病院',
    school: '学校',
  };

  for (const type of types) {
    if (categoryMap[type]) {
      return categoryMap[type];
    }
  }

  return types[0].replace(/_/g, ' ');
}

// ===== HTML エスケープ =====
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ===== ローディング制御 =====
function setLoading(isLoading: boolean): void {
  const indicator = getElement<HTMLDivElement>('loadingIndicator');
  const button = getElement<HTMLButtonElement>('searchReviewsBtn');

  if (isLoading) {
    indicator.style.display = 'flex';
    button.disabled = true;
    button.style.opacity = '0.5';
  } else {
    indicator.style.display = 'none';
    button.disabled = false;
    button.style.opacity = '1';
  }
}

function updateLoadingText(text: string): void {
  const indicator = getElement<HTMLDivElement>('loadingIndicator');
  const span = indicator.querySelector('span');
  if (span) {
    span.textContent = text;
  }
}

// ===== エラー表示 =====
function showError(message: string): void {
  const toast = getElement<HTMLDivElement>('errorToast');
  toast.textContent = message;
  toast.className = 'toast error';
  toast.style.display = 'block';

  setTimeout(() => {
    toast.style.display = 'none';
  }, 5000);
}

// ===== テーマ切り替え =====
function toggleTheme(): void {
  isDarkMode = !isDarkMode;
  localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  applyTheme();
}

function applyTheme(): void {
  const body = document.body;
  const themeToggleBtn = getElement<HTMLButtonElement>('themeToggleBtn');

  if (isDarkMode) {
    body.classList.remove('light-mode');
    body.classList.add('dark-mode');
    themeToggleBtn.textContent = '🌙';
    themeToggleBtn.title = 'ライトモードに切り替え';
  } else {
    body.classList.remove('dark-mode');
    body.classList.add('light-mode');
    themeToggleBtn.textContent = '☀️';
    themeToggleBtn.title = 'ダークモードに切り替え';
  }
}
