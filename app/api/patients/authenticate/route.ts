// Migrated to Prisma API Routes
import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

const DATE_FIELDS = ['created_at', 'updated_at', 'birth_date', 'training_last_login_at'] as const
const DATE_ONLY_FIELDS = ['birth_date'] as const

// メモリ内レートリミッター（同一IPから1分間に10回超の試行を遮断）
const ipAttemptMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = ipAttemptMap.get(ip)
  if (!entry || entry.resetAt < now) {
    ipAttemptMap.set(ip, { count: 1, resetAt: now + 60_000 })
    return true
  }
  if (entry.count >= 10) return false
  entry.count++
  return true
}

// POST: 再診患者の認証
// 診察券番号 OR 電話番号 OR メールアドレス（いずれか1つ） + 生年月日で認証
export async function POST(request: NextRequest) {
  // レートリミット確認
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'しばらくしてから再度お試しください' },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()
    const { clinic_id, patient_number, phone, email, birthdate } = body

    if (!clinic_id || !birthdate) {
      return NextResponse.json(
        { error: 'clinic_id and birthdate are required' },
        { status: 400 }
      )
    }

    // 少なくとも1つの識別子が必要
    if (!patient_number && !phone && !email) {
      return NextResponse.json(
        { error: 'patient_number, phone, or email is required' },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient()

    // 生年月日と本登録済みで絞り込み
    const patients = await prisma.patients.findMany({
      where: {
        clinic_id,
        birth_date: new Date(birthdate),
        is_registered: true
      }
    })

    if (!patients || patients.length === 0) {
      return NextResponse.json(null)
    }

    // 診察券番号、電話番号、メールアドレスのいずれかが一致する患者を検索
    const matchedPatient = patients.find(patient => {
      if (patient_number && patient.patient_number?.toString() === patient_number) return true
      if (phone && patient.phone === phone) return true
      if (email && patient.email === email) return true
      return false
    })

    if (!matchedPatient) {
      return NextResponse.json(null)
    }

    // password_hash を除外してレスポンスを返す
    const { password_hash: _ph, ...safePatient } = matchedPatient
    const patientWithStringDates = convertDatesToStrings(safePatient as typeof matchedPatient, [...DATE_FIELDS], [...DATE_ONLY_FIELDS])
    return NextResponse.json(patientWithStringDates)
  } catch (error) {
    console.error('[患者認証API] エラー:', error)
    return NextResponse.json(null)
  }
}
