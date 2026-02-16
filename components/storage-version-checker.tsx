'use client'

import { useEffect } from 'react'
import { checkAndClearStorageIfNeeded } from '@/lib/utils/storage-version'

/**
 * アプリ起動時にlocalStorageのバージョンをチェック
 * バージョンが変わっていたら自動的にクリアする
 */
export function StorageVersionChecker() {
  useEffect(() => {
    const wasCleared = checkAndClearStorageIfNeeded()

    if (wasCleared) {
      // ページをリロードして最新のデータを取得
      window.location.reload()
    }
  }, [])

  return null
}
