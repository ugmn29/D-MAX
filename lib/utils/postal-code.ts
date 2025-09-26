/**
 * 郵便番号から住所を取得するユーティリティ
 */

export interface AddressData {
  prefecture: string
  city: string
  address_line: string
  full_address: string
}

/**
 * 郵便番号から住所を取得
 * @param postalCode 郵便番号（例: "123-4567" または "1234567"）
 * @returns 住所データまたはnull
 */
export async function getAddressFromPostalCode(postalCode: string): Promise<AddressData | null> {
  // 開発環境では郵便番号APIを無効化（CORSエラー回避）
  if (process.env.NODE_ENV === 'development') {
    console.log('開発環境: 郵便番号住所自動入力は無効化されています')
    return null
  }

  try {
    // ハイフンを除去
    const cleanPostalCode = postalCode.replace(/[^\d]/g, '')
    
    if (cleanPostalCode.length !== 7) {
      return null
    }

    // 郵便番号検索API（zipcloud）を使用
    const response = await fetch(
      `https://zipcloud.ibsnet.co.jp/api/search?zipcode=${cleanPostalCode}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',
      }
    )

    if (!response.ok) {
      console.warn('住所取得APIレスポンスエラー:', response.status)
      return null
    }

    const data = await response.json()
    
    if (data.status !== 200 || !data.results || data.results.length === 0) {
      return null
    }

    const result = data.results[0]
    const fullAddress = `${result.address1}${result.address2}${result.address3}`
    
    return {
      prefecture: result.address1,
      city: result.address2,
      address_line: result.address3,
      full_address: fullAddress
    }
  } catch (error) {
    console.warn('郵便番号住所取得エラー（無視されます）:', error)
    // エラーを無視してnullを返す
    return null
  }
}

/**
 * 郵便番号のフォーマットを検証
 * @param postalCode 郵便番号
 * @returns 有効な郵便番号かどうか
 */
export function validatePostalCode(postalCode: string): boolean {
  const cleanPostalCode = postalCode.replace(/[^\d]/g, '')
  return cleanPostalCode.length === 7
}

/**
 * 郵便番号をフォーマット（ハイフン付き）
 * @param postalCode 郵便番号
 * @returns フォーマットされた郵便番号
 */
export function formatPostalCode(postalCode: string): string {
  const cleanPostalCode = postalCode.replace(/[^\d]/g, '')
  if (cleanPostalCode.length === 7) {
    return `${cleanPostalCode.slice(0, 3)}-${cleanPostalCode.slice(3)}`
  }
  return postalCode
}
