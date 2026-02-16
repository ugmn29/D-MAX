import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

/**
 * GET /api/daily-memos
 * 日次メモを取得
 */
export async function GET(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')
    const date = searchParams.get('date')

    if (!clinicId || !date) {
      return NextResponse.json(
        { error: 'clinic_id and date are required' },
        { status: 400 }
      )
    }

    const memo = await prisma.daily_memos.findUnique({
      where: {
        clinic_id_date: {
          clinic_id: clinicId,
          date: new Date(date)
        }
      }
    })

    if (!memo) {
      return NextResponse.json(null)
    }

    return NextResponse.json(convertDatesToStrings(memo, ['date', 'created_at', 'updated_at']))
  } catch (error) {
    console.error('日次メモ取得エラー:', error)
    return NextResponse.json(
      { error: '日次メモの取得に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/daily-memos
 * 日次メモを保存 (upsert)
 */
export async function POST(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const body = await request.json()
    const { clinic_id, date, memo, created_by } = body

    if (!clinic_id || !date) {
      return NextResponse.json(
        { error: 'clinic_id and date are required' },
        { status: 400 }
      )
    }

    const dateObj = new Date(date)

    const result = await prisma.daily_memos.upsert({
      where: {
        clinic_id_date: {
          clinic_id,
          date: dateObj
        }
      },
      update: {
        memo: memo || '',
        updated_at: new Date()
      },
      create: {
        clinic_id,
        date: dateObj,
        memo: memo || '',
        created_by: created_by || null
      }
    })

    return NextResponse.json(convertDatesToStrings(result, ['date', 'created_at', 'updated_at']))
  } catch (error) {
    console.error('日次メモ保存エラー:', error)
    return NextResponse.json(
      { error: '日次メモの保存に失敗しました' },
      { status: 500 }
    )
  }
}
