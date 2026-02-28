import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

function isAdminAuthenticated(request: NextRequest): boolean {
  const session = request.cookies.get('__admin_session')?.value
  const secret = process.env.ADMIN_SESSION_SECRET
  return !!session && !!secret && session === secret
}

export async function GET(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }
  try {
    const prisma = getPrismaClient()
    const plans = await (prisma as any).plan_master.findMany({
      orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
    })
    return NextResponse.json(plans)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }
  try {
    const prisma = getPrismaClient()
    const body = await request.json()
    const { name, monthly_fee, description, is_active, sort_order } = body
    if (!name || monthly_fee == null) {
      return NextResponse.json({ error: 'name と monthly_fee は必須です' }, { status: 400 })
    }
    const plan = await (prisma as any).plan_master.create({
      data: {
        name: String(name),
        monthly_fee: Number(monthly_fee),
        description: description || null,
        is_active: is_active !== false,
        sort_order: sort_order != null ? Number(sort_order) : 0,
      },
    })
    return NextResponse.json(plan)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
