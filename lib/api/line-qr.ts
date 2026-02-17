// Migrated to Prisma API Routes
import {
  LineQRToken,
  GenerateQRRequest,
  QRPurpose
} from '@/types/notification'

const baseUrl = typeof window === 'undefined'
  ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
  : ''

/**
 * QRコードトークンを生成
 */
export async function generateQRToken(request: GenerateQRRequest): Promise<LineQRToken> {
  try {
    const response = await fetch(`${baseUrl}/api/line/qr-tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        clinic_id: request.clinic_id,
        patient_id: request.patient_id,
        line_user_id: request.line_user_id,
        purpose: request.purpose || 'checkin',
        expires_in_minutes: request.expires_in_minutes || 5
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'QRトークンの生成に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('QRトークン生成エラー:', error)
    throw error
  }
}

/**
 * トークンを検証
 */
export async function validateQRToken(token: string): Promise<LineQRToken | null> {
  try {
    const response = await fetch(`${baseUrl}/api/line/qr-tokens/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token })
    })

    if (!response.ok) {
      console.error('QRトークン検証エラー:', await response.text())
      return null
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('QRトークン検証エラー:', error)
    return null
  }
}

/**
 * トークンを使用済みにマーク
 */
export async function markQRTokenAsUsed(
  tokenId: string,
  usedAt: string = new Date().toISOString()
): Promise<void> {
  try {
    const response = await fetch(`${baseUrl}/api/line/qr-tokens/${tokenId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'used',
        used_at: usedAt
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('QRトークン使用済みマークエラー:', errorData)
    }
  } catch (error) {
    console.error('QRトークン使用済みマークエラー:', error)
  }
}

/**
 * トークンを期限切れにマーク
 */
export async function markQRTokenAsExpired(tokenId: string): Promise<void> {
  try {
    const response = await fetch(`${baseUrl}/api/line/qr-tokens/${tokenId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'expired'
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('QRトークン期限切れマークエラー:', errorData)
    }
  } catch (error) {
    console.error('QRトークン期限切れマークエラー:', error)
  }
}

/**
 * 患者の有効なQRトークンを取得
 */
export async function getActiveQRToken(
  patientId: string,
  purpose: QRPurpose = 'checkin'
): Promise<LineQRToken | null> {
  try {
    const params = new URLSearchParams({
      patient_id: patientId,
      purpose: purpose
    })

    const response = await fetch(`${baseUrl}/api/line/qr-tokens?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.error('有効なQRトークン取得エラー:', await response.text())
      return null
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('有効なQRトークン取得エラー:', error)
    return null
  }
}

/**
 * QRコードスキャン処理（来院登録）
 */
export async function processQRCodeCheckIn(token: string): Promise<{
  success: boolean
  patient?: any
  appointment?: any
  error?: string
}> {
  try {
    const response = await fetch(`${baseUrl}/api/line/qr-tokens/checkin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        error: errorData.error || 'チェックイン処理に失敗しました'
      }
    }

    return await response.json()
  } catch (error) {
    console.error('QRチェックインエラー:', error)
    return {
      success: false,
      error: 'チェックイン処理に失敗しました'
    }
  }
}

/**
 * 期限切れQRトークンをクリーンアップ
 */
export async function cleanupExpiredQRTokens(): Promise<number> {
  try {
    const response = await fetch(`${baseUrl}/api/line/qr-tokens/cleanup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.error('期限切れQRトークンクリーンアップエラー:', await response.text())
      return 0
    }

    const data = await response.json()
    return data.count || 0
  } catch (error) {
    console.error('期限切れQRトークンクリーンアップエラー:', error)
    return 0
  }
}

/**
 * QRコード画像データを生成（Base64）
 */
export async function generateQRCodeImage(qrData: string): Promise<string> {
  const QRCode = require('qrcode')

  try {
    // QRコードを生成してBase64データURLとして返す
    const dataUrl = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
    return dataUrl
  } catch (error) {
    console.error('QRコード生成エラー:', error)
    throw new Error('QRコードの生成に失敗しました')
  }
}

/**
 * QRトークンの使用履歴を取得
 */
export async function getQRTokenHistory(
  patientId: string,
  limit: number = 10
): Promise<LineQRToken[]> {
  try {
    const params = new URLSearchParams({
      patient_id: patientId,
      history: 'true',
      limit: String(limit)
    })

    const response = await fetch(`${baseUrl}/api/line/qr-tokens?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.error('QRトークン履歴取得エラー:', await response.text())
      return []
    }

    return await response.json()
  } catch (error) {
    console.error('QRトークン履歴取得エラー:', error)
    return []
  }
}
