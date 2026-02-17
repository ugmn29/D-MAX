import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings, AppointmentStatus } from '@/lib/prisma-helpers'
import { LogAction } from '@/lib/prisma-helpers'

/**
 * GET /api/appointment-logs?patient_id=xxx
 * 患者の予約操作ログを取得
 * 患者の予約を先に検索し、それに紐づくログを返す
 */
export async function GET(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient_id')

    if (!patientId) {
      return NextResponse.json(
        { error: 'patient_id is required' },
        { status: 400 }
      )
    }

    // まず患者の予約IDを取得
    const appointments = await prisma.appointments.findMany({
      where: {
        patient_id: patientId
      },
      select: {
        id: true
      }
    })

    if (appointments.length === 0) {
      return NextResponse.json([])
    }

    const appointmentIds = appointments.map(apt => apt.id)

    // 予約IDに紐づくログを取得（operator, appointment情報を含む）
    const logs = await prisma.appointment_logs.findMany({
      where: {
        appointment_id: {
          in: appointmentIds
        }
      },
      include: {
        staff: {
          select: {
            id: true,
            name: true
          }
        },
        appointments: {
          select: {
            id: true,
            appointment_date: true,
            start_time: true,
            end_time: true,
            status: true,
            menu1_id: true,
            staff1_id: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    // スタッフとメニューのマッピングを作成（before_data/after_dataのIDを名前に変換するため）
    const [allStaff, allMenus] = await Promise.all([
      prisma.staff.findMany({ select: { id: true, name: true } }),
      prisma.treatment_menus.findMany({ select: { id: true, name: true } })
    ])

    const staffMap = new Map(allStaff.map(s => [s.id, s.name]))
    const menuMap = new Map(allMenus.map(m => [m.id, m.name]))

    // before_data/after_dataのIDを名前に変換するヘルパー
    const enrichData = (data: Record<string, any> | null | undefined) => {
      if (!data) return data
      const enriched = { ...data } as Record<string, any>

      // スタッフIDを名前に変換
      if (enriched.staff1_id) enriched.staff1_name = staffMap.get(enriched.staff1_id) || enriched.staff1_id
      if (enriched.staff2_id) enriched.staff2_name = staffMap.get(enriched.staff2_id) || enriched.staff2_id
      if (enriched.staff3_id) enriched.staff3_name = staffMap.get(enriched.staff3_id) || enriched.staff3_id

      // メニューIDを名前に変換
      if (enriched.menu1_id) enriched.menu1_name = menuMap.get(enriched.menu1_id) || enriched.menu1_id
      if (enriched.menu2_id) enriched.menu2_name = menuMap.get(enriched.menu2_id) || enriched.menu2_id
      if (enriched.menu3_id) enriched.menu3_name = menuMap.get(enriched.menu3_id) || enriched.menu3_id

      return enriched
    }

    // 時刻フィールドをHH:MM形式に変換するヘルパー
    const formatTimeField = (time: any): string | null => {
      if (!time) return null
      if (time instanceof Date) {
        return time.toISOString().substring(11, 16)
      }
      if (typeof time === 'string' && time.includes('T')) {
        return time.substring(11, 16)
      }
      return String(time)
    }

    // レスポンスを整形
    const result = logs.map(log => {
      const converted = convertDatesToStrings(log, ['created_at'])

      // action enumを日本語文字列に変換
      const actionStr = LogAction.toDb(log.action as any)

      // 予約の日付を取得
      const appointmentDate = log.appointments?.appointment_date instanceof Date
        ? log.appointments.appointment_date.toISOString().split('T')[0]
        : null

      // operator/appointmentのリレーション名を合わせる
      return {
        ...converted,
        action: actionStr,
        before_data: enrichData(log.before_data as Record<string, any> | null),
        after_data: enrichData(log.after_data as Record<string, any> | null),
        operator: converted.staff ? { id: converted.staff.id, name: converted.staff.name } : undefined,
        appointment: converted.appointments ? {
          ...converted.appointments,
          appointment_date: appointmentDate,
          start_time: formatTimeField(log.appointments?.start_time),
          end_time: formatTimeField(log.appointments?.end_time),
          status: log.appointments?.status ? AppointmentStatus.toDb(log.appointments.status as any) : null
        } : undefined,
        // Prismaのリレーション名をクリーンアップ
        staff: undefined,
        appointments: undefined
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('予約操作ログ取得エラー:', error)
    return NextResponse.json(
      { error: '予約操作ログの取得に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/appointment-logs
 * 予約操作ログを作成
 */
export async function POST(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const body = await request.json()
    const { appointment_id, action, before_data, after_data, reason, operator_id, ip_address } = body

    if (!appointment_id || !action || !reason) {
      return NextResponse.json(
        { error: 'appointment_id, action, reason are required' },
        { status: 400 }
      )
    }

    // action文字列をPrisma enumに変換
    const actionEnum = LogAction.fromDb(action)

    // operator_idがUUID形式でない場合はnullにする（'system'等の非UUID値対策）
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const validOperatorId = operator_id && uuidRegex.test(operator_id) ? operator_id : null

    // ip_addressが有効なIPv4/IPv6形式でない場合はnullにする
    const validIpAddress = ip_address && /^[\d.:a-fA-F]+$/.test(ip_address) ? ip_address : null

    const log = await prisma.appointment_logs.create({
      data: {
        appointment_id,
        action: actionEnum,
        before_data: before_data || undefined,
        after_data: after_data || undefined,
        reason,
        operator_id: validOperatorId,
        ip_address: validIpAddress
      },
      include: {
        staff: {
          select: {
            id: true,
            name: true
          }
        },
        appointments: {
          select: {
            id: true,
            appointment_date: true,
            start_time: true,
            end_time: true,
            status: true,
            menu1_id: true,
            staff1_id: true
          }
        }
      }
    })

    // 時刻フィールドをHH:MM形式に変換するヘルパー
    const formatTime = (time: any): string | null => {
      if (!time) return null
      if (time instanceof Date) {
        return time.toISOString().substring(11, 16)
      }
      if (typeof time === 'string' && time.includes('T')) {
        return time.substring(11, 16)
      }
      return String(time)
    }

    // action enumを日本語文字列に変換
    const actionStr = LogAction.toDb(log.action as any)

    const converted = convertDatesToStrings(log, ['created_at'])

    const appointmentDate = log.appointments?.appointment_date instanceof Date
      ? log.appointments.appointment_date.toISOString().split('T')[0]
      : null

    const result = {
      ...converted,
      action: actionStr,
      operator: converted.staff ? { id: converted.staff.id, name: converted.staff.name } : undefined,
      appointment: converted.appointments ? {
        ...converted.appointments,
        appointment_date: appointmentDate,
        start_time: formatTime(log.appointments?.start_time),
        end_time: formatTime(log.appointments?.end_time),
        status: log.appointments?.status ? AppointmentStatus.toDb(log.appointments.status as any) : null
      } : undefined,
      staff: undefined,
      appointments: undefined
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('予約操作ログ作成エラー:', error?.message || error)
    console.error('エラー詳細:', { code: error?.code, meta: error?.meta })
    return NextResponse.json(
      { error: '予約操作ログの作成に失敗しました', details: error?.message, code: error?.code },
      { status: 500 }
    )
  }
}
