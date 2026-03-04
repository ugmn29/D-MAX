import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth/verify-request'
import { getPrismaClient } from '@/lib/prisma-client'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await verifyAuth(request)
    const { id: clinicId } = await params

    if (user.clinicId !== clinicId) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()), 10)
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth()), 10)

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return NextResponse.json({ error: 'Invalid year/month' }, { status: 400 })
    }

    const prisma = getPrismaClient()

    // クリニック名と契約情報を取得
    const [clinic, settings, sysSettings] = await Promise.all([
      prisma.clinics.findUnique({ where: { id: clinicId }, select: { name: true } }),
      prisma.clinic_settings.findFirst({ where: { clinic_id: clinicId, setting_key: 'contract_info' } }),
      (prisma as any).admin_system_settings.findFirst({ where: { id: 1 } }),
    ])

    const contractInfo = (settings?.setting_value as any) || {}
    const planName = contractInfo.plan_name || 'スタンダード'
    const planFee = contractInfo.monthly_fee ?? 29800
    const smsUnitPrice: number = sysSettings?.sms_unit_price_jpy ?? 10

    // SMS送信数を集計（当月に送信済みのもの）
    const periodStart = new Date(year, month - 1, 1)
    const periodEnd = new Date(year, month, 1) // exclusive

    const smsCountResult = await prisma.patient_notification_schedules.count({
      where: {
        clinic_id: clinicId,
        send_channel: 'sms',
        status: 'sent',
        sent_at: {
          gte: periodStart,
          lt: periodEnd,
        },
      },
    })

    const smsCount = smsCountResult
    const smsTotal = smsCount * smsUnitPrice
    const subtotal = planFee + smsTotal
    const tax = Math.floor(subtotal * 0.1)
    const total = subtotal + tax

    return NextResponse.json({
      clinic_name: clinic?.name || '',
      year,
      month,
      plan_name: planName,
      plan_fee: planFee,
      sms_count: smsCount,
      sms_unit_price: smsUnitPrice,
      sms_total: smsTotal,
      subtotal,
      tax,
      total,
      issuer: sysSettings || null,
    })
  } catch (error: any) {
    console.error('monthly invoice error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
