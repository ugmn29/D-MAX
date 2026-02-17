/**
 * LocalStorage バージョン管理
 * アプリのバージョンが変わったら自動的にlocalStorageをクリアする
 */

const STORAGE_VERSION_KEY = 'app_storage_version'
const CURRENT_VERSION = '0.1.0' // package.jsonのバージョンと同期

/**
 * アプリ起動時にバージョンをチェックし、必要ならlocalStorageをクリア
 */
export function checkAndClearStorageIfNeeded(): boolean {
  if (typeof window === 'undefined') return false

  try {
    const storedVersion = localStorage.getItem(STORAGE_VERSION_KEY)

    // バージョンが異なる場合（初回起動または更新後）
    if (storedVersion !== CURRENT_VERSION) {
      console.log(`📦 アプリバージョン更新を検出: ${storedVersion || '初回起動'} → ${CURRENT_VERSION}`)
      console.log('🧹 LocalStorageをクリアしています...')

      // localStorageをクリア
      localStorage.clear()

      // 新しいバージョンを保存
      localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_VERSION)

      console.log('✅ LocalStorageをクリアしました')
      return true
    }

    return false
  } catch (error) {
    console.error('LocalStorageバージョンチェックエラー:', error)
    return false
  }
}

/**
 * 現在のアプリバージョンを取得
 */
export function getCurrentVersion(): string {
  return CURRENT_VERSION
}

/**
 * 保存されているバージョンを取得
 */
export function getStoredVersion(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(STORAGE_VERSION_KEY)
}
