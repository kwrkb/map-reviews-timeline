// ===== グローバル変数 =====
let map;
let service;
let placesService;
let allReviews = [];
let apiKey = '';

// ===== 初期化 =====
document.addEventListener('DOMContentLoaded', () => {
    // APIキーの確認
    apiKey = localStorage.getItem('googleMapsApiKey');

    if (!apiKey) {
        showApiKeyModal();
    } else {
        loadGoogleMapsScript();
    }

    // イベントリスナーの設定
    document.getElementById('saveApiKeyBtn').addEventListener('click', saveApiKey);
    document.getElementById('settingsBtn').addEventListener('click', showApiKeyModal);
    document.getElementById('searchReviewsBtn').addEventListener('click', searchReviews);
    document.getElementById('sortSelect').addEventListener('change', sortAndDisplayReviews);
});

// ===== APIキー管理 =====
function showApiKeyModal() {
    const modal = document.getElementById('apiKeyModal');
    const input = document.getElementById('apiKeyInput');
    input.value = apiKey || '';
    modal.classList.add('active');
}

function saveApiKey() {
    const input = document.getElementById('apiKeyInput');
    const key = input.value.trim();

    if (!key) {
        showError('APIキーを入力してください');
        return;
    }

    apiKey = key;
    localStorage.setItem('googleMapsApiKey', key);
    document.getElementById('apiKeyModal').classList.remove('active');

    // 既にスクリプトが読み込まれている場合はリロード
    if (window.google) {
        location.reload();
    } else {
        loadGoogleMapsScript();
    }
}

