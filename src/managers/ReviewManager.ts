import type { Review } from '../types';
import { escapeHtml, generateStars, getCategoryName, getRelativeTime } from '../utils/helpers';

/**
 * ReviewManager
 * クチコミのソート・表示・カード生成を担当
 */
export class ReviewManager {
  private reviews: Review[] = [];

  /**
   * クチコミを設定
   * @param reviews - クチコミの配列
   */
  setReviews(reviews: Review[]): void {
    this.reviews = reviews;
  }

  /**
   * クチコミを取得
   * @returns クチコミの配列
   */
  getReviews(): Review[] {
    return this.reviews;
  }

  /**
   * クチコミをクリア
   */
  clearReviews(): void {
    this.reviews = [];
  }

  /**
   * クチコミをソート
   * @param sortType - ソートタイプ（newest, oldest, highest, lowest）
   * @returns ソートされたクチコミの配列
   */
  sortReviews(sortType: string): Review[] {
    const sorted = [...this.reviews];

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

    return sorted;
  }

  /**
   * クチコミカードのHTML要素を生成
   * @param review - クチコミオブジェクト
   * @returns カード要素
   */
  createReviewCard(review: Review): HTMLElement {
    const article = document.createElement('article');
    article.className = 'review-card';

    const stars = generateStars(review.rating);
    const relativeTime = getRelativeTime(review.time);
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
        <div class="place-info">📍 ${escapeHtml(review.placeName || '')}${category ? ` · ${category}` : ''}</div>
        <div class="rating">${stars}</div>
        <p class="review-text">${escapeHtml(review.text)}</p>
      </div>
    `;

    return article;
  }
}
