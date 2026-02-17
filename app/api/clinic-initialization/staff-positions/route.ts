/**
 * Clinic Initialization API Route - Staff Positions
 * スタッフ役職の初期化
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

    // 既存のスタッフ役職をチェック（重複防止）
    const existingPositions = await prisma.staff_positions.findMany({
      where: {
        clinic_id: clinicId
      },
      select: {
        name: true
      }
    })

    const existingNames = new Set(existingPositions.map(p => p.name))

    console.log(`既存のスタッフ役職: ${existingNames.size}件`, Array.from(existingNames))

    // システムテンプレートを取得
    const templates = await prisma.system_staff_positions.findMany({
      where: {
        is_active: true
      },
      orderBy: {
        sort_order: 'asc'
      }
    })

    console.log(`スタッフ役職テンプレート: ${templates.length}件`)

    // 重複しないものだけフィルタリング
    const newTemplates = templates.filter(t => !existingNames.has(t.name))

    if (newTemplates.length === 0) {
      console.log('すべてのスタッフ役職が既に存在します')
      return NextResponse.json({
        success: true,
        count: 0,
        errors: []
      })
    }

    console.log(`新規作成するスタッフ役職: ${newTemplates.length}件`, newTemplates.map(t => t.name))

    // 新しい役職を作成
    const createPromises = newTemplates.map(template =>
      prisma.staff_positions.create({
        data: {
          clinic_id: clinicId,
          template_id: template.id,
          name: template.name,
          sort_order: template.sort_order
        }
      })
    )

    await Promise.all(createPromises)

    console.log(`✓ ${newTemplates.length}件のスタッフ役職を作成しました (${templates.length - newTemplates.length}件スキップ)`)

    return NextResponse.json({
      success: true,
      count: newTemplates.length,
      errors: []
    })
  } catch (error: any) {
    console.error('スタッフ役職初期化エラー:', error)
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
