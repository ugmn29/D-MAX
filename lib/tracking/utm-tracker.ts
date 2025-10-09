/**
 * UTMパラメータの取得・保存機能
 */

export interface UTMParameters {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
}

export interface DeviceInfo {
  device_type: 'desktop' | 'mobile' | 'tablet'
  os: string
  browser: string
}

export interface StoredUTMData {
  utm: UTMParameters
  device: DeviceInfo
  first_visit_at: string
  session_id: string
}

const UTM_STORAGE_KEY = 'utm_data'
const SESSION_ID_KEY = 'booking_session_id'

/**
 * URLからUTMパラメータを取得
 */
export function extractUTMFromURL(url: string = window.location.href): UTMParameters {
  const urlObj = new URL(url)
  const params = urlObj.searchParams

  const utm: UTMParameters = {}

  const utmKeys: (keyof UTMParameters)[] = [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_content',
    'utm_term',
  ]

  utmKeys.forEach((key) => {
    const value = params.get(key)
    if (value) {
      utm[key] = value
    }
  })

  return utm
}

/**
 * デバイス情報を取得
 */
export function getDeviceInfo(): DeviceInfo {
  const ua = navigator.userAgent

  // デバイスタイプの判定
  let device_type: DeviceInfo['device_type'] = 'desktop'
  if (/mobile/i.test(ua) && !/tablet|ipad/i.test(ua)) {
    device_type = 'mobile'
  } else if (/tablet|ipad/i.test(ua)) {
    device_type = 'tablet'
  }

  // OS判定
  let os = 'unknown'
  if (/windows/i.test(ua)) os = 'Windows'
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS'
  else if (/linux/i.test(ua)) os = 'Linux'
  else if (/android/i.test(ua)) os = 'Android'
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS'

  // ブラウザ判定
  let browser = 'unknown'
  if (/edg/i.test(ua)) browser = 'Edge'
  else if (/chrome/i.test(ua)) browser = 'Chrome'
  else if (/safari/i.test(ua)) browser = 'Safari'
  else if (/firefox/i.test(ua)) browser = 'Firefox'
  else if (/opera|opr/i.test(ua)) browser = 'Opera'

  return { device_type, os, browser }
}

/**
 * セッションIDを取得または生成
 */
export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return ''

  let sessionId = sessionStorage.getItem(SESSION_ID_KEY)
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    sessionStorage.setItem(SESSION_ID_KEY, sessionId)
  }
  return sessionId
}

/**
 * UTMパラメータとデバイス情報をsessionStorageに保存
 */
export function captureAndStoreUTMData(): void {
  if (typeof window === 'undefined') return

  // 既に保存されている場合はスキップ
  const existing = sessionStorage.getItem(UTM_STORAGE_KEY)
  if (existing) {
    console.log('[UTM] Already captured:', JSON.parse(existing))
    return
  }

  const utm = extractUTMFromURL()

  // UTMパラメータが存在する場合のみ保存
  if (Object.keys(utm).length === 0) {
    console.log('[UTM] No UTM parameters found')
    return
  }

  const device = getDeviceInfo()
  const session_id = getOrCreateSessionId()

  const data: StoredUTMData = {
    utm,
    device,
    first_visit_at: new Date().toISOString(),
    session_id,
  }

  sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(data))
  console.log('[UTM] Captured and stored:', data)
}

/**
 * 保存されたUTMデータを取得
 */
export function getStoredUTMData(): StoredUTMData | null {
  if (typeof window === 'undefined') return null

  const stored = sessionStorage.getItem(UTM_STORAGE_KEY)
  if (!stored) return null

  try {
    return JSON.parse(stored) as StoredUTMData
  } catch (error) {
    console.error('[UTM] Failed to parse stored data:', error)
    return null
  }
}

/**
 * UTMデータをクリア
 */
export function clearUTMData(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(UTM_STORAGE_KEY)
  sessionStorage.removeItem(SESSION_ID_KEY)
}

/**
 * UTMデータの存在確認
 */
export function hasUTMData(): boolean {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem(UTM_STORAGE_KEY) !== null
}
