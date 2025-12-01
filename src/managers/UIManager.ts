import { getElement } from '../utils/helpers';

/**
 * イベントハンドラー型定義
 */
interface EventHandlers {
  onSaveApiKey?: () => void;
  onShowSettings?: () => void;
  onSearchReviews?: () => void;
  onSortChange?: () => void;
  onPlaceSearch?: () => void;
  onThemeToggle?: () => void;
}

/**
 * UIManager
 * DOM操作とUIの状態管理を担当
 */
export class UIManager {
  private elements: {
    apiKeyModal: HTMLDivElement;
    apiKeyInput: HTMLInputElement;
    saveApiKeyBtn: HTMLButtonElement;
    settingsBtn: HTMLButtonElement;
    searchReviewsBtn: HTMLButtonElement;
    sortSelect: HTMLSelectElement;
    timeline: HTMLDivElement;
    loadingIndicator: HTMLDivElement;
    errorToast: HTMLDivElement;
    placeSearchInput: HTMLInputElement;
    placeSearchBtn: HTMLButtonElement;
    themeToggleBtn: HTMLButtonElement;
  };

  constructor() {
    this.elements = {
      apiKeyModal: getElement<HTMLDivElement>('apiKeyModal'),
      apiKeyInput: getElement<HTMLInputElement>('apiKeyInput'),
      saveApiKeyBtn: getElement<HTMLButtonElement>('saveApiKeyBtn'),
      settingsBtn: getElement<HTMLButtonElement>('settingsBtn'),
      searchReviewsBtn: getElement<HTMLButtonElement>('searchReviewsBtn'),
      sortSelect: getElement<HTMLSelectElement>('sortSelect'),
      timeline: getElement<HTMLDivElement>('timeline'),
      loadingIndicator: getElement<HTMLDivElement>('loadingIndicator'),
      errorToast: getElement<HTMLDivElement>('errorToast'),
      placeSearchInput: getElement<HTMLInputElement>('placeSearchInput'),
      placeSearchBtn: getElement<HTMLButtonElement>('placeSearchBtn'),
      themeToggleBtn: getElement<HTMLButtonElement>('themeToggleBtn'),
    };
  }

  /**
   * APIキーモーダルを表示
   * @param currentApiKey - 現在のAPIキー
   */
  showApiKeyModal(currentApiKey: string = ''): void {
    this.elements.apiKeyInput.value = currentApiKey;
    this.elements.apiKeyModal.classList.add('active');
  }

  /**
   * APIキーモーダルを非表示
   */
  hideApiKeyModal(): void {
    this.elements.apiKeyModal.classList.remove('active');
  }

  /**
   * 設定ボタンを非表示
   */
  hideSettingsButton(): void {
    this.elements.settingsBtn.style.display = 'none';
  }

  /**
   * APIキー入力値を取得
   * @returns 入力されたAPIキー
   */
  getApiKeyInput(): string {
    return this.elements.apiKeyInput.value.trim();
  }

  /**
   * ローディング状態を設定
   * @param isLoading - ローディング中かどうか
   */
  setLoading(isLoading: boolean): void {
    if (isLoading) {
      this.elements.loadingIndicator.style.display = 'flex';
      this.elements.searchReviewsBtn.disabled = true;
      this.elements.searchReviewsBtn.style.opacity = '0.5';
    } else {
      this.elements.loadingIndicator.style.display = 'none';
      this.elements.searchReviewsBtn.disabled = false;
      this.elements.searchReviewsBtn.style.opacity = '1';
    }
  }

  /**
   * ローディングテキストを更新
   * @param text - 表示するテキスト
   */
  updateLoadingText(text: string): void {
    const span = this.elements.loadingIndicator.querySelector('span');
    if (span) {
      span.textContent = text;
    }
  }

  /**
   * エラーメッセージを表示
   * @param message - エラーメッセージ
   */
  showError(message: string): void {
    this.elements.errorToast.textContent = message;
    this.elements.errorToast.className = 'toast error';
    this.elements.errorToast.style.display = 'block';

    setTimeout(() => {
      this.elements.errorToast.style.display = 'none';
    }, 5000);
  }

  /**
   * タイムラインに口コミを表示
   * @param reviewCards - 口コミカードの配列
   */
  displayReviews(reviewCards: HTMLElement[]): void {
    if (reviewCards.length === 0) {
      this.elements.timeline.innerHTML = `
        <div class="empty-state">
          <p>「この範囲の口コミを取得」ボタンを押して、<br>地図範囲内のスポットの口コミを表示します。</p>
        </div>
      `;
      return;
    }

    this.elements.timeline.innerHTML = '';
    reviewCards.forEach((card) => {
      this.elements.timeline.appendChild(card);
    });
  }

  /**
   * タイムラインをクリア
   */
  clearTimeline(): void {
    this.elements.timeline.innerHTML = '';
  }

  /**
   * イベントリスナーを設定
   * @param handlers - イベントハンドラーのオブジェクト
   */
  setupEventListeners(handlers: EventHandlers): void {
    if (handlers.onSaveApiKey) {
      this.elements.saveApiKeyBtn.addEventListener('click', handlers.onSaveApiKey);
    }

    if (handlers.onShowSettings) {
      this.elements.settingsBtn.addEventListener('click', handlers.onShowSettings);
    }

    if (handlers.onSearchReviews) {
      this.elements.searchReviewsBtn.addEventListener('click', handlers.onSearchReviews);
    }

    if (handlers.onSortChange) {
      this.elements.sortSelect.addEventListener('change', handlers.onSortChange);
    }

    if (handlers.onPlaceSearch) {
      this.elements.placeSearchBtn.addEventListener('click', handlers.onPlaceSearch);
      this.elements.placeSearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && handlers.onPlaceSearch) {
          handlers.onPlaceSearch();
        }
      });
    }

    if (handlers.onThemeToggle) {
      this.elements.themeToggleBtn.addEventListener('click', handlers.onThemeToggle);
    }
  }

  /**
   * ソート選択値を取得
   * @returns ソートタイプ
   */
  getSortType(): string {
    return this.elements.sortSelect.value;
  }

  /**
   * 地名検索の入力値を取得
   * @returns 入力された地名
   */
  getPlaceSearchInput(): string {
    return this.elements.placeSearchInput.value.trim();
  }

  /**
   * テーマトグルボタンのアイコンを更新
   * @param isDarkMode - ダークモードかどうか
   */
  updateThemeToggleIcon(isDarkMode: boolean): void {
    this.elements.themeToggleBtn.textContent = isDarkMode ? '🌙' : '☀️';
  }
}
