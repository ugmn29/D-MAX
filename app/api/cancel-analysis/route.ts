import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

/**
 * GET /api/cancel-analysis
 * キャンセル分析データを取得
 */
export async function GET(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    if (!clinicId) {
      return NextResponse.json(
        { error: 'clinic_id is required' },
        { status: 400 }
      )
    }

    const where: any = {
      clinic_id: clinicId,
      status: 'キャンセル',
      cancel_reason_id: { not: null }
    }

    if (startDate) where.appointment_date = { ...where.appointment_date, gte: startDate }
    if (endDate) where.appointment_date = { ...where.appointment_date, lte: endDate }

    const cancelledAppointments = await prisma.appointments.findMany({
      where,
      include: {
        patients: {
          select: { id: true, is_registered: true }
        },
        cancel_reasons: {
          select: { id: true, name: true }
        }
      }
    })

    // データを集計
    const total_cancelled = cancelledAppointments.length
    const registered_cancelled = cancelledAppointments.filter(apt => apt.patients?.is_registered).length
    const temporary_cancelled = total_cancelled - registered_cancelled

    // 理由別集計
    const reasonMap = new Map<string, {
      reason_id: string
      reason_name: string
      count: number
      registered_count: number
      temporary_count: number
    }>()

    cancelledAppointments.forEach(apt => {
      const reasonId = apt.cancel_reason_id!
      const reasonName = apt.cancel_reasons?.name || '不明'
      const isRegistered = apt.patients?.is_registered || false

      if (!reasonMap.has(reasonId)) {
        reasonMap.set(reasonId, {
          reason_id: reasonId,
          reason_name: reasonName,
          count: 0,
          registered_count: 0,
          temporary_count: 0
        })
      }

      const reason = reasonMap.get(reasonId)!
      reason.count++
      if (isRegistered) {
        reason.registered_count++
      } else {
        reason.temporary_count++
      }
    })

    const reasons = Array.from(reasonMap.values())

    // 日別集計
    const dailyMap = new Map<string, {
      date: string
      total_cancelled: number
      registered_cancelled: number
      temporary_cancelled: number
    }>()

    cancelledAppointments.forEach(apt => {
      const date = apt.appointment_date
      const isRegistered = apt.patients?.is_registered || false

      if (!dailyMap.has(date)) {
        dailyMap.set(date, {
          date,
          total_cancelled: 0,
          registered_cancelled: 0,
          temporary_cancelled: 0
        })
      }

      const daily = dailyMap.get(date)!
      daily.total_cancelled++
      if (isRegistered) {
        daily.registered_cancelled++
      } else {
        daily.temporary_cancelled++
      }
    })

    const daily_stats = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json({
      total_cancelled,
      registered_cancelled,
      temporary_cancelled,
      reasons,
      daily_stats
    })
  } catch (error) {
    console.error('キャンセル分析データ取得エラー:', error)
    return NextResponse.json(
      { error: 'キャンセル分析データの取得に失敗しました' },
      { status: 500 }
    )
  }
}
