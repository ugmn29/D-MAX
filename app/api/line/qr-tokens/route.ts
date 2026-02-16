// Migrated to Prisma API Routes
/**
 * QRトークン API Route
 * POST: QRトークンを生成
 * GET: 患者の有効なQRトークンまたは履歴を取得
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'
import crypto from 'crypto'

const QR_TOKEN_DATE_FIELDS = ['generated_at', 'expires_at', 'used_at', 'created_at', 'updated_at'] as const

/**
 * セキュアなトークンを生成
 */
function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('base64url')
}

/**
 * POST: QRトークンを生成
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clinic_id, patient_id, line_user_id, purpose, expires_in_minutes } = body

    if (!clinic_id || !patient_id || !line_user_id) {
      return NextResponse.json(
        { error: '必須パラメータが不足しています (clinic_id, patient_id, line_user_id)' },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient()

    // セキュアなトークンを生成
    const token = generateSecureToken()

    // 有効期限を設定（デフォルト5分）
    const expiresMinutes = expires_in_minutes || 5
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + expiresMinutes)

    // QRコードデータを生成（JSON形式）
    const qrData = {
      type: purpose || 'checkin',
      patient_id,
      clinic_id,
      line_user_id,
      token,
      generated_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString()
    }

    const data = await prisma.line_qr_tokens.create({
      data: {
        clinic_id,
        patient_id,
        line_user_id,
        token,
        qr_code_data: JSON.stringify(qrData),
        purpose: purpose || 'checkin',
        generated_at: new Date(),
        expires_at: expiresAt,
        status: 'active'
      }
    })

    const result = convertDatesToStrings(data, [...QR_TOKEN_DATE_FIELDS])

    return NextResponse.json(result)
  } catch (error) {
    console.error('QRトークン生成エラー:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'QRトークンの生成に失敗しました', details: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * GET: 患者の有効なQRトークンまたは履歴を取得
 * ?patient_id=xxx&purpose=checkin - 有効なトークンを取得
 * ?patient_id=xxx&history=true&limit=10 - 履歴を取得
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient_id')
    const purpose = searchParams.get('purpose') || 'checkin'
    const history = searchParams.get('history') === 'true'
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    if (!patientId) {
      return NextResponse.json(
        { error: 'patient_id is required' },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient()

    if (history) {
      // 履歴を取得
      const data = await prisma.line_qr_tokens.findMany({
        where: {
          patient_id: patientId
        },
        orderBy: {
          generated_at: 'desc'
        },
        take: limit
      })

      const result = data.map(item => convertDatesToStrings(item, [...QR_TOKEN_DATE_FIELDS]))

      return NextResponse.json(result)
    } else {
      // 有効なトークンを取得
      const data = await prisma.line_qr_tokens.findFirst({
        where: {
          patient_id: patientId,
          purpose: purpose,
          status: 'active',
          expires_at: {
            gte: new Date()
          }
        },
        orderBy: {
          generated_at: 'desc'
        }
      })

      if (!data) {
        return NextResponse.json(null)
      }

      const result = convertDatesToStrings(data, [...QR_TOKEN_DATE_FIELDS])

      return NextResponse.json(result)
    }
  } catch (error) {
    console.error('QRトークン取得エラー:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'QRトークンの取得に失敗しました', details: errorMessage },
      { status: 500 }
    )
  }
}
