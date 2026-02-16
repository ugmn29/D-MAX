/**
 * Staff Shifts API Route - Prisma版
 * サーバーサイド専用
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { convertToDate } from '@/lib/prisma/helpers'

// Date オブジェクトを HH:MM 形式に変換
function dateToTimeString(date: Date | null | undefined): string | null {
  if (!date) return null
  const d = new Date(date)
  const hours = String(d.getUTCHours()).padStart(2, '0')
  const minutes = String(d.getUTCMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

// shift_patternsのTime型フィールドをHH:MM文字列に変換
function formatShiftPatternTimes(pattern: any) {
  if (!pattern) return null
  return {
    ...pattern,
    start_time: dateToTimeString(pattern.start_time) || '00:00',
    end_time: dateToTimeString(pattern.end_time) || '00:00',
    break_start: dateToTimeString(pattern.break_start),
    break_end: dateToTimeString(pattern.break_end)
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')
    const year = searchParams.get('year')
    const month = searchParams.get('month')
    const date = searchParams.get('date')

    if (!clinicId) {
      return NextResponse.json(
        { error: 'clinic_id is required' },
        { status: 400 }
      )
    }

    let whereClause: any = { clinic_id: clinicId }

    // 特定の日付が指定されている場合
    if (date) {
      whereClause.date = new Date(date)
    }
    // 年月が指定されている場合は日付範囲でフィルタ
    else if (year && month) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
      const endDate = new Date(parseInt(year), parseInt(month), 0)
      whereClause.date = {
        gte: startDate,
        lte: endDate
      }
    }

    const shifts = await prisma.staff_shifts.findMany({
      where: whereClause,
      include: {
        shift_patterns: {
          select: {
            id: true,
            abbreviation: true,
            name: true,
            start_time: true,
            end_time: true,
            break_start: true,
            break_end: true
          }
        },
        staff: {
          select: {
            id: true,
            name: true,
            name_kana: true,
            position_id: true,
            role: true,
            is_active: true,
            staff_positions: {
              select: {
                id: true,
                name: true,
                sort_order: true
              }
            }
          }
        }
      },
      orderBy: {
        date: 'asc'
      }
    })

    const result = shifts.map(shift => ({
      id: shift.id,
      clinic_id: shift.clinic_id,
      staff_id: shift.staff_id,
      date: convertToDate(shift.date).toISOString().split('T')[0],
      shift_pattern_id: shift.shift_pattern_id,
      is_holiday: shift.is_holiday ?? false,
      created_at: convertToDate(shift.created_at).toISOString(),
      updated_at: convertToDate(shift.updated_at).toISOString(),
      shift_patterns: formatShiftPatternTimes(shift.shift_patterns),
      staff: shift.staff ? {
        id: shift.staff.id,
        name: shift.staff.name,
        name_kana: shift.staff.name_kana,
        position_id: shift.staff.position_id,
        role: shift.staff.role,
        is_active: shift.staff.is_active,
        position: shift.staff.staff_positions
      } : null
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('シフト取得エラー:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')

    if (!clinicId) {
      return NextResponse.json(
        { error: 'clinic_id is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    console.log('シフト作成リクエスト:', { clinicId, body })

    // Upsert処理（既存データがあれば更新、なければ作成）
    const shift = await prisma.staff_shifts.upsert({
      where: {
        clinic_id_staff_id_date: {
          clinic_id: clinicId,
          staff_id: body.staff_id,
          date: new Date(body.date)
        }
      },
      update: {
        shift_pattern_id: body.shift_pattern_id === 'none' ? null : body.shift_pattern_id,
        is_holiday: body.is_holiday ?? false,
        updated_at: new Date()
      },
      create: {
        clinic_id: clinicId,
        staff_id: body.staff_id,
        date: new Date(body.date),
        shift_pattern_id: body.shift_pattern_id === 'none' ? null : body.shift_pattern_id,
        is_holiday: body.is_holiday ?? false
      },
      include: {
        shift_patterns: {
          select: {
            id: true,
            abbreviation: true,
            name: true,
            start_time: true,
            end_time: true,
            break_start: true,
            break_end: true
          }
        },
        staff: {
          select: {
            id: true,
            name: true,
            name_kana: true,
            position_id: true,
            role: true,
            is_active: true,
            staff_positions: {
              select: {
                id: true,
                name: true,
                sort_order: true
              }
            }
          }
        }
      }
    })

    console.log('シフト作成成功:', shift.id)

    const result = {
      id: shift.id,
      clinic_id: shift.clinic_id,
      staff_id: shift.staff_id,
      date: convertToDate(shift.date).toISOString().split('T')[0],
      shift_pattern_id: shift.shift_pattern_id,
      is_holiday: shift.is_holiday ?? false,
      created_at: convertToDate(shift.created_at).toISOString(),
      updated_at: convertToDate(shift.updated_at).toISOString(),
      shift_patterns: formatShiftPatternTimes(shift.shift_patterns),
      staff: shift.staff ? {
        id: shift.staff.id,
        name: shift.staff.name,
        name_kana: shift.staff.name_kana,
        position_id: shift.staff.position_id,
        role: shift.staff.role,
        is_active: shift.staff.is_active,
        position: shift.staff.staff_positions
      } : null
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('シフト作成エラー:', error)
    console.error('エラー詳細:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    })
    return NextResponse.json(
      {
        error: 'シフトの作成に失敗しました',
        details: error.message,
        code: error.code
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')
    const shiftId = searchParams.get('shift_id')

    if (!clinicId || !shiftId) {
      return NextResponse.json(
        { error: 'clinic_id and shift_id are required' },
        { status: 400 }
      )
    }

    await prisma.staff_shifts.delete({
      where: {
        id: shiftId,
        clinic_id: clinicId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('シフト削除エラー:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
