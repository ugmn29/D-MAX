/**
 * Shift Patterns API Route
 * シフトパターンのCRUD操作
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')

    if (!clinicId) {
      return NextResponse.json(
        { error: 'clinic_id is required' },
        { status: 400 }
      )
    }

    const patterns = await prisma.shift_patterns.findMany({
      where: {
        clinic_id: clinicId
      },
      orderBy: {
        abbreviation: 'asc'
      }
    })

    // Time型をHH:MM文字列に変換
    const formatted = patterns.map(p => ({
      ...p,
      start_time: dateToTimeString(p.start_time) || '00:00',
      end_time: dateToTimeString(p.end_time) || '00:00',
      break_start: dateToTimeString(p.break_start),
      break_end: dateToTimeString(p.break_end),
      created_at: p.created_at?.toISOString() || null,
      updated_at: p.updated_at?.toISOString() || null
    }))

    return NextResponse.json(formatted)
  } catch (error: any) {
    console.error('シフトパターン取得エラー:', error)
    return NextResponse.json(
      { error: error.message || 'シフトパターンの取得に失敗しました' },
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

    const pattern = await prisma.shift_patterns.create({
      data: {
        clinic_id: clinicId,
        abbreviation: body.abbreviation,
        name: body.name,
        start_time: timeStringToDate(body.start_time),
        end_time: timeStringToDate(body.end_time),
        break_start: timeStringToDate(body.break_start),
        break_end: timeStringToDate(body.break_end),
        memo: body.memo
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
    console.error('シフトパターン作成エラー:', error)
    return NextResponse.json(
      { error: error.message || 'シフトパターンの作成に失敗しました' },
      { status: 500 }
    )
  }
}
