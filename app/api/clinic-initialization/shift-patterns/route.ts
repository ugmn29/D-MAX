/**
 * Clinic Initialization API Route - Shift Patterns
 * シフトパターンの初期化
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'

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

    // 既存のシフトパターンをチェック（重複防止）
    const existingPatterns = await prisma.shift_patterns.findMany({
      where: {
        clinic_id: clinicId
      },
      select: {
        abbreviation: true,
        name: true
      }
    })

    const existingKeys = new Set(
      existingPatterns.map(p => `${p.abbreviation}:${p.name}`)
    )

    console.log(`既存のシフトパターン: ${existingKeys.size}件`, Array.from(existingKeys))

    // デフォルトのシフトパターン
    // 注: 「休み」はシフトパターンではなく、shift_pattern_id を null にすることで表現
    const defaultPatterns = [
      {
        clinic_id: clinicId,
        abbreviation: '日',
        name: '日勤',
        start_time: new Date('1970-01-01T09:00:00.000Z'),
        end_time: new Date('1970-01-01T18:00:00.000Z'),
        break_start: new Date('1970-01-01T12:00:00.000Z'),
        break_end: new Date('1970-01-01T13:00:00.000Z')
      },
      {
        clinic_id: clinicId,
        abbreviation: '遅',
        name: '遅番',
        start_time: new Date('1970-01-01T12:00:00.000Z'),
        end_time: new Date('1970-01-01T21:00:00.000Z'),
        break_start: new Date('1970-01-01T15:00:00.000Z'),
        break_end: new Date('1970-01-01T16:00:00.000Z')
      }
    ]

    // 重複しないものだけフィルタリング
    const newPatterns = defaultPatterns.filter(
      p => !existingKeys.has(`${p.abbreviation}:${p.name}`)
    )

    if (newPatterns.length === 0) {
      console.log('すべてのシフトパターンが既に存在します')
      return NextResponse.json({
        success: true,
        count: 0,
        errors: []
      })
    }

    console.log(`新規作成するシフトパターン: ${newPatterns.length}件`, newPatterns.map(p => p.name))

    // 新しいシフトパターンを作成
    const createPromises = newPatterns.map(pattern =>
      prisma.shift_patterns.create({
        data: pattern
      })
    )

    await Promise.all(createPromises)

    console.log(`✓ ${newPatterns.length}件のシフトパターンを作成しました (${defaultPatterns.length - newPatterns.length}件スキップ)`)

    return NextResponse.json({
      success: true,
      count: newPatterns.length,
      errors: []
    })
  } catch (error: any) {
    console.error('シフトパターン初期化エラー:', error)
    return NextResponse.json(
      {
        success: false,
        count: 0,
        errors: [error.message || '予期しないエラーが発生しました']
      },
      { status: 500 }
    )
  }
}