// ===== Google Maps スクリプト読み込み =====
function loadGoogleMapsScript() {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=ja`;
    script.async = true;
    script.defer = true;
    script.onload = initMap;
    script.onerror = () => {
        showError('Google Maps APIの読み込みに失敗しました。APIキーを確認してください。');
        showApiKeyModal();
    };
    document.head.appendChild(script);
}

// ===== 地図初期化 =====
function initMap() {
    // 東京駅を中心に初期化
    const defaultCenter = { lat: 35.6812, lng: 139.7671 };

    map = new google.maps.Map(document.getElementById('map'), {
        center: defaultCenter,
        zoom: 15,
        styles: [
            {
                "featureType": "all",
                "elementType": "geometry",
                "stylers": [{ "color": "#242f3e" }]
            },
            {
                "featureType": "all",
                "elementType": "labels.text.stroke",
                "stylers": [{ "color": "#242f3e" }]
            },
            {
                "featureType": "all",
                "elementType": "labels.text.fill",
                "stylers": [{ "color": "#746855" }]
            },
            {
                "featureType": "water",
                "elementType": "geometry",
                "stylers": [{ "color": "#17263c" }]
            }
        ]
    });

    placesService = new google.maps.places.PlacesService(map);
}

// ===== 口コミ検索 =====
async function searchReviews() {
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

        // 各スポットの詳細（口コミ含む）を取得
        let fetchedCount = 0;
        const totalPlaces = Math.min(places.length, 20); // 最大20スポットに制限

        for (let i = 0; i < totalPlaces; i++) {
            try {
                const placeDetails = await getPlaceDetails(places[i].place_id);

                if (placeDetails && placeDetails.reviews && placeDetails.reviews.length > 0) {
                    // 口コミをallReviewsに追加
                    placeDetails.reviews.forEach(review => {
                        allReviews.push({
                            ...review,
                            placeName: placeDetails.name,
                            placeTypes: placeDetails.types || [],
                            placeLocation: placeDetails.geometry?.location
                        });
                    });
                }

                fetchedCount++;

                // 進捗を表示
                updateLoadingText(`口コミを取得中... (${fetchedCount}/${totalPlaces})`);

            } catch (error) {
                console.error('Place details error:', error);
            }
        }

        if (allReviews.length === 0) {
            showError('口コミが見つかりませんでした');
        } else {
            sortAndDisplayReviews();
        }

    } catch (error) {
        console.error('Search error:', error);
        showError('口コミの取得中にエラーが発生しました');
    } finally {
        setLoading(false);
    }
}

// ===== Nearby Places検索 =====
function searchNearbyPlaces(bounds) {
    return new Promise((resolve, reject) => {
        const center = bounds.getCenter();

        const request = {
            location: center,
            radius: calculateRadius(bounds),
            // typeを指定しない（全ジャンル対象）
        };

        placesService.nearbySearch(request, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                resolve(results);
            } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                resolve([]);
            } else {
                reject(new Error(`Places API error: ${status}`));
            }
        });
    });
}

// ===== 境界から半径を計算 =====
function calculateRadius(bounds) {
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    const center = bounds.getCenter();

    // 中心から北東角までの距離を計算
    const distance = google.maps.geometry.spherical.computeDistanceBetween(
        center,
        ne
    );

    // 最大5000mに制限（Places API の制限）
    return Math.min(distance, 5000);
}

// ===== Place Details取得 =====
function getPlaceDetails(placeId) {
    return new Promise((resolve, reject) => {
        const request = {
            placeId: placeId,
            fields: ['name', 'reviews', 'types', 'geometry']
        };

        placesService.getDetails(request, (place, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                resolve(place);
            } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                resolve(null);
            } else {
                reject(new Error(`Place Details API error: ${status}`));
            }
        });
    });
}

// ===== ソートと表示 =====
function sortAndDisplayReviews() {
    const sortType = document.getElementById('sortSelect').value;
    let sorted = [...allReviews];

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

// ===== 口コミ表示 =====
function displayReviews(reviews) {
    const timeline = document.getElementById('timeline');

    if (reviews.length === 0) {
        timeline.innerHTML = `
            <div class="empty-state">
                <p>「この範囲の口コミを取得」ボタンを押して、<br>地図範囲内のスポットの口コミを表示します。</p>
            </div>
        `;
        return;
    }

    timeline.innerHTML = '';

    reviews.forEach(review => {
        const card = createReviewCard(review);
        timeline.appendChild(card);
    });
}

// ===== 口コミカード作成 =====
function createReviewCard(review) {
    const article = document.createElement('article');
    article.className = 'review-card';

    // 星評価の生成
    const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);

    // 相対時間の計算
    const relativeTime = getRelativeTime(review.time);

    // カテゴリの取得（最初のtype）
    const category = getCategoryName(review.placeTypes);

    // プロフィール画像（なければデフォルト）
    const profilePhoto = review.profile_photo_url || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48"%3E%3Crect fill="%232f3336" width="48" height="48"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%2371767b" font-size="20"%3E👤%3C/text%3E%3C/svg%3E';

    article.innerHTML = `
        <div class="review-header">
            <img src="${profilePhoto}" class="avatar" alt="${review.author_name}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2248%22 height=%2248%22%3E%3Crect fill=%22%232f3336%22 width=%2248%22 height=%2248%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%2371767b%22 font-size=%2220%22%3E👤%3C/text%3E%3C/svg%3E'">
            <div class="review-meta">
                <span class="author-name">${escapeHtml(review.author_name)}</span>
                <span class="post-time">${relativeTime}</span>
            </div>
        </div>
        <div class="review-body">
            <div class="place-info">📍 ${escapeHtml(review.placeName)}${category ? ' · ' + category : ''}</div>
            <div class="rating">${stars}</div>
            <p class="review-text">${escapeHtml(review.text)}</p>
        </div>
    `;

    return article;
}

// ===== 相対時間の計算 =====
function getRelativeTime(timestamp) {
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
function getCategoryName(types) {
    if (!types || types.length === 0) return '';

    const categoryMap = {
        'restaurant': 'レストラン',
        'cafe': 'カフェ',
        'bar': 'バー',
        'store': '店舗',
        'shopping_mall': 'ショッピングモール',
        'park': '公園',
        'museum': '美術館',
        'tourist_attraction': '観光地',
        'lodging': '宿泊施設',
        'hospital': '病院',
        'school': '学校'
    };

    for (const type of types) {
        if (categoryMap[type]) {
            return categoryMap[type];
        }
    }

    return types[0].replace(/_/g, ' ');
}

// ===== HTML エスケープ =====
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== ローディング制御 =====
function setLoading(isLoading) {
    const indicator = document.getElementById('loadingIndicator');
    const button = document.getElementById('searchReviewsBtn');

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

function updateLoadingText(text) {
    const indicator = document.getElementById('loadingIndicator');
    const span = indicator.querySelector('span');
    if (span) {
        span.textContent = text;
    }
}

// ===== エラー表示 =====
function showError(message) {
    const toast = document.getElementById('errorToast');
    toast.textContent = message;
    toast.className = 'toast error';
    toast.style.display = 'block';

    setTimeout(() => {
        toast.style.display = 'none';
    }, 5000);
}
