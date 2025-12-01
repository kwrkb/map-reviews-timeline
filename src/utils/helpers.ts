/**
 * ユーティリティ関数
 */

/**
 * 相対時間を計算
 * @param timestamp - UNIXタイムスタンプ
 * @returns 相対時間の文字列
 */
export function getRelativeTime(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;

  if (diff < 60) return '今';
  if (diff < 3600) return `${Math.floor(diff / 60)}分前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}時間前`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}日前`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)}ヶ月前`;
  return `${Math.floor(diff / 31536000)}年前`;
}

/**
 * カテゴリ名を取得
 * @param types - スポットのtype配列
 * @returns カテゴリ名
 */
export function getCategoryName(types: string[]): string {
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

/**
 * HTMLをエスケープ
 * @param text - エスケープする文字列
 * @returns エスケープされた文字列
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * 星評価を生成
 * @param rating - 評価（1-5）
 * @returns 星の文字列
 */
export function generateStars(rating: number): string {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

/**
 * DOM要素を取得（型安全）
 * @param id - 要素のID
 * @returns DOM要素
 * @throws 要素が見つからない場合
 */
export function getElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Element with id "${id}" not found`);
  }
  return element as T;
}
