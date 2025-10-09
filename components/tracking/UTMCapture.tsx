'use client'

import { useEffect } from 'react'
import { captureAndStoreUTMData } from '@/lib/tracking/utm-tracker'

/**
 * UTMパラメータをキャプチャするコンポーネント
 * アプリケーション全体で1回だけ実行される
 */
export function UTMCapture() {
  useEffect(() => {
    // クライアントサイドでのみ実行
    if (typeof window !== 'undefined') {
      captureAndStoreUTMData()
    }
  }, [])

  // UIは何も表示しない
  return null
}
