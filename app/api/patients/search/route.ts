// Migrated to Prisma API Routes
import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertArrayDatesToStrings } from '@/lib/prisma-helpers'

const DATE_FIELDS = ['created_at', 'updated_at', 'birth_date', 'training_last_login_at'] as const
const DATE_ONLY_FIELDS = ['birth_date'] as const

/**
 * 全角数字を半角に変換
 */
function toHalfWidthNumber(str: string): string {
  return str.replace(/[０-９]/g, (s) => {
    return String.fromCharCode(s.charCodeAt(0) - 0xFEE0)
  })
}

/**
 * ひらがなをカタカナに変換
 */
function hiraganaToKatakana(str: string): string {
  return str.replace(/[\u3041-\u3096]/g, (s) => {
    return String.fromCharCode(s.charCodeAt(0) + 0x60)
  })
}

/**
 * カタカナをひらがなに変換
 */
function katakanaToHiragana(str: string): string {
  return str.replace(/[\u30A1-\u30F6]/g, (s) => {
    return String.fromCharCode(s.charCodeAt(0) - 0x60)
  })
}

/**
 * 患者検索API
 *
 * クエリパラメータ:
 * - clinic_id: クリニックID（必須）
 * - query: 検索クエリ（必須）
 *
 * 家族登録用の検索（name, birth_date, phone 全てが必須）も同じエンドポイントで対応。
 * query パラメータが指定されている場合は通常検索、
 * name, birth_date, phone が指定されている場合は家族登録用検索。
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')
    const query = searchParams.get('query')

    // 家族登録用検索パラメータ
    const name = searchParams.get('name')
    const birthDate = searchParams.get('birth_date')
    const phone = searchParams.get('phone')

    // 家族登録用の検索
    if (name && birthDate && phone) {
      return handleFamilySearch(name, birthDate, phone)
    }

    // 通常の患者検索
    if (!clinicId) {
      return NextResponse.json(
        { error: 'clinic_id is required' },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient()

    // 全患者を取得
    const patients = await prisma.patients.findMany({
      where: {
        clinic_id: clinicId
      },
      orderBy: {
        patient_number: 'asc'
      }
    })

    const patientsWithStringDates = convertArrayDatesToStrings(patients, [...DATE_FIELDS], [...DATE_ONLY_FIELDS])

    // 検索クエリがない場合は全件返す
    if (!query || !query.trim()) {
      return NextResponse.json(patientsWithStringDates)
    }

    // クライアント側で検索フィルタリング
    const searchTerm = query.trim().toLowerCase()
    const normalizedTerm = toHalfWidthNumber(searchTerm)
    const searchNumber = Number(normalizedTerm)
    const searchTermKatakana = hiraganaToKatakana(searchTerm)
    const searchTermHiragana = katakanaToHiragana(searchTerm)

    const filtered = patientsWithStringDates.filter((patient: any) => {
      // 姓名で検索
      if (patient.last_name?.toLowerCase().includes(searchTerm)) return true
      if (patient.first_name?.toLowerCase().includes(searchTerm)) return true

      // カナで検索（ひらがな・カタカナ両方に対応）
      const lastNameKana = patient.last_name_kana?.toLowerCase() || ''
      const firstNameKana = patient.first_name_kana?.toLowerCase() || ''
      if (lastNameKana.includes(searchTerm)) return true
      if (firstNameKana.includes(searchTerm)) return true
      if (lastNameKana.includes(searchTermKatakana)) return true
      if (firstNameKana.includes(searchTermKatakana)) return true
      if (lastNameKana.includes(searchTermHiragana)) return true
      if (firstNameKana.includes(searchTermHiragana)) return true

      // 電話番号で検索（全角数字も対応）
      if (patient.phone?.includes(normalizedTerm)) return true

      // 診察券番号で検索（全角数字も対応）
      if (!isNaN(searchNumber) && patient.patient_number === searchNumber) return true

      return false
    })

    return NextResponse.json(filtered)
  } catch (error) {
    console.error('患者検索API エラー:', error)
    return NextResponse.json(
      { error: '検索処理中にエラーが発生しました' },
      { status: 500 }
    )
  }
}

/**
 * 家族登録用の患者検索
 */
async function handleFamilySearch(name: string, birthDate: string, phone: string) {
  try {
    // 電話番号のフォーマット正規化（ハイフンを除去）
    const normalizedPhone = phone.replace(/-/g, '')

    // 生年月日のフォーマット検証（YYYY-MM-DD）
    const birthDatePattern = /^\d{4}-\d{2}-\d{2}$/
    if (!birthDatePattern.test(birthDate)) {
      return NextResponse.json(
        { error: '生年月日の形式が正しくありません（YYYY-MM-DD形式）' },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient()

    // 患者を検索 - 生年月日と電話番号で絞り込み
    const patients = await prisma.patients.findMany({
      where: {
        birth_date: new Date(birthDate),
        phone: normalizedPhone,
        OR: [
          { last_name: { contains: name, mode: 'insensitive' } },
          { first_name: { contains: name, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        patient_number: true,
        last_name: true,
        first_name: true,
        birth_date: true,
        phone: true,
        clinic_id: true
      },
      take: 5
    })

    // 結果をマスキングして返す
    const maskedResults = patients.map(patient => ({
      id: patient.id,
      patient_number: patient.patient_number,
      last_name: patient.last_name,
      first_name: patient.first_name,
      birth_date: patient.birth_date ? patient.birth_date.toISOString().split('T')[0] : null,
      phone: maskPhoneNumber(patient.phone || ''),
      clinic_id: patient.clinic_id
    }))

    return NextResponse.json({
      results: maskedResults,
      count: maskedResults.length
    })
  } catch (error) {
    console.error('家族検索エラー:', error)
    return NextResponse.json(
      { error: '検索処理中にエラーが発生しました' },
      { status: 500 }
    )
  }
}

/**
 * 電話番号を部分マスキング
 */
function maskPhoneNumber(phone: string): string {
  if (!phone) return ''

  const cleaned = phone.replace(/-/g, '')

  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 2)}-****-${cleaned.slice(-4)}`
  } else if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-****-${cleaned.slice(-4)}`
  } else {
    return '***-****-****'
  }
}
