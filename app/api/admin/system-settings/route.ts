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
    const settings = await (prisma as any).admin_system_settings.findFirst({
      where: { id: 1 },
    })
    return NextResponse.json(settings || { sms_unit_price_jpy: 10 })
  } catch (error: any) {
    console.error('admin system-settings GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }
  try {
    const body = await request.json()
    const {
      issuer_company_name,
      issuer_postal_code,
      issuer_prefecture,
      issuer_city,
      issuer_address_line,
      issuer_phone,
      issuer_registration_number,
      sms_unit_price_jpy,
    } = body

    const prisma = getPrismaClient()
    const updated = await (prisma as any).admin_system_settings.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        issuer_company_name,
        issuer_postal_code,
        issuer_prefecture,
        issuer_city,
        issuer_address_line,
        issuer_phone,
        issuer_registration_number,
        sms_unit_price_jpy: sms_unit_price_jpy ?? 10,
        updated_at: new Date(),
      },
      update: {
        issuer_company_name,
        issuer_postal_code,
        issuer_prefecture,
        issuer_city,
        issuer_address_line,
        issuer_phone,
        issuer_registration_number,
        ...(sms_unit_price_jpy !== undefined ? { sms_unit_price_jpy } : {}),
        updated_at: new Date(),
      },
    })
    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('admin system-settings PUT error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
