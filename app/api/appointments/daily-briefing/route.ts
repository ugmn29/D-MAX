import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { verifyAuth } from '@/lib/auth/verify-request'

export async function GET(request: NextRequest) {
  let user
  try {
    user = await verifyAuth(request)
  } catch {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    if (!date) {
      return NextResponse.json({ error: 'date パラメータが必要です' }, { status: 400 })
    }

    const clinicId = user.clinicId
    const prisma = getPrismaClient()

    // 指定日の予約を取得（関連データ含む）
    const appointments = await prisma.appointments.findMany({
      where: {
        clinic_id: clinicId,
        appointment_date: new Date(date),
        is_block: false,
      },
      orderBy: { start_time: 'asc' },
      include: {
        patients: {
          select: { id: true, last_name: true, first_name: true, patient_number: true }
        },
        treatment_menus_appointments_menu1_idTotreatment_menus: {
          select: { id: true, name: true, color: true }
        },
        treatment_menus_appointments_menu2_idTotreatment_menus: {
          select: { id: true, name: true, color: true }
        },
        treatment_menus_appointments_menu3_idTotreatment_menus: {
          select: { id: true, name: true, color: true }
        },
        staff_appointments_staff1_idTostaff: {
          select: { id: true, name: true }
        },
        staff_appointments_staff2_idTostaff: {
          select: { id: true, name: true }
        },
        staff_appointments_staff3_idTostaff: {
          select: { id: true, name: true }
        },
      }
    })

    if (appointments.length === 0) {
      return NextResponse.json([])
    }

    // 患者IDを収集してサブカルテ最新エントリを一括取得
    const patientIds = [...new Set(appointments.map(a => a.patient_id).filter(Boolean))] as string[]

    const subkarteEntries = await prisma.subkarte_entries.findMany({
      where: {
        patient_id: { in: patientIds },
        entry_type: 'text',
        content: { not: null },
      },
      orderBy: { created_at: 'desc' },
      select: { patient_id: true, content: true, created_at: true }
    })

    // 患者ごとに最新1件だけ保持
    const latestSubkarteMap = new Map<string, { content: string; created_at: string }>()
    for (const entry of subkarteEntries) {
      if (!latestSubkarteMap.has(entry.patient_id) && entry.content) {
        latestSubkarteMap.set(entry.patient_id, {
          content: entry.content,
          created_at: entry.created_at?.toISOString() ?? ''
        })
      }
    }

    // 結果を整形
    const result = appointments.map(apt => {
      const formatTime = (t: Date | null) =>
        t ? t.toISOString().substring(11, 16) : null

      return {
        id: apt.id,
        patient_id: apt.patient_id,
        start_time: formatTime(apt.start_time as Date | null),
        end_time: formatTime(apt.end_time as Date | null),
        status: apt.status,
        staff1_id: apt.staff1_id,
        staff2_id: apt.staff2_id,
        staff3_id: apt.staff3_id,
        patient: apt.patients
          ? { id: apt.patients.id, last_name: apt.patients.last_name, first_name: apt.patients.first_name, patient_number: apt.patients.patient_number }
          : null,
        menu1: apt.treatment_menus_appointments_menu1_idTotreatment_menus ?? null,
        menu2: apt.treatment_menus_appointments_menu2_idTotreatment_menus ?? null,
        menu3: apt.treatment_menus_appointments_menu3_idTotreatment_menus ?? null,
        staff1: apt.staff_appointments_staff1_idTostaff ?? null,
        staff2: apt.staff_appointments_staff2_idTostaff ?? null,
        staff3: apt.staff_appointments_staff3_idTostaff ?? null,
        latest_subkarte: apt.patient_id ? (latestSubkarteMap.get(apt.patient_id) ?? null) : null,
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('[daily-briefing] エラー:', error)
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}
