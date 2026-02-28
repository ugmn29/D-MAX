import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

function isAdminAuthenticated(request: NextRequest): boolean {
  const session = request.cookies.get('__admin_session')?.value
  const secret = process.env.ADMIN_SESSION_SECRET
  return !!session && !!secret && session === secret
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }
  const { id } = await params
  try {
    const prisma = getPrismaClient()
    const clinic = await prisma.clinics.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address_line: true,
        postal_code: true,
        prefecture: true,
        city: true,
        created_at: true,
        status: true,
        slug: true,
        hp_url: true,
        clinic_settings: { select: { settings: true } },
      },
    })
    if (!clinic) return NextResponse.json({ error: 'クリニックが見つかりません' }, { status: 404 })

    const settings = (clinic.clinic_settings as any)?.settings || {}
    const contractInfo = settings.contract_info || {}
    return NextResponse.json({
      ...convertDatesToStrings(clinic, ['created_at']),
      clinic_settings: undefined,
      plan_name: contractInfo.plan_name || 'スタンダード',
      monthly_fee: contractInfo.monthly_fee ?? 29800,
      contract_start: contractInfo.contract_start || null,
      next_billing_date: contractInfo.next_billing_date || null,
      billing_email: contractInfo.billing_email || clinic.email || null,
      status: clinic.status || 'active',
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }
  const { id } = await params
  try {
    const prisma = getPrismaClient()
    const body = await request.json()
    const { name, email, phone, postal_code, prefecture, city, address_line, hp_url, status, slug } = body

    if (slug) {
      const existing = await prisma.clinics.findFirst({ where: { slug, NOT: { id } } })
      if (existing) {
        return NextResponse.json({ error: 'このスラッグはすでに使用されています' }, { status: 409 })
      }
    }

    await prisma.clinics.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(postal_code !== undefined && { postal_code }),
        ...(prefecture !== undefined && { prefecture }),
        ...(city !== undefined && { city }),
        ...(address_line !== undefined && { address_line }),
        ...(hp_url !== undefined && { hp_url }),
        ...(status !== undefined && { status }),
        ...(slug !== undefined && { slug }),
        updated_at: new Date(),
      },
    })

    return NextResponse.json({ ok: true })
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
    await prisma.clinics.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
