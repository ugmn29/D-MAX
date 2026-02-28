import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

function isAdminAuthenticated(request: NextRequest): boolean {
  const session = request.cookies.get('__admin_session')?.value
  const secret = process.env.ADMIN_SESSION_SECRET
  return !!session && !!secret && session === secret
}

function formatClinic(clinic: any) {
  const settings = (clinic.clinic_settings as any)?.settings || {}
  const contractInfo = settings.contract_info || {}
  return {
    ...convertDatesToStrings(clinic, ['created_at']),
    clinic_settings: undefined,
    plan_name: contractInfo.plan_name || 'スタンダード',
    monthly_fee: contractInfo.monthly_fee ?? 29800,
    contract_start: contractInfo.contract_start || null,
    next_billing_date: contractInfo.next_billing_date || null,
    billing_email: contractInfo.billing_email || clinic.email || null,
    status: clinic.status || 'active',
  }
}

export async function GET(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }
  try {
    const prisma = getPrismaClient()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''

    const clinics = await prisma.clinics.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address_line: true,
        created_at: true,
        status: true,
        slug: true,
        hp_url: true,
        postal_code: true,
        prefecture: true,
        city: true,
        clinic_settings: {
          select: { settings: true },
        },
      },
      where: {
        ...(search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: { created_at: 'desc' },
    })

    return NextResponse.json(clinics.map(formatClinic))
  } catch (error: any) {
    console.error('管理者クリニック一覧取得エラー:', error)
    return NextResponse.json({ error: error.message || 'クリニック一覧の取得に失敗しました' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }
  try {
    const prisma = getPrismaClient()
    const body = await request.json()
    const { name, slug, email, phone, postal_code, prefecture, city, address_line, hp_url, status } = body

    if (!name || !slug) {
      return NextResponse.json({ error: 'クリニック名とスラッグは必須です' }, { status: 400 })
    }

    const existing = await prisma.clinics.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json({ error: 'このスラッグはすでに使用されています' }, { status: 409 })
    }

    const clinic = await prisma.clinics.create({
      data: {
        name,
        slug,
        email: email || null,
        phone: phone || null,
        postal_code: postal_code || null,
        prefecture: prefecture || null,
        city: city || null,
        address_line: address_line || null,
        hp_url: hp_url || null,
        status: status || 'active',
      },
    })

    return NextResponse.json({ ok: true, id: clinic.id }, { status: 201 })
  } catch (error: any) {
    console.error('クリニック作成エラー:', error)
    return NextResponse.json({ error: error.message || 'クリニックの作成に失敗しました' }, { status: 500 })
  }
}
