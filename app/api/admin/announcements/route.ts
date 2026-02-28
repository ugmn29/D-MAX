import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

function isAdminAuthenticated(request: NextRequest): boolean {
  const session = request.cookies.get('__admin_session')?.value
  const secret = process.env.ADMIN_SESSION_SECRET
  return !!session && !!secret && session === secret
}

// GET: お知らせ一覧
export async function GET(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }
  const prisma = getPrismaClient()
  const announcements = await prisma.announcements.findMany({
    orderBy: { created_at: 'desc' },
  })
  return NextResponse.json(announcements)
}

// POST: お知らせ作成
export async function POST(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }
  const body = await request.json()
  const { title, content, type, target_all, target_clinic_ids, is_active, start_at, end_at } = body

  if (!title || !content || !start_at || !end_at) {
    return NextResponse.json({ error: '必要な項目が不足しています' }, { status: 400 })
  }

  const prisma = getPrismaClient()
  const announcement = await prisma.announcements.create({
    data: {
      title,
      content,
      type: type || 'info',
      target_all: target_all !== false,
      target_clinic_ids: target_all !== false ? [] : (target_clinic_ids || []),
      is_active: is_active !== false,
      start_at: new Date(start_at),
      end_at: new Date(end_at),
    },
  })
  return NextResponse.json(announcement, { status: 201 })
}
