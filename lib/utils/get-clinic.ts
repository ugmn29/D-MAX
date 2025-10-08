/**
 * サブドメインまたはURLパスから医院を識別するユーティリティ
 */

// 開発環境用のデフォルト医院ID
const DEFAULT_CLINIC_ID = '11111111-1111-1111-1111-111111111111'

// サブドメインと医院IDのマッピング（本番環境用）
// 例: { 'tanaka-dental': 'clinic-uuid-1', 'suzuki-dental': 'clinic-uuid-2' }
const SUBDOMAIN_CLINIC_MAP: Record<string, string> = {
  'localhost': DEFAULT_CLINIC_ID,
  'demo': DEFAULT_CLINIC_ID,
  // 本番環境では実際の医院のマッピングを追加
}

/**
 * ホスト名からサブドメインを取得
 */
export function getSubdomain(hostname: string): string | null {
  // localhost の場合
  if (hostname === 'localhost' || hostname.startsWith('localhost:')) {
    return 'localhost'
  }

  // IPアドレスの場合
  if (/^(\d+\.){3}\d+/.test(hostname)) {
    return null
  }

  const parts = hostname.split('.')

  // サブドメインがない場合（例: example.com）
  if (parts.length <= 2) {
    return null
  }

  // サブドメインを返す（例: clinic.example.com → clinic）
  return parts[0]
}

/**
 * 現在のホスト名から医院IDを取得
 */
export function getClinicIdFromHostname(hostname: string): string {
  const subdomain = getSubdomain(hostname)

  if (!subdomain) {
    return DEFAULT_CLINIC_ID
  }

  return SUBDOMAIN_CLINIC_MAP[subdomain] || DEFAULT_CLINIC_ID
}

/**
 * クライアントサイドで医院IDを取得
 */
export function getClinicId(): string {
  if (typeof window === 'undefined') {
    return DEFAULT_CLINIC_ID
  }

  return getClinicIdFromHostname(window.location.hostname)
}

/**
 * 医院のサブドメインを登録
 */
export function registerClinicSubdomain(subdomain: string, clinicId: string) {
  SUBDOMAIN_CLINIC_MAP[subdomain] = clinicId
}
