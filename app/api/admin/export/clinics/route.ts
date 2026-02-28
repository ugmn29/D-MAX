import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

function isAdminAuthenticated(request: NextRequest): boolean {
  const session = request.cookies.get('__admin_session')?.value
  const secret = process.env.ADMIN_SESSION_SECRET
  return !!session && !!secret && session === secret
}

function toCsv(rows: string[][]): string {
  return rows
    .map(row =>
      row
        .map(cell => {
          const str = cell == null ? '' : String(cell)
          // Escape double quotes and wrap in quotes if contains comma, newline, or quote
          if (str.includes(',') || str.includes('\n') || str.includes('"')) {
            return `"${str.replace(/"/g, '""')}"`
          }
          return str
        })
        .join(',')
    )
    .join('\r\n')
}

export async function GET(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const prisma = getPrismaClient()
  const clinics = await prisma.clinics.findMany({
    orderBy: { created_at: 'asc' },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      postal_code: true,
      prefecture: true,
      city: true,
      address: true,
      status: true,
      created_at: true,
    },
  })

  // Get contract info from clinic_settings for each clinic
  const settings = await prisma.clinic_settings.findMany({
    where: { clinic_id: { in: clinics.map(c => c.id) } },
    select: { clinic_id: true, settings: true },
  })
  const settingsMap = new Map(settings.map(s => [s.clinic_id, (s.settings as any)?.contract_info || {}]))

  const headers = [
    'ID',
    'クリニック名',
    'メールアドレス',
    '電話番号',
    '郵便番号',
    '都道府県',
    '市区町村',
    '住所',
    'ステータス',
    'プラン名',
    '月額費用',
    '契約開始日',
    '次回更新日',
    'Stripeステータス',
    '登録日',
  ]

  const rows = clinics.map(c => {
    const info = settingsMap.get(c.id) || {}
    return [
      c.id,
      c.name || '',
      c.email || '',
      c.phone || '',
      c.postal_code || '',
      c.prefecture || '',
      c.city || '',
      c.address || '',
      c.status || 'active',
      info.plan_name || '',
      info.monthly_fee != null ? String(info.monthly_fee) : '',
      info.contract_start || '',
      info.next_billing_date || '',
      info.stripe_status || '',
      c.created_at ? new Date(c.created_at).toLocaleDateString('ja-JP') : '',
    ]
  })

  const csv = '\uFEFF' + toCsv([headers, ...rows]) // BOM for Excel UTF-8
  const filename = `clinics_${new Date().toISOString().slice(0, 10)}.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
