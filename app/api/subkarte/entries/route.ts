/**
 * サブカルテエントリAPI Route - Prisma版
 * Subkarte Entries API
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

// GET - サブカルテエントリを取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient_id')

    if (!patientId) {
      return NextResponse.json({ error: 'patient_id is required' }, { status: 400 })
    }

    const prisma = getPrismaClient()

    const entries = await prisma.subkarte_entries.findMany({
      where: { patient_id: patientId },
      include: {
        staff: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    })

    // Date型をISO文字列に変換
    const result = entries.map((entry) => ({
      ...entry,
      metadata: entry.metadata ?? {},
      created_at: entry.created_at?.toISOString() ?? null,
      updated_at: entry.updated_at?.toISOString() ?? null,
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('サブカルテエントリ取得エラー:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - サブカルテエントリを作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('サブカルテエントリ作成リクエスト:', JSON.stringify(body, null, 2))
    const prisma = getPrismaClient()

    // staff_idがDBに存在するか確認し、なければフォールバック
    if (body.staff_id) {
      const staffExists = await prisma.staff.findUnique({
        where: { id: body.staff_id },
        select: { id: true },
      })
      if (!staffExists) {
        console.log(`staff_id ${body.staff_id} がDBに存在しません。フォールバックを使用`)
        body.staff_id = null
      }
    }
    if (!body.staff_id) {
      const firstStaff = await prisma.staff.findFirst({
        where: { is_active: true },
        select: { id: true },
        orderBy: { created_at: 'asc' },
      })
      if (firstStaff) {
        body.staff_id = firstStaff.id
        console.log(`フォールバックstaff_id: ${firstStaff.id}`)
      }
    }

    const entry = await prisma.subkarte_entries.create({
      data: body,
    })

    const result = {
      ...entry,
      metadata: entry.metadata ?? {},
      created_at: entry.created_at?.toISOString() ?? null,
      updated_at: entry.updated_at?.toISOString() ?? null,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('サブカルテエントリ作成エラー:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
