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
        clinic_settings: {
          select: { setting_key: true, setting_value: true },
          where: { setting_key: 'contract_info' },
        },
      },
    })
    if (!clinic) return NextResponse.json({ error: 'クリニックが見つかりません' }, { status: 404 })

    const contractRow = (clinic.clinic_settings as any[])?.find(s => s.setting_key === 'contract_info')
    const contractInfo = contractRow?.setting_value || {}
    return NextResponse.json({
      ...convertDatesToStrings(clinic, ['created_at']),
      clinic_settings: undefined,
      plan_name: contractInfo.plan_name || null,
      monthly_fee: contractInfo.monthly_fee != null ? contractInfo.monthly_fee : null,
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
    const { name, email, phone, postal_code, prefecture, city, address_line, hp_url, status, slug,
      plan_name, monthly_fee, contract_start, billing_email } = body

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

    // 契約情報を clinic_settings に保存
    if (plan_name !== undefined || monthly_fee !== undefined || contract_start !== undefined || billing_email !== undefined) {
      const existing = await prisma.clinic_settings.findUnique({
        where: { clinic_id_setting_key: { clinic_id: id, setting_key: 'contract_info' } },
      })
      const current = (existing?.setting_value as any) || {}
      await prisma.clinic_settings.upsert({
        where: { clinic_id_setting_key: { clinic_id: id, setting_key: 'contract_info' } },
        update: {
          setting_value: {
            ...current,
            ...(plan_name !== undefined && { plan_name }),
            ...(monthly_fee !== undefined && { monthly_fee: Number(monthly_fee) }),
            ...(contract_start !== undefined && { contract_start }),
            ...(billing_email !== undefined && { billing_email }),
          },
          updated_at: new Date(),
        },
        create: {
          clinic_id: id,
          setting_key: 'contract_info',
          setting_value: {
            plan_name: plan_name || null,
            monthly_fee: monthly_fee !== undefined ? Number(monthly_fee) : null,
            contract_start: contract_start || null,
            billing_email: billing_email || email || null,
          },
        },
      })
    }

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
