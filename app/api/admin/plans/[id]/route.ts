import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

function isAdminAuthenticated(request: NextRequest): boolean {
  const session = request.cookies.get('__admin_session')?.value
  const secret = process.env.ADMIN_SESSION_SECRET
  return !!session && !!secret && session === secret
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }
  const { id } = await params
  try {
    const prisma = getPrismaClient()
    const body = await request.json()
    const { name, monthly_fee, description, is_active, sort_order } = body
    const plan = await (prisma as any).plan_master.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: String(name) }),
        ...(monthly_fee !== undefined && { monthly_fee: Number(monthly_fee) }),
        ...(description !== undefined && { description: description || null }),
        ...(is_active !== undefined && { is_active: Boolean(is_active) }),
        ...(sort_order !== undefined && { sort_order: Number(sort_order) }),
        updated_at: new Date(),
      },
    })
    return NextResponse.json(plan)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }
  const { id } = await params
  try {
    const prisma = getPrismaClient()
    await (prisma as any).plan_master.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
