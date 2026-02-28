import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

function isAdminAuthenticated(request: NextRequest): boolean {
  const session = request.cookies.get('__admin_session')?.value
  const secret = process.env.ADMIN_SESSION_SECRET
  return !!session && !!secret && session === secret
}

// PUT: お知らせ更新
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }
  const { id } = await params
  const body = await request.json()
  const { title, content, type, target_all, target_clinic_ids, is_active, start_at, end_at } = body

  const prisma = getPrismaClient()
  const announcement = await prisma.announcements.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(content !== undefined && { content }),
      ...(type !== undefined && { type }),
      ...(target_all !== undefined && { target_all }),
      ...(target_clinic_ids !== undefined && { target_clinic_ids }),
      ...(is_active !== undefined && { is_active }),
      ...(start_at !== undefined && { start_at: new Date(start_at) }),
      ...(end_at !== undefined && { end_at: new Date(end_at) }),
      updated_at: new Date(),
    },
  })
  return NextResponse.json(announcement)
}

// DELETE: お知らせ削除
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }
  const { id } = await params
  const prisma = getPrismaClient()
  await prisma.announcements.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
