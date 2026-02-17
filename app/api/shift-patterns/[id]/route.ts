/**
 * Shift Pattern API Route (by ID)
 * シフトパターンの個別操作
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'

// 時刻文字列 (HH:MM) を Date オブジェクトに変換
function timeStringToDate(timeStr: string | null | undefined): Date | null {
  if (!timeStr) return null
  return new Date(`1970-01-01T${timeStr}:00.000Z`)
}

// Date オブジェクトを HH:MM 形式に変換
function dateToTimeString(date: Date | null | undefined): string | null {
  if (!date) return null
  const d = new Date(date)
  const hours = String(d.getUTCHours()).padStart(2, '0')
  const minutes = String(d.getUTCMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patternId } = await params
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')

    if (!clinicId) {
      return NextResponse.json(
        { error: 'clinic_id is required' },
        { status: 400 }
      )
    }

    const body = await request.json()

    const pattern = await prisma.shift_patterns.update({
      where: {
        id: patternId,
        clinic_id: clinicId
      },
      data: {
        abbreviation: body.abbreviation,
        name: body.name,
        start_time: timeStringToDate(body.start_time),
        end_time: timeStringToDate(body.end_time),
        break_start: timeStringToDate(body.break_start),
        break_end: timeStringToDate(body.break_end),
        memo: body.memo,
        updated_at: new Date()
      }
    })

    // Time型をHH:MM文字列に変換して返す
    const formatted = {
      ...pattern,
      start_time: dateToTimeString(pattern.start_time) || '00:00',
      end_time: dateToTimeString(pattern.end_time) || '00:00',
      break_start: dateToTimeString(pattern.break_start),
      break_end: dateToTimeString(pattern.break_end),
      created_at: pattern.created_at?.toISOString() || null,
      updated_at: pattern.updated_at?.toISOString() || null
    }

    return NextResponse.json(formatted)
  } catch (error: any) {
    console.error('シフトパターン更新エラー:', error)
    return NextResponse.json(
      { error: error.message || 'シフトパターンの更新に失敗しました' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patternId } = await params
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')

    if (!clinicId) {
      return NextResponse.json(
        { error: 'clinic_id is required' },
        { status: 400 }
      )
    }

    // このパターンを使用しているシフトがあるかチェック
    const shiftsCount = await prisma.staff_shifts.count({
      where: {
        shift_pattern_id: patternId,
        clinic_id: clinicId
      }
    })

    if (shiftsCount > 0) {
      return NextResponse.json(
        {
          error: `このシフトパターンは${shiftsCount}件のシフトに設定されているため削除できません。先にシフトを変更してください。`
        },
        { status: 400 }
      )
    }

    await prisma.shift_patterns.delete({
      where: {
        id: patternId,
        clinic_id: clinicId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('シフトパターン削除エラー:', error)
    return NextResponse.json(
      { error: error.message || 'シフトパターンの削除に失敗しました' },
      { status: 500 }
    )
  }
}
