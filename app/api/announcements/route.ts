import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth/verify-request'
import { getPrismaClient } from '@/lib/prisma-client'

// GET: クリニック向け有効なお知らせ一覧
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    const prisma = getPrismaClient()
    const now = new Date()

    const announcements = await prisma.announcements.findMany({
      where: {
        is_active: true,
        start_at: { lte: now },
        end_at: { gte: now },
        OR: [
          { target_all: true },
          { target_clinic_ids: { has: user.clinicId } },
        ],
      },
      orderBy: { created_at: 'desc' },
    })

    // 既読チェック
    const reads = await prisma.announcement_reads.findMany({
      where: {
        clinic_id: user.clinicId,
        staff_id: user.staffId,
        announcement_id: { in: announcements.map(a => a.id) },
      },
      select: { announcement_id: true },
    })
    const readIds = new Set(reads.map(r => r.announcement_id))

    const result = announcements
      .filter(a => !readIds.has(a.id))
      .map(a => ({
        id: a.id,
        title: a.title,
        content: a.content,
        type: a.type,
        start_at: a.start_at,
        end_at: a.end_at,
      }))

    return NextResponse.json(result)
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}

// POST: お知らせを既読にする
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    const { announcement_id } = await request.json()
    if (!announcement_id) {
      return NextResponse.json({ error: 'announcement_id is required' }, { status: 400 })
    }

    const prisma = getPrismaClient()
    await prisma.announcement_reads.upsert({
      where: {
        announcement_id_staff_id: {
          announcement_id,
          staff_id: user.staffId,
        },
      },
      create: {
        announcement_id,
        clinic_id: user.clinicId,
        staff_id: user.staffId,
      },
      update: {},
    })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }
}
