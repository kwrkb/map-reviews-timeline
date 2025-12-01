/**
 * StorageService
 * localStorage を使ったAPIキー管理を担当
 */
export class StorageService {
  private readonly STORAGE_KEY = 'googleMapsApiKey';

  /**
   * APIキーを取得
   * @returns 保存されているAPIキー、またはnull
   */
  getApiKey(): string | null {
    return localStorage.getItem(this.STORAGE_KEY);
  }

  /**
   * APIキーを保存
   * @param apiKey - 保存するAPIキー
   */
  saveApiKey(apiKey: string): void {
    localStorage.setItem(this.STORAGE_KEY, apiKey);
  }

  /**
   * APIキーの存在確認
   * @returns APIキーが存在するか
   */
  hasApiKey(): boolean {
    return !!this.getApiKey();
  }
}
