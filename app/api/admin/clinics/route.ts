import { NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

export async function GET() {
  try {
    const prisma = getPrismaClient()

    const clinics = await prisma.clinics.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address_line: true,
        created_at: true,
        clinic_settings: {
          select: {
            settings: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    })

    const result = clinics.map((clinic) => {
      const settings = (clinic.clinic_settings as any)?.settings || {}
      const contractInfo = settings.contract_info || {}
      return {
        ...convertDatesToStrings(clinic, ['created_at']),
        plan_name: contractInfo.plan_name || 'スタンダード',
        monthly_fee: contractInfo.monthly_fee ?? 29800,
        contract_start: contractInfo.contract_start || null,
        next_billing_date: contractInfo.next_billing_date || null,
        billing_email: contractInfo.billing_email || clinic.email || null,
      }
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('管理者クリニック一覧取得エラー:', error)
    return NextResponse.json(
      { error: error.message || 'クリニック一覧の取得に失敗しました' },
      { status: 500 }
    )
  }
}
